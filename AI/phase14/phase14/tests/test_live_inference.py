import io
import wave
import pytest
import numpy as np
from httpx import AsyncClient, ASGITransport

from backend.main import app


def create_test_wav(duration=1.5, sample_rate=16000):
    t = np.linspace(0, duration, int(sample_rate * duration), False)
    tone = np.sin(2 * np.pi * 440 * t) * 20000
    audio_int16 = tone.astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_int16.tobytes())
    return buf.getvalue()


@pytest.mark.asyncio
async def test_health():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert "en" in data["supported_languages"]
        assert "hi" in data["supported_languages"]


@pytest.mark.asyncio
async def test_full_session_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Create Session
        res = await client.post(
            "/api/v1/catalogue-sessions",
            json={"selected_language": "hi", "consent_granted": True},
            headers={"Authorization": "Bearer mock_firebase_artisan_user"},
        )
        assert res.status_code == 200
        session_id = res.json()["session_id"]
        assert session_id

        # 2. Upload Audio
        wav_bytes = create_test_wav(duration=1.0)
        res = await client.post(
            f"/api/v1/catalogue-sessions/{session_id}/audio",
            files={"audio_file": ("test.wav", wav_bytes, "audio/wav")},
            headers={"Authorization": "Bearer mock_firebase_artisan_user"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "uploaded"

        # 3. Process Audio (Faster Whisper)
        res = await client.post(
            f"/api/v1/catalogue-sessions/{session_id}/process",
            headers={"Authorization": "Bearer mock_firebase_artisan_user"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "awaiting_transcript_review"

        # 4. Correct Transcript
        sample_transcript = "यह पारंपरिक हथकरघा जामदानी रेशम साड़ी है। इसमें प्राकृतिक रंगों का प्रयोग हुआ है और लंबाई 5.5 मीटर है।"
        res = await client.patch(
            f"/api/v1/catalogue-sessions/{session_id}/transcript",
            json={"corrected_text": sample_transcript},
            headers={"Authorization": "Bearer mock_firebase_artisan_user"},
        )
        assert res.status_code == 200
        assert res.json()["corrected_text"] == sample_transcript

        # 5. Generate Catalogue
        res = await client.post(
            f"/api/v1/catalogue-sessions/{session_id}/generate",
            headers={"Authorization": "Bearer mock_firebase_artisan_user"},
        )
        assert res.status_code == 200
        gen_data = res.json()
        assert gen_data["status"] == "draft_ready"
        assert "Jamdani" in gen_data["draft"]["title_en"]
        assert "जामदानी" in gen_data["draft"]["title_hi"]
        assert gen_data["structured_fields"]["craft_technique"]["value"] == "Jamdani Weaving"
        assert "5.5" in gen_data["structured_fields"]["dimensions"]["value"]

        # 6. Approve Catalogue
        res = await client.post(
            f"/api/v1/catalogue-sessions/{session_id}/approve",
            headers={"Authorization": "Bearer mock_firebase_artisan_user"},
        )
        assert res.status_code == 200
        assert res.json()["approved"] is True

        # 7. Privacy Clean Up
        res = await client.delete(
            f"/api/v1/catalogue-sessions/{session_id}/source-data",
            headers={"Authorization": "Bearer mock_firebase_artisan_user"},
        )
        assert res.status_code == 200
        assert res.json()["status"] == "source_deleted"


@pytest.mark.asyncio
async def test_direct_generate_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/generate",
            json={
                "text": "Authentic Sambalpuri Ikat tussar silk saree from Odisha, length 5.5m with natural dyes.",
                "source_language": "en",
                "target_language": "hi",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert "Sambalpuri" in data["english_title"]
        assert "संबलपुरी" in data["hindi_title"]
        assert data["structured_fields"]["craft_technique"]["value"] == "Sambalpuri Ikat"
        assert "Silk" in data["structured_fields"]["materials"]["value"]
