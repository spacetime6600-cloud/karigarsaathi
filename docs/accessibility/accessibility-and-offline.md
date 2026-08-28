# Accessibility (a11y) & Offline Resilience Architecture

## 1. Accessibility Architecture (WCAG 2.1 AA)

- **Semantic Landmarks**: Clear `header`, `nav`, `main`, `aside`, and `footer` semantic elements.
- **Focus Rings**: Mandatory 2px solid `#FFB955` (Marigold) with 2px offset for keyboard navigation.
- **Touch Targets**: Minimum 48px × 48px bounding boxes on all interactive buttons, checkboxes, radio buttons, and links.
- **Form Association**: All inputs have visible `<label>` elements linked via `htmlFor`/`id` and ARIA attributes (`aria-invalid`, `aria-describedby`).
- **Color Independence**: Status chips combine distinct icons (checkmarks, alert triangles, warning symbols) with descriptive text.
- **Audio Assistance ("Listen")**: Built-in speech synthesis provider supporting localized audio instruction for low-literacy artisans.

## 2. Offline Resilience Strategy

- **Local Storage Engine**: All draft modifications, confirmed facts, pricing calculations, and offline enquiry replies are persisted locally.
- **Offline Sync Queue**: When network is unavailable, outbound actions (enquiry responses, passport creations) are queued with pending badges.
- **Zero Loss Guarantee**: Refreshing any route or losing internet preserves the active draft and permits continuous work.
