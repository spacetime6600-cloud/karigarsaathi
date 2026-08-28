# Phase 13 — Known Limitations & Future Considerations

## 1. Current Architectural Boundaries

1. **Synchronous Image Processing Pipeline**:
   - Enhancement requests are currently processed synchronously via `POST /v1/enhancements`.
   - While execution times on CPU average $1.2\text{s} - 3.0\text{s}$, processing on high-resolution ($>4000\text{px}$) photographs on low-spec server hardware may approach the 60-second timeout.
   - *Mitigation*: Client-side display downsizing and canvas bounding before transmission reduce payload overhead.

2. **Single-Object Dominance**:
   - The IS-Net segmentation adapter is optimized for prominent single foreground craft items (e.g. folded saree, ceramic vase, brass idol).
   - Busy multi-object or crowded workshop scenes may receive segmentation warnings (`warnings: ["SEGMENTATION_LOW_CONFIDENCE"]`).
   - *Mitigation*: The artisan always inspects the before/after comparison and can reject the result with one click.

3. **Client-Side Blob Memory Management**:
   - Browsers holding large object URLs during long-running single-page app sessions can consume memory.
   - *Mitigation*: `URL.revokeObjectURL` is invoked on modal teardown and unmount.

4. **Quota Limits**:
   - Default quota configuration restricts each authenticated artisan to 25 enhancement operations per day to protect server CPU/GPU resources.
   - *Mitigation*: Artisans reaching their quota can continue creating unlimited product drafts using authentic original photographs.