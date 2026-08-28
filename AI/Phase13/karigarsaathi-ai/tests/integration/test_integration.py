import io
import json
import uuid

from fastapi.testclient import TestClient
from PIL import Image
from app.main import app

client = TestClient(app)

def _enhancement_form_data():
    artisan_id = "test-artisan"
    product_id = "test-product"
    img = Image.new("RGB", (512, 512))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    image_bytes = buf.getvalue()

    form_data = {
        "consent_granted": "true",
        "request_id": str(uuid.uuid4()),
        "artisan_id": artisan_id,
        "product_id": product_id,
        "operations": json.dumps(["background_removal", "lighting_correction", "centring", "standard_resize"]),
        "output_size": "512",
        "background": "white",
    }

    return form_data, image_bytes

def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "service" in data
    assert "version" in data
