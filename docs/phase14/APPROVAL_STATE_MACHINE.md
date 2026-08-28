# Approval State Machine & Lifecycle Transitions

## 1. Lifecycle State Machine

```
      [ created ]
           │ (Upload Audio)
           ▼
      [ uploaded ]
           │ (Process Audio)
           ▼
    [ transcribing ]
           │ (Faster Whisper Completed)
           ▼
[ awaiting_transcript_review ]
           │ (Edit / Confirm Transcript)
           ▼
  [ generating_catalogue ]
           │ (Fact Extraction & Translation)
           ▼
     [ draft_ready ]
           │ (Artisan Reviews & Clicks "Apply to Draft")
           ▼
      [ approved ] ───► [ ApprovedSnapshot Created (Immutable) ]
           │ (Privacy Cleanup / Retention Expiry)
           ▼
   [ source_deleted ]
```

## 2. State Invariants

1. **Explicit Approval Gate**:
   - Suggestions remain in preview mode inside the studio modal until the artisan explicitly clicks "Apply Suggestions to Product Draft".
   - The product draft is never modified in the background without artisan confirmation.
2. **Immutable Snapshots**:
   - Upon approval (`POST /api/v1/catalogue-sessions/{id}/approve`), an `ApprovedSnapshot` record is created containing the finalized JSON snapshot, artisan UUID, timestamp, and revision number.
   - Snapshots are marked `is_immutable: true` and cannot be altered.
3. **Audit Trail**:
   - All state transitions (`session_created`, `recording_stored`, `transcription_completed`, `transcript_corrected`, `catalogue_generated`, `catalogue_approved`, `source_data_deleted`) are logged in the `audit_events` table.
