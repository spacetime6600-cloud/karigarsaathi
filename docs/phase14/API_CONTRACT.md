# Phase 14 API Contract — Voice & Multilingual Auto-Catalogue

Base URL: `http://localhost:8001/api/v1`

---

## 1. Health & Capabilities
- **Endpoint**: `GET /health` or `GET /api/v1/health`
- **Response**:
```json
{
  "status": "ok",
  "service": "karigarSaathi-phase14",
  "model_ready": true,
  "whisper_model": "base",
  "supported_languages": ["en", "hi", "or", "bn"]
}
```

---

## 2. Session Lifecycle Endpoints

### A. Create Session
- **Endpoint**: `POST /api/v1/catalogue-sessions`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "selected_language": "hi",
  "consent_granted": true,
  "retention_choice": "30_days"
}
```
- **Response**: `200 OK`
```json
{
  "session_id": "4287d3ec-44f2-498c-bbad-fbb881775a6c",
  "status": "created",
  "selected_language": "hi"
}
```

### B. Upload Audio
- **Endpoint**: `POST /api/v1/catalogue-sessions/{session_id}/audio`
- **Content-Type**: `multipart/form-data`
- **Form Fields**: `audio_file: <binary WAV/WebM/MP3/OGG>`
- **Response**: `200 OK`
```json
{
  "recording_id": "993a4bc1-c244-4eb9-bf25-ccad80f2d93e",
  "stored_filename": "f29b6f8490a64937a78385d0d8808d48.wav",
  "file_size_bytes": 128450,
  "status": "uploaded"
}
```

### C. Process Audio (Faster Whisper Transcription)
- **Endpoint**: `POST /api/v1/catalogue-sessions/{session_id}/process`
- **Response**: `200 OK`
```json
{
  "session_id": "4287d3ec-44f2-498c-bbad-fbb881775a6c",
  "status": "awaiting_transcript_review",
  "transcript_id": "c62040c5-59fe-44c1-92be-cf441e8c9d09",
  "original_text": "यह हाथ से बनी हुई जामदानी साड़ी है, प्राकृतिक रंगों और रेशम से तैयार की गई है।",
  "confidence": 0.94,
  "detected_language": "hi",
  "segments": [
    {
      "id": 0,
      "text": "यह हाथ से बनी हुई जामदानी साड़ी है",
      "start": 0.0,
      "end": 2.8,
      "confidence": 0.95,
      "is_low_confidence": false
    }
  ]
}
```

### D. Update / Correct Transcript
- **Endpoint**: `PATCH /api/v1/catalogue-sessions/{session_id}/transcript`
- **Request Body**:
```json
{
  "corrected_text": "यह पारंपरिक हथकरघा जामदानी रेशम साड़ी है। लंबाई 5.5 मीटर है।"
}
```
- **Response**: `200 OK`

### E. Generate Catalogue Suggestions
- **Endpoint**: `POST /api/v1/catalogue-sessions/{session_id}/generate`
- **Response**: `200 OK`
```json
{
  "session_id": "4287d3ec-44f2-498c-bbad-fbb881775a6c",
  "status": "draft_ready",
  "draft": {
    "title_en": "Authentic Handloom Jamdani Silk Saree",
    "title_hi": "पारंपरिक हथकरघा जामदानी रेशम साड़ी",
    "description_en": "Handcrafted traditional Jamdani silk saree made with natural dyes. Dimensions: 5.5 metres.",
    "description_hi": "प्राकृतिक रंगों से निर्मित प्रामाणिक हथकरघा जामदानी रेशम साड़ी। लंबाई: 5.5 मीटर।",
    "tags_en": "handloom, jamdani, silk saree, traditional craft, artisan",
    "tags_hi": "हथकरघा, जामदानी, रेशम साड़ी, पारंपरिक शिल्प, कारीगर"
  },
  "structured_fields": {
    "product_name": { "value": "Jamdani Saree", "confidence": 0.95, "source": "transcript" },
    "category": { "value": "textile", "confidence": 0.95, "source": "transcript" },
    "materials": { "value": "silk", "confidence": 0.9, "source": "transcript" },
    "craft_technique": { "value": "handloom weaving", "confidence": 0.9, "source": "transcript" },
    "dimensions": { "value": "5.5 meters", "confidence": 0.9, "unit": "meters", "source": "transcript" }
  },
  "clarification_questions": [
    {
      "field": "price",
      "question": "What is the listing price for this handcrafted saree?"
    }
  ]
}
```

### F. Explicit Approval
- **Endpoint**: `POST /api/v1/catalogue-sessions/{session_id}/approve`
- **Request Body**: `{"approving_user_id": "<artisan_uuid>"}`
- **Response**: `200 OK`

### G. Delete Audio & Privacy Cleanup
- **Endpoint**: `DELETE /api/v1/catalogue-sessions/{session_id}/source-data`
- **Response**: `200 OK`
