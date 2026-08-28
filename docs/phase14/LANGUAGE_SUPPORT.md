# Supported Languages & Multilingual Strategy

## 1. Supported Languages Matrix

| Language | Code | Faster Whisper Speech Recognition | Bilingual Auto-Catalogue Generation | Native Script UI |
|---|---|---|---|---|
| **English** | `en` | ✅ Full Support | ✅ Full Title, Description & Tags | ✅ Latin Script |
| **Hindi** | `hi` | ✅ Full Support | ✅ Full Title, Description & Tags | ✅ Devanagari Script |
| **Bengali** | `bn` | ✅ Full Support | ✅ Full Title, Description & Tags | ✅ Bengali Script |
| **Odia** | `or` | ✅ Full Support | ✅ Full Title, Description & Tags | ✅ Odia Script |
| **Telugu** | `te` | ⚠️ Preserved in Unicode tests | ⚠️ Manual & Fallback preserved | ✅ Telugu Script |

## 2. Bilingual Copy Generation

For any chosen Indic language (Hindi, Odia, or Bengali), the auto-catalogue generates:
1. **English Title & Description**:
   - Optimized for marketplace search, buyers, and export channels.
   - Example: *"Jamdani Weaving Pure Silk Saree"*
2. **Native Indic Title & Description**:
   - Faithful cultural framing in the artisan's native language.
   - Example (Hindi): *"जामदानी बुनाई शुद्ध रेशम साड़ी"*
   - Example (Bengali): *"জামদানি বয়ন খাঁটি রেশম শাড়ি"*
   - Example (Odia): *"ଜାମଦାନୀ ବୁଣା ଖାଣ୍ଟି ରେଶମ ଶାଢ଼ୀ"*

## 3. Typographic & Unicode Rendering Rules

- Indic scripts are rendered with adequate `line-height` (`leading-relaxed` / `leading-normal`) to prevent vowel diacritics (matras) and conjunct consonants from clipping.
- All database tables use UTF-8 (`utf8mb4` equivalent in SQLite) to prevent Unicode corruption or character stripping.
