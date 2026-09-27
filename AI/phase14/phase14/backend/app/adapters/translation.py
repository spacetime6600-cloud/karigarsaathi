"""
Phase 14 — Sarvam Translation Adapter.
Integrates directly with Sarvam AI's official Text Translation API (https://api.sarvam.ai/translate).
No local Ollama or Faster Whisper dependencies.
"""
from __future__ import annotations

import logging
from typing import Optional, Dict, Any, List
import httpx

from backend.app.core.config import settings

logger = logging.getLogger(__name__)

# Languages where speech recognition is verified working via Sarvam Saaras AI
SPEECH_SUPPORTED_LANGUAGES: dict[str, bool] = {
    "hi": True,   # Hindi   — Sarvam Saaras: fully supported
    "en": True,   # English — Sarvam Saaras: fully supported
    "bn": True,   # Bengali — Sarvam Saaras: fully supported
    "te": True,   # Telugu  — Sarvam Saaras: fully supported
    "or": True,   # Odia    — Sarvam Saaras: natively supported (od-IN)
}

LANGUAGE_NAMES: dict[str, str] = {
    "hi": "Hindi",
    "en": "English",
    "bn": "Bengali",
    "te": "Telugu",
    "or": "Odia",
    "ta": "Tamil",
    "gu": "Gujarati",
    "mr": "Marathi",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
}

# Sarvam Translate BCP-47 language codes
SARVAM_TRANSLATE_LANG_MAP: dict[str, str] = {
    "hi": "hi-IN",
    "en": "en-IN",
    "bn": "bn-IN",
    "te": "te-IN",
    "or": "od-IN",
    "ta": "ta-IN",
    "gu": "gu-IN",
    "mr": "mr-IN",
    "kn": "kn-IN",
    "ml": "ml-IN",
    "pa": "pa-IN",
}


class SarvamTranslator:
    """
    Translates text using Sarvam AI's official Translation REST API (https://api.sarvam.ai/translate).

    Translation routing (per specification):
    - Hindi  : preserve Hindi; produce English output via Sarvam
    - English: preserve English; produce Hindi output via Sarvam
    - Odia, Bengali, Telugu: translate to English first, then English to Hindi
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: str = "https://api.sarvam.ai",
        model: str = "mayura:v1",
        timeout_seconds: float = 30.0,
    ) -> None:
        self._api_key = api_key or (
            settings.sarvam_api_key.get_secret_value()
            if getattr(settings, "sarvam_api_key", None)
            else None
        )
        self._base_url = base_url.rstrip("/")
        self._model = model or getattr(settings, "sarvam_translate_model", "mayura:v1")
        self._timeout_seconds = timeout_seconds

    def _call_sarvam_sync(self, text: str, src_lang: str, tgt_lang: str) -> str:
        """Synchronously execute a translation request to Sarvam AI."""
        if not text or not text.strip():
            return ""

        src_code = SARVAM_TRANSLATE_LANG_MAP.get(src_lang, f"{src_lang}-IN")
        tgt_code = SARVAM_TRANSLATE_LANG_MAP.get(tgt_lang, f"{tgt_lang}-IN")

        # Identity optimization (saves credits if source and target are identical)
        if src_code == tgt_code:
            return text.strip()

        if not self._api_key:
            raise RuntimeError("SARVAM_KEY_MISSING: SARVAM_API_KEY is not configured on the server")

        headers = {
            "api-subscription-key": self._api_key,
            "Content-Type": "application/json",
        }
        payload = {
            "input": text.strip(),
            "source_language_code": src_code,
            "target_language_code": tgt_code,
            "model": self._model,
            "mode": "formal",
        }

        try:
            with httpx.Client(timeout=self._timeout_seconds) as client:
                response = client.post(
                    f"{self._base_url}/translate",
                    headers=headers,
                    json=payload,
                )

            if response.status_code == 200:
                data = response.json()
                translated = data.get("translated_text", "").strip()
                if not translated:
                    logger.warning("Empty translated_text returned by Sarvam API")
                    return text.strip()
                logger.info(f"Sarvam translation successful ({src_code}->{tgt_code})")
                return translated

            # Handle structured errors
            try:
                err_data = response.json()
                err_msg = (
                    err_data.get("error", {}).get("message")
                    or err_data.get("detail")
                    or response.text
                )
            except Exception:
                err_msg = response.text or f"HTTP {response.status_code}"

            if response.status_code == 401:
                raise RuntimeError("SARVAM_KEY_INVALID: Invalid or expired Sarvam API key")
            elif response.status_code == 402:
                raise RuntimeError("SARVAM_INSUFFICIENT_CREDITS: Insufficient Sarvam API credits or quota exhausted")
            elif response.status_code == 429:
                raise RuntimeError("SARVAM_RATE_LIMITED: Sarvam API rate limit exceeded. Please retry shortly")
            else:
                raise RuntimeError(f"SARVAM_HTTP_{response.status_code}: {err_msg}")

        except httpx.TimeoutException as exc:
            logger.error(f"Sarvam translation request timed out: {exc}")
            raise RuntimeError("SARVAM_NETWORK_TIMEOUT: Sarvam translation request timed out") from exc
        except httpx.RequestError as exc:
            logger.error(f"Sarvam translation network error: {exc}")
            raise RuntimeError(f"SARVAM_NETWORK_ERROR: Unable to connect to Sarvam API: {str(exc)}") from exc

    def translate(
        self,
        corrected_transcript: str,
        source_language: str,
    ) -> Dict[str, Any]:
        """
        Apply translation routing rules via Sarvam API and return all outputs.
        Preserves original and corrected transcript even if translation encounters an issue.

        Returns:
            {
              "original_transcript": str,
              "corrected_transcript": str,
              "hindi_output": str | None,
              "english_output": str | None,
              "routing_path": list[str],
              "review_required": bool,
              "review_reason": str | None,
            }
        """
        text = corrected_transcript.strip()
        src = source_language

        result: Dict[str, Any] = {
            "original_transcript": text,
            "corrected_transcript": text,
            "hindi_output": None,
            "english_output": None,
            "routing_path": [],
            "review_required": False,
            "review_reason": None,
        }

        if not text:
            result["review_required"] = True
            result["review_reason"] = "Empty transcript — manual entry required"
            return result

        try:
            if src == "hi":
                # Preserve Hindi; translate to English
                result["hindi_output"] = text
                result["routing_path"].append("hi (preserved)")
                result["english_output"] = self._call_sarvam_sync(text, "hi", "en")
                result["routing_path"].append("hi -> en (Sarvam)")

            elif src == "en":
                # Preserve English; translate to Hindi
                result["english_output"] = text
                result["routing_path"].append("en (preserved)")
                result["hindi_output"] = self._call_sarvam_sync(text, "en", "hi")
                result["routing_path"].append("en -> hi (Sarvam)")

            elif src in ("or", "bn", "te", "ta", "gu", "mr", "kn", "ml", "pa"):
                # Translate regional -> English, then English -> Hindi
                result["routing_path"].append(f"{src} (original)")
                english = self._call_sarvam_sync(text, src, "en")
                result["english_output"] = english
                result["routing_path"].append(f"{src} -> en (Sarvam)")

                hindi = self._call_sarvam_sync(english, "en", "hi")
                result["hindi_output"] = hindi
                result["routing_path"].append("en -> hi (Sarvam)")

            else:
                result["review_required"] = True
                result["review_reason"] = f"Unsupported source language: {src}"

        except Exception as exc:
            logger.error(f"Sarvam translation failed: {exc}")
            result["review_required"] = True
            result["review_reason"] = str(exc)

        return result


# Backward-compatible alias for existing imports
OllamaSarvamTranslator = SarvamTranslator


def check_speech_support(language: str) -> tuple[bool, str]:
    """
    Returns (supported: bool, message: str).
    Sarvam Saaras AI natively supports all regional Indian languages (Hindi, English, Bengali, Odia, Telugu, etc.).
    """
    supported = SPEECH_SUPPORTED_LANGUAGES.get(language, False)
    if supported:
        return True, ""
    lang_name = LANGUAGE_NAMES.get(language, language)
    return False, (
        f"Speech recognition for {lang_name} ({language}) is not supported. "
        f"Please type your description manually or select a supported dialect."
    )
