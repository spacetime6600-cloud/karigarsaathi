# Phase 5 Stitch Screen-to-Route Mapping

| Screen Concept | Phase 5 Source Folder | Implemented React Route | Shell Used |
| :--- | :--- | :--- | :--- |
| **Language Selection** | `01_choose_language_desktop_phase_5`, `01_choose_language_mobile_*` | `/language` | `OnboardingShell` |
| **Sign In / OTP** | `02_sign_in_desktop_phase_5`, `02_sign_in_mobile_phase_5` | `/sign-in` | `OnboardingShell` |
| **Artisan Dashboard** | `03_artisan_dashboard_desktop_phase_5`, `03_artisan_dashboard_mobile_phase_5` | `/artisan/dashboard` | `ArtisanAppShell` |
| **Add Photographs** | `04_add_photographs_desktop_phase_5`, `04_add_photographs_mobile_phase_5` | `/artisan/products/new/photos` | `ProductCreationShell` |
| **Product Details** | `05_add_product_details_desktop_phase_5`, `05_add_product_details_mobile_phase_5` | `/artisan/products/new/details` | `ProductCreationShell` |
| **Review Facts** | `06_review_facts_desktop_phase_5_2` (Variant 2 Selected), `06_review_facts_mobile_360_phase_5` | `/artisan/products/new/review` | `ProductCreationShell` |
| **Choose Price** | `07_review_and_choose_price_desktop_phase_5`, `07_review_and_choose_price_mobile_phase_5` | `/artisan/products/new/price` | `ProductCreationShell` |
| **Public Fields** | `08_choose_public_fields_desktop_phase_5`, `08_choose_public_fields_mobile_phase_5` | `/artisan/products/new/public-fields` | `ProductCreationShell` |
| **Preview & Approve** | Reconstructed from Phase 5 Tokens & Public Passport specs | `/artisan/products/new/approve` | `ProductCreationShell` |
| **QR Craft Passport** | `10_qr_craft_passport_created_desktop_phase_5`, `10_qr_craft_passport_created_mobile_phase_5` | `/artisan/products/new/passport` | `ProductCreationShell` |
| **Share or Export** | `11_share_or_export_desktop_phase_5`, `11_share_or_export_mobile_phase_5` | `/artisan/products/new/share` | `ProductCreationShell` |
| **Buyer Enquiry** | `12_buyer_enquiry_desktop_phase_5`, `12_buyer_enquiry_mobile_phase_5` | `/artisan/enquiries/:enquiryId` | `ArtisanAppShell` |
| **Public Passport** | `public_craft_passport_desktop_phase_5`, `public_craft_passport_mobile_phase_5` | `/passport/:passportId` | `PublicPassportShell` |
| **Coordinator View** | `coordinator_overview_desktop_phase_5`, `coordinator_overview_mobile_phase_5` | `/coordinator` | `CoordinatorShell` |
| **Test Sandbox** | Part 2 Error & Recovery References (11 distinct states) | `/dev/states` | Standalone Sandbox |
