"""Unit and integration tests for Sarvam AI Speech-to-Text and Translation adapters.

All external calls to Sarvam API endpoints (https://api.sarvam.ai/*) are strictly mocked.
Zero live API credits are consumed during test execution.
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
import httpx
from httpx import AsyncClient, ASGITransport

from backend.main import app
from backend.app.adapters.speech.sarvam import SarvamSpeechAdapter
from backend.app.adapters.speech.base import SpeechTranscriptionRequest
from backend.app.adapters.speech.errors import TranscriptionError
from backend.app.adapters.translation import SarvamTranslator


# ---------------------------------------------------------------------------
# 1. Health Check Tests (Zero Credit Consumption)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_health_check_zero_credits():
    """Verify /health endpoint returns Sarvam engine info with zero network calls."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["speech_engine"] == "sarvam"
        assert data["speech_model"] == "saaras:v3"
        assert "hi" in data["supported_languages"]
        assert "or" in data["supported_languages"]
        assert "bn" in data["supported_languages"]
        assert "en" in data["supported_languages"]


# ---------------------------------------------------------------------------
# 2. SarvamSpeechAdapter STT Tests (Mocked API via httpx.AsyncClient.post)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sarvam_speech_adapter_success():
    """Verify SarvamSpeechAdapter parses successful API response into TranscriptionResult."""
    adapter = SarvamSpeechAdapter(api_key="test_mock_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "transcript": "यह एक सुंदर हाथ से बनी संबलपुरी साड़ी है",
        "language_code": "hi-IN",
    }

    dummy_audio = b"\x00" * 3200
    req = SpeechTranscriptionRequest(
        audio_data=dummy_audio,
        format="wav",
        language_hint="hi",
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp) as mock_post:
        result = await adapter.transcribe(req)

        assert mock_post.called
        call_kwargs = mock_post.call_args[1]
        assert call_kwargs["headers"]["api-subscription-key"] == "test_mock_key"
        assert call_kwargs["data"]["language_code"] == "hi-IN"
        assert call_kwargs["data"]["model"] == "saaras:v3"

        assert result.status == "completed"
        assert result.language == "hi"
        assert result.original_text == "यह एक सुंदर हाथ से बनी संबलपुरी साड़ी है"
        assert len(result.segments) == 1
        assert result.segments[0].text == "यह एक सुंदर हाथ से बनी संबलपुरी साड़ी है"


@pytest.mark.asyncio
async def test_sarvam_speech_adapter_odia_language_mapping():
    """Verify Odia language code 'or' maps to Sarvam's 'od-IN' and back to 'or'."""
    adapter = SarvamSpeechAdapter(api_key="test_mock_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "transcript": "ଏହା ଏକ ହାତ ତିଆରି ଶାଢ଼ୀ",
        "language_code": "od-IN",
    }

    req = SpeechTranscriptionRequest(
        audio_data=b"\x00" * 3200,
        format="wav",
        language_hint="or",
    )

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp) as mock_post:
        result = await adapter.transcribe(req)
        assert mock_post.call_args[1]["data"]["language_code"] == "od-IN"
        assert result.language == "or"
        assert "ଶାଢ଼ୀ" in result.original_text


@pytest.mark.asyncio
async def test_sarvam_speech_adapter_401_error_mapping():
    """Verify 401 returns SARVAM_KEY_INVALID error code without raw tracebacks."""
    adapter = SarvamSpeechAdapter(api_key="invalid_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.json.return_value = {"error": {"message": "Invalid subscription key"}}

    req = SpeechTranscriptionRequest(audio_data=b"\x00" * 3200, format="wav")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        with pytest.raises(TranscriptionError) as exc_info:
            await adapter.transcribe(req)
        assert exc_info.value.error_code == "SARVAM_KEY_INVALID"
        assert "Invalid" in exc_info.value.message


@pytest.mark.asyncio
async def test_sarvam_speech_adapter_402_insufficient_credits():
    """Verify 402 returns SARVAM_INSUFFICIENT_CREDITS."""
    adapter = SarvamSpeechAdapter(api_key="exhausted_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 402
    mock_resp.json.return_value = {"error": {"message": "Out of credits"}}

    req = SpeechTranscriptionRequest(audio_data=b"\x00" * 3200, format="wav")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        with pytest.raises(TranscriptionError) as exc_info:
            await adapter.transcribe(req)
        assert exc_info.value.error_code == "SARVAM_INSUFFICIENT_CREDITS"
        assert "credits" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_sarvam_speech_adapter_network_timeout():
    """Verify network timeout raises retryable TranscriptionError."""
    adapter = SarvamSpeechAdapter(api_key="test_key")

    req = SpeechTranscriptionRequest(audio_data=b"\x00" * 3200, format="wav")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(TranscriptionError) as exc_info:
            await adapter.transcribe(req)
        assert exc_info.value.error_code == "SARVAM_NETWORK_TIMEOUT"
        assert exc_info.value.retryable is True


# ---------------------------------------------------------------------------
# 3. SarvamTranslator Text Translation Tests (Mocked API via httpx.Client.post)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_sarvam_translator_success():
    """Verify SarvamTranslator translates source Hindi into English via Mayura API."""
    translator = SarvamTranslator(api_key="test_mock_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "translated_text": "This is a handmade Sambalpuri saree woven with mulberry silk."
    }

    with patch("httpx.Client.post", return_value=mock_resp) as mock_post:
        result = translator.translate(
            corrected_transcript="यह शहतूत रेशम से बनी हाथ से बुनी संबलपुरी साड़ी है।",
            source_language="hi",
        )
        assert mock_post.called
        req_json = mock_post.call_args[1]["json"]
        assert req_json["source_language_code"] == "hi-IN"
        assert req_json["target_language_code"] == "en-IN"
        assert req_json["model"] == "mayura:v1"

        assert result["english_output"] == "This is a handmade Sambalpuri saree woven with mulberry silk."
        assert result["hindi_output"] == "यह शहतूत रेशम से बनी हाथ से बुनी संबलपुरी साड़ी है।"
        assert result["original_transcript"] == "यह शहतूत रेशम से बनी हाथ से बुनी संबलपुरी साड़ी है।"
        assert result["review_required"] is False


@pytest.mark.asyncio
async def test_sarvam_translator_preserves_artisan_transcript_on_failure():
    """Verify that if the translation API fails, the artisan's edited text is never lost."""
    translator = SarvamTranslator(api_key="bad_or_expired_key")

    mock_resp = MagicMock()
    mock_resp.status_code = 401
    mock_resp.text = "Unauthorized"

    with patch("httpx.Client.post", return_value=mock_resp):
        original = "यह मेरा हस्तनिर्मित उत्पाद है।"
        result = translator.translate(
            corrected_transcript=original,
            source_language="hi",
        )
        # Should gracefully return source text without crashing or wiping artisan input
        assert result["original_transcript"] == original
        assert result["corrected_transcript"] == original
        assert result["review_required"] is True
