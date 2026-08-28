"""
Phase 14 — Sarvam Translation Adapter
Calls Ollama /api/generate with phase14-sarvam (sarvam-translate).
Uses POST /api/generate, passes model/system/prompt/stream=false.
Returns the `response` field.
"""
from __future__ import annotations

import json
import logging
import urllib.request
import urllib.error
from typing import Optional

logger = logging.getLogger(__name__)

# Languages where speech recognition is verified working via Faster Whisper base model
SPEECH_SUPPORTED_LANGUAGES: dict[str, bool] = {
    "hi": True,   # Hindi   — Whisper: well supported
    "en": True,   # English — Whisper: well supported
    "bn": True,   # Bengali — Whisper: supported (limited accuracy on artisan dialect)
    "te": True,   # Telugu  — Whisper: supported (limited accuracy)
    "or": False,  # Odia    — Whisper: NOT supported; explicit blocker required
}

LANGUAGE_NAMES: dict[str, str] = {
    "hi": "Hindi",
    "en": "English",
    "bn": "Bengali",
    "te": "Telugu",
    "or": "Odia",
}


class OllamaSarvamTranslator:
    """
    Translates text using the phase14-sarvam model via Ollama /api/generate.

    Translation routing (per spec):
    - Hindi  : preserve Hindi; produce English output
    - English: preserve English; produce Hindi output
    - Odia, Bengali, Telugu: translate to English first, then English to Hindi
    """

    OLLAMA_BASE = "http://127.0.0.1:11434"
    MODEL = "phase14-sarvam"
    TIMEOUT = 120  # seconds per call

    def _call(self, system: str, prompt: str, retries: int = 2) -> str:
        """Single synchronous call to Ollama /api/generate with retry on connection reset."""
        payload = json.dumps({
            "model": self.MODEL,
            "system": system,
            "prompt": prompt,
            "stream": False,
        }).encode("utf-8")

        req = urllib.request.Request(
            f"{self.OLLAMA_BASE}/api/generate",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        last_exc: Exception | None = None
        for attempt in range(1, retries + 1):
            try:
                with urllib.request.urlopen(req, timeout=self.TIMEOUT) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                result = data.get("response", "").strip()
                if not result:
                    raise ValueError(
                        f"Empty response from {self.MODEL} — treat as requiring review"
                    )
                return result
            except urllib.error.URLError as exc:
                raise RuntimeError(f"Ollama unreachable: {exc}") from exc
            except (ConnectionResetError, ConnectionError) as exc:
                last_exc = exc
                logger.warning(f"Ollama connection reset (attempt {attempt}/{retries}): {exc}")
                import time
                time.sleep(2 * attempt)
                # Recreate request object for retry
                req = urllib.request.Request(
                    f"{self.OLLAMA_BASE}/api/generate",
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                continue

        raise RuntimeError(
            f"Ollama connection reset after {retries} attempts — treat as requiring review. Error: {last_exc}"
        )

    def _translate(self, text: str, src: str, tgt: str) -> str:
        """Translate text from src language to tgt language."""
        src_name = LANGUAGE_NAMES.get(src, src)
        tgt_name = LANGUAGE_NAMES.get(tgt, tgt)
        system = (
            f"You are an expert translator specializing in Indian artisan crafts. "
            f"Translate the following text strictly from {src_name} into {tgt_name}. "
            f"Do not add any information not present in the source. "
            f"Output only the translated text, nothing else."
        )
        logger.info(f"Translating {src}->{tgt}: {text[:60]}...")
        result = self._call(system, text)
        logger.info(f"Translation result ({src}->{tgt}): {result[:60]}...")
        return result

    def translate(
        self,
        corrected_transcript: str,
        source_language: str,
    ) -> dict:
        """
        Apply translation routing rules and return all outputs.

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

        result = {
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
                result["english_output"] = self._translate(text, "hi", "en")
                result["routing_path"].append("hi -> en")

            elif src == "en":
                # Preserve English; translate to Hindi
                result["english_output"] = text
                result["routing_path"].append("en (preserved)")
                result["hindi_output"] = self._translate(text, "en", "hi")
                result["routing_path"].append("en -> hi")

            elif src in ("or", "bn", "te"):
                # Translate regional -> English, then English -> Hindi
                result["routing_path"].append(f"{src} (original)")
                english = self._translate(text, src, "en")
                result["english_output"] = english
                result["routing_path"].append(f"{src} -> en")

                hindi = self._translate(english, "en", "hi")
                result["hindi_output"] = hindi
                result["routing_path"].append("en -> hi")

            else:
                result["review_required"] = True
                result["review_reason"] = f"Unsupported source language: {src}"

        except (RuntimeError, ValueError) as exc:
            result["review_required"] = True
            result["review_reason"] = str(exc)
            logger.warning(f"Translation failed: {exc}")

        return result


def check_speech_support(language: str) -> tuple[bool, str]:
    """
    Returns (supported: bool, message: str).
    This is a verified capability check based on actual Whisper model behaviour.
    If unsupported, the blocker message instructs the user to type manually.
    """
    supported = SPEECH_SUPPORTED_LANGUAGES.get(language, False)
    if supported:
        return True, ""
    lang_name = LANGUAGE_NAMES.get(language, language)
    return False, (
        f"Speech recognition for {lang_name} ({language}) is not supported by the "
        f"Faster Whisper base model. Please type your description manually in "
        f"{lang_name}, or switch to Hindi, English, Bengali, or Telugu."
    )
