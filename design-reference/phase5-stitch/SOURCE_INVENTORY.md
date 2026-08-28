# Phase 5 Stitch Source Reference Inventory

This inventory documents all archives, screen folders, code references, design specifications, and visual assets extracted from the authoritative Phase 5 Stitch archives.

---

## 1. Archive & Extraction Overview

| Attribute | Part 1 Reference | Part 2 Reference |
| :--- | :--- | :--- |
| **Original Archive Name** | `part1.zip` | `part2.zip` |
| **Archive Storage Location** | `design-reference/phase5-stitch/archives/part1.zip` | `design-reference/phase5-stitch/archives/part2.zip` |
| **Extraction Location** | `design-reference/phase5-stitch/part-1/` | `design-reference/phase5-stitch/part-2/` |
| **Archive Integrity** | Preserved bit-for-bit from original source | Preserved bit-for-bit from original source |
| **Source Modification Status** | **Unmodified** (Original Stitch files intact) | **Unmodified** (Original Stitch files intact) |

---

## 2. Global Design Specifications

- **Authoritative Design Guide**:
  - `design-reference/phase5-stitch/part-1/stitch_karigarsaathi_artisan_digitization_platform/karigarsaathi_phase_5/DESIGN.md`
  - `design-reference/phase5-stitch/part-2/stitch_karigarsaathi_artisan_digitization_platform/karigarsaathi_phase_5/DESIGN.md`
  - *Status*: Validated and verified identical (SHA256: `3EF6598FE1660F458BCB2155FFCBD32638C7772F60E92B48AFEDACAF0F3DEA40`).
- **Excluded Monotone Guide**:
  - `design-reference/phase5-stitch/part-1/stitch_karigarsaathi_artisan_digitization_platform/structural_monotone/DESIGN.md`
  - `design-reference/phase5-stitch/part-2/stitch_karigarsaathi_artisan_digitization_platform/structural_monotone/DESIGN.md`
  - *Status*: **EXCLUDED**. Monotone / Phase 4 grayscale references must never be used.

---

## 3. Part 1 Screen Inventory (Core Happy Paths & Main Flow)

Root directory: `design-reference/phase5-stitch/part-1/stitch_karigarsaathi_artisan_digitization_platform/`

| Folder Name | HTML Reference (`code.html`) | Screenshot (`screen.png`) | Notes & Status |
| :--- | :--- | :--- | :--- |
| `01_choose_language_desktop_phase_5` | 14,723 B | 93,640 B | Valid screenshot |
| `01_choose_language_mobile_320_phase_5` | 13,838 B | 51,790 B | Valid screenshot (320px viewport) |
| `01_choose_language_mobile_360_phase_5` | 14,112 B | 47,165 B | Valid screenshot (360px viewport) |
| `02_sign_in_desktop_phase_5` | 5,752 B | 61,364 B | Valid screenshot |
| `02_sign_in_mobile_phase_5` | 7,527 B | 45,463 B | Valid screenshot |
| `03_artisan_dashboard_desktop_phase_5` | 12,614 B | 100,750 B | Valid screenshot |
| `03_artisan_dashboard_mobile_phase_5` | 14,840 B | 67,374 B | Valid screenshot |
| `04_add_photographs_desktop_phase_5` | 17,624 B | 139,316 B | Valid screenshot |
| `04_add_photographs_mobile_phase_5` | 14,268 B | 132,667 B | Valid screenshot |
| `04_camera_permission_denied_mobile_360_phase_5_mobile_permission_state_corrected` | 6,922 B | 32,045 B | Valid screenshot |
| `04_camera_permission_denied_phase_5_desktop_permission_state_corrected` | 11,078 B | **28 B** | ⚠️ Placeholder / empty PNG header (28 bytes) |
| `05_add_product_details_desktop_phase_5` | 11,984 B | 106,143 B | Valid screenshot |
| `05_add_product_details_mobile_phase_5` | 9,282 B | 32,270 B | Valid screenshot |
| `06_review_facts_desktop_phase_5_1` | 14,359 B | 127,599 B | Valid screenshot (Desktop Variant 1) |
| `06_review_facts_desktop_phase_5_2` | 15,099 B | 160,396 B | Valid screenshot (Desktop Variant 2) |
| `06_review_facts_mobile_360_phase_5` | 13,749 B | 77,654 B | Valid screenshot (360px mobile variant) |
| `06_review_facts_mobile_phase_5` | 11,455 B | 51,552 B | Valid screenshot (General mobile variant) |
| `06_review_facts_tablet_phase_5` | 16,148 B | 94,013 B | Valid screenshot (Tablet variant) |
| `07_review_and_choose_price_desktop_phase_5` | 16,141 B | 138,027 B | Valid screenshot |
| `07_review_and_choose_price_mobile_phase_5` | 13,642 B | 75,796 B | Valid screenshot |
| `08_choose_public_fields_desktop_phase_5` | 23,367 B | 156,400 B | Valid screenshot |
| `08_choose_public_fields_mobile_phase_5` | 14,309 B | 70,670 B | Valid screenshot |
| `10_qr_craft_passport_created_desktop_phase_5` | 17,532 B | 201,552 B | Valid screenshot |
| `10_qr_craft_passport_created_mobile_phase_5` | 11,738 B | 109,015 B | Valid screenshot |
| `11_share_or_export_desktop_phase_5` | 12,136 B | 86,631 B | Valid screenshot |
| `11_share_or_export_mobile_phase_5` | 12,730 B | **28 B** | ⚠️ Placeholder / empty PNG header (28 bytes) |
| `12_buyer_enquiry_desktop_phase_5` | 15,689 B | 104,918 B | Valid screenshot |
| `12_buyer_enquiry_mobile_phase_5` | 11,837 B | 74,569 B | Valid screenshot |
| `coordinator_overview_desktop_phase_5` | 17,058 B | **28 B** | ⚠️ Placeholder / empty PNG header (28 bytes) |
| `coordinator_overview_mobile_phase_5` | 14,898 B | 77,062 B | Valid screenshot |
| `public_craft_passport_desktop_phase_5` | 19,212 B | 1,149,002 B | Valid screenshot |
| `public_craft_passport_mobile_phase_5` | 14,914 B | 439,093 B | Valid screenshot |

---

## 4. Part 2 Screen Inventory (Error, Edge Cases & Recovery States)

Root directory: `design-reference/phase5-stitch/part-2/stitch_karigarsaathi_artisan_digitization_platform/`

| Folder Name | HTML Reference (`code.html`) | Screenshot (`screen.png`) | Notes & Status |
| :--- | :--- | :--- | :--- |
| `01_no_internet_local_save_state_desktop_phase_5` | 12,393 B | 142,592 B | Valid screenshot |
| `01_no_internet_local_save_state_mobile_360_phase_5` | 10,537 B | 123,676 B | Valid screenshot |
| `02_photo_upload_failed_phase_5_desktop_recovery_state_corrected` | 11,334 B | 169,470 B | Valid screenshot |
| `02_photo_upload_failed_mobile_360_phase_5_mobile_recovery_state_corrected` | 13,608 B | 116,800 B | Valid screenshot |
| `03_invalid_price_entry_phase_5_desktop_recovery_state_corrected` | 10,830 B | 103,363 B | Valid screenshot |
| `03_invalid_price_entry_mobile_360_phase_5_mobile_recovery_state_corrected` | 9,918 B | 71,555 B | Valid screenshot |
| `04_below_cost_price_confirmation_phase_5_desktop_recovery_state_corrected` | 13,927 B | 235,719 B | Valid screenshot |
| `04_below_cost_price_confirmation_mobile_360_phase_5_mobile_recovery_state` | 10,050 B | 125,903 B | Valid screenshot |
| `05_06_low_confidence_voice_result_desktop_phase_5` | 15,491 B | 184,095 B | Valid screenshot |
| `05_06_low_confidence_voice_result_mobile_360_phase_5` | 10,526 B | 88,222 B | Valid screenshot |
| `05_craft_passport_creation_failed_phase_5_desktop_recovery_state_corrected` | 14,008 B | 246,330 B | Valid screenshot |
| `05_craft_passport_creation_failed_mobile_360_phase_5_mobile_recovery_state` | 12,920 B | 92,649 B | Valid screenshot |
| `05_microphone_permission_denied_phase_5_desktop_permission_state_corrected` | 10,361 B | 151,181 B | Valid screenshot |
| `05_microphone_permission_denied_mobile_360_phase_5_mobile_permission_state` | 9,315 B | 105,861 B | Valid screenshot |
| `06_export_failed_phase_5_desktop_recovery_state_corrected` | 9,660 B | 82,411 B | Valid screenshot (Desktop Recovery variant) |
| `06_export_failed_phase_5_final_pass` | 9,733 B | 81,486 B | Valid screenshot (Desktop Final Pass variant) |
| `06_export_failed_mobile_360_phase_5_mobile_recovery_state_corrected` | 9,169 B | 51,171 B | Valid screenshot (Mobile Recovery variant) |
| `06_export_failed_mobile_360_phase_5_final_pass` | 9,705 B | 51,001 B | Valid screenshot (Mobile Final Pass variant) |
| `07_whatsapp_unavailable_phase_5_desktop_recovery_state_corrected` | 14,047 B | 192,273 B | Valid screenshot |
| `07_whatsapp_unavailable_mobile_360_phase_5_mobile_recovery_state_corrected` | 11,229 B | 82,931 B | Valid screenshot |
| `08_enquiry_waiting_to_send_phase_5_desktop_recovery_state_corrected` | 13,381 B | 213,008 B | Valid screenshot |
| `08_enquiry_waiting_to_send_mobile_360_phase_5_mobile_recovery_state_corrected` | 10,930 B | 71,921 B | Valid screenshot |

---

## 5. Duplicate Variants & Comparison Summary

The following screens provide multiple variants in the Phase 5 archive. Both variants are preserved intact for evaluation during the React implementation step:

1. **Review Facts Desktop**:
   - `06_review_facts_desktop_phase_5_1` (14,359 B HTML)
   - `06_review_facts_desktop_phase_5_2` (15,099 B HTML)
2. **Review Facts Mobile**:
   - `06_review_facts_mobile_360_phase_5` (13,749 B HTML)
   - `06_review_facts_mobile_phase_5` (11,455 B HTML)
3. **Export Failed Desktop**:
   - `06_export_failed_phase_5_desktop_recovery_state_corrected` (9,660 B HTML)
   - `06_export_failed_phase_5_final_pass` (9,733 B HTML)
4. **Export Failed Mobile (360px)**:
   - `06_export_failed_mobile_360_phase_5_mobile_recovery_state_corrected` (9,169 B HTML)
   - `06_export_failed_mobile_360_phase_5_final_pass` (9,705 B HTML)
5. **Language Selection Viewports**:
   - `01_choose_language_desktop_phase_5` (Desktop)
   - `01_choose_language_mobile_360_phase_5` (Mobile 360px)
   - `01_choose_language_mobile_320_phase_5` (Mobile 320px ultra-compact)

---

## 6. Screenshot Anomalies (Unusually Small / Placeholder Files)

The following three screen folders contain placeholder / 28-byte PNG files (`screen.png`):
1. `part-1/.../04_camera_permission_denied_phase_5_desktop_permission_state_corrected/screen.png` (28 bytes)
2. `part-1/.../11_share_or_export_mobile_phase_5/screen.png` (28 bytes)
3. `part-1/.../coordinator_overview_desktop_phase_5/screen.png` (28 bytes)

*Remedy during implementation*: Full HTML/CSS layouts exist in their corresponding `code.html` files, and companion viewports or mobile/desktop equivalents provide full visual fidelity.

---

## 7. Missing Sequence Number Notes

- In Part 1, the folder numbering jumps from `08_choose_public_fields_*` directly to `10_qr_craft_passport_created_*`. There is no folder prefixed with `09_`. The flow transitions directly from choosing public fields to generating the QR craft passport.
