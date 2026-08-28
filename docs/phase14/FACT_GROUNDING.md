# Fact Grounding & Zero-Hallucination Strategy

## 1. Core Rule: Zero Generative Invention

Traditional LLM generation creates synthetic details (e.g. assuming a saree has "pure gold zari", specific dimensions, or a specific price when unmentioned). In KarigarSaathi, **every factual claim must be grounded in artisan testimony or verified inputs**.

## 2. Permitted Factual Extraction Schema

The model extracts only the following structured attributes:
- `product_name`: Primary craft item name (e.g. Saree, Dupatta, Pot, Lamp, Figurine).
- `category`: Classification (e.g. Textile, Pottery, Metalware, Painting, Jewellery).
- `craft_technique`: Handloom, Jamdani, Banarasi, Chanderi, Ikat, Sambalpuri, Kantha, Madhubani, Dhokra, Pattachitra, Blue Pottery, etc.
- `materials`: Silk, Cotton, Wool, Brass, Copper, Clay, Terracotta, Wood, etc.
- `colors`: Natural dyes, Indigo, Red, Terracotta, Yellow, etc.
- `dimensions`: Extracted numerical dimensions with units (e.g. 5.5m, 12 inches).
- `weight`: Extracted weight (e.g. 250g, 1.5kg).
- `place_of_origin`: Artisan region if explicitly mentioned.
- `price`: Pricing in INR (only when explicitly stated by artisan).

## 3. Missing Field Handling & Clarification Questions

When an essential physical field is not mentioned:
1. The field value remains `null` and marked `status: "unknown"`.
2. A structured clarification question is generated:
   - Example: Missing dimensions -> `"What are the exact dimensions (length and width) of this product?"`
   - Example: Missing price -> `"What is the intended selling price for this handcrafted item?"`
3. The artisan can answer these clarifications without having to guess or accept false defaults.

## 4. Provenance & Evidence Tracking

Each extracted fact includes:
- `source`: `'transcript'` | `'clarification'` | `'manual'`
- `confidence`: Calculated confidence score (e.g. 0.95)
- `evidence`: Transcript segment ID or quotation
- `last_updated_at`: Timestamp of extraction
