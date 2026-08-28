# Voice Data Flow & Processing Pipeline

## 1. Architectural Overview

```
[ Artisan Voice / Typed Input ]
            │
            ▼
[ Frontend Web Audio / MediaRecorder ]
   • Audio Chunk Buffering (WebM/WAV)
   • Waveform Visualization
            │
            ▼  (POST /api/v1/catalogue-sessions/{id}/audio)
[ Phase 14 Backend (:8001) ]
   • Audio Validation & PyAV 16kHz Decoding
   • Stored in `private/uploads/`
            │
            ▼  (POST /api/v1/catalogue-sessions/{id}/process)
[ Faster Whisper Speech Adapter ]
   • Offline WhisperModel (base/int8)
   • Language Detection & Confidence Scoring
   • Segment Breakdown
            │
            ▼  (PATCH /api/v1/catalogue-sessions/{id}/transcript)
[ Artisan Interactive Transcript Review ]
   • Correct Words, Numbers, Technical Terms
            │
            ▼  (POST /api/v1/catalogue-sessions/{id}/generate)
[ Fact-Grounded Catalogue Adapter ]
   • Extract Physical Specifications (Materials, Technique, Dimensions)
   • Bilingual Copy Generation (English + Hindi / Odia / Bengali)
   • Clarification Questions for Missing Critical Facts
            │
            ▼  (POST /api/v1/catalogue-sessions/{id}/approve)
[ Explicit Artisan Approval Gate ]
   • Immutable Snapshot Created
   • Applied to Frontend Product Draft
            │
            ▼  (DELETE /api/v1/catalogue-sessions/{id}/source-data)
[ Privacy Cleanup ]
   • Physical Audio File Deleted from Disk
   • Raw Server Transcript Purged
```

## 2. Audio Validation & Normalization

1. **Native PyAV Audio Decoding**:
   - Replaced fragile external CLI invocations with `faster_whisper.decode_audio(io.BytesIO(audio_bytes), sampling_rate=16000)`.
   - Audio is converted directly in memory to a 1D float32 numpy array normalized to `[-1.0, 1.0]`.
2. **Format Compatibility**:
   - Supports WAV, MP3, WebM (Opus), OGG, and M4A containers.
3. **Payload Limits**:
   - Audio file size limit: 50MB.
   - Duration limit: 10 minutes per recording.
