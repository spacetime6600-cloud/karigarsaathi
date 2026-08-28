import pytest
from httpx import AsyncClient, ASGITransport
from backend.main import app
from backend.app.adapters.catalogue import OpenAILikeCatalogueAdapter
from backend.app.adapters.speech import FasterWhisperSpeechAdapter

@pytest.mark.asyncio
async def test_no_canned_translation_on_garbage_input():
    """Verify that gibberish or noise input does NOT return canned generic artisan sentences."""
    adapter = OpenAILikeCatalogueAdapter()
    
    garbage_inputs = [
        "yey yey yey yey",
        "...",
        "   ",
        "random noisesssss 12345",
    ]
    for inp in garbage_inputs:
        res = await adapter.translate_text(inp, "hi", "en")
        # Must not fabricate generic canned sentence
        assert "This is a handcrafted artisan item." not in res["translated_text"]
        assert res["translated_text"] == ""

@pytest.mark.asyncio
async def test_faithful_translation_hindi_saree():
    """Verify exact regression case for handmade saree."""
    adapter = OpenAILikeCatalogueAdapter()
    
    res1 = await adapter.translate_text("यह एक हाथ से बनी हुई साड़ी है।", "hi", "en")
    assert res1["translated_text"] == "This is a handmade saree."

    res2 = await adapter.translate_text("yeh ek hath se bani huyi saree hai", "hi", "en")
    assert res2["translated_text"] == "This is a handmade saree."

@pytest.mark.asyncio
async def test_faithful_translation_bengali_and_odia():
    """Verify faithful handmade saree translation in Bengali and Odia."""
    adapter = OpenAILikeCatalogueAdapter()
    
    bn_res = await adapter.translate_text("এটি একটি হাতে তৈরি শাড়ি।", "bn", "en")
    assert bn_res["translated_text"] == "This is a handmade saree."

    or_res = await adapter.translate_text("ଏହା ଏକ ହାତ ତିଆରି ଶାଢ଼ୀ।", "or", "en")
    assert or_res["translated_text"] == "This is a handmade saree."

@pytest.mark.asyncio
async def test_materially_different_product_translations():
    """Verify that different products produce distinct grounded translations, not a single generic sentence."""
    adapter = OpenAILikeCatalogueAdapter()
    
    res_lamp = await adapter.translate_text("पीतल का हस्तनिर्मित दीपक", "hi", "en")
    assert "lamp" in res_lamp["translated_text"].lower() or "brass" in res_lamp["translated_text"].lower()
    assert "saree" not in res_lamp["translated_text"].lower()

    res_ikat = await adapter.translate_text("Authentic Sambalpuri Ikat silk saree length 5.5m", "en", "en")
    assert "sambalpuri" in res_ikat["translated_text"].lower()
    assert "5.5m" in res_ikat["translated_text"]

@pytest.mark.asyncio
async def test_translate_endpoint_via_http():
    """Verify POST /api/v1/translate endpoint behavior via HTTP client."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post(
            "/api/v1/translate",
            json={
                "text": "यह एक हाथ से बनी हुई साड़ी है।",
                "source_language": "hi",
                "target_language": "en",
            },
        )
        assert res.status_code == 200
        data = res.json()
        assert data["translated_text"] == "This is a handmade saree."
        assert data["source_text"] == "यह एक हाथ से बनी हुई साड़ी है।"
        assert data["source_language"] == "hi"

@pytest.mark.asyncio
async def test_speech_adapter_language_and_task_guards():
    """Verify language guards and allowed languages in speech adapter."""
    adapter = FasterWhisperSpeechAdapter()
    allowed = adapter._allowed_languages()
    assert "hi" in allowed
    assert "bn" in allowed
    assert "en" in allowed
    assert "or" in allowed
    assert "te" in allowed
