# -*- coding: utf-8 -*-
"""
Urdu / Perso-Arabic to Devanagari script normalizer for Hindustani speech recognition.
Maps Perso-Arabic tokens emitted by Whisper multilingual model into clean Devanagari script.
"""
from __future__ import annotations
import re

URDU_WORD_MAP: dict[str, str] = {
    # Pronouns & determiners
    "یہ": "यह",
    "اسے": "इसे",
    "اس": "इस",
    "میرے": "मेरे",
    "میری": "मेरे",
    "پاس": "पास",
    "ایک": "एक",
    "اگ": "एक",
    # Colors & materials
    "نیلے": "नीले",
    "نیلا": "नीला",
    "رنگ": "रंग",
    "رنکی": "रंग की",
    "سوتی": "सूती",
    "سوت": "सूत",
    "ساری": "साड़ी",
    "ساڑی": "साड़ी",
    "سिल्क": "सिल्क",
    "ریشم": "रेशम",
    "بندال": "बंडल",
    # Actions & verbs
    "ہاتھ": "हाथ",
    "سے": "से",
    "بنایا": "बनाया",
    "گیا": "गया",
    "بنائی": "बनाई",
    "بنائیں": "बनाई",
    "بنائے": "बनाई",
    "بنے": "बने",
    "بنی": "बनी",
    "ہوئی": "हुई",
    "بنانے": "बनाने",
    "بناے": "बनाने",
    "دھونا": "धोना",
    "دھوناچاہیے": "धोना चाहिए",
    "دھوناچیے": "धोना चाहिए",
    "دھھنا": "धोना",
    "دھوئیں": "धोएं",
    "چاہیے": "चाहिए",
    "چیے": "चाहिए",
    "حلکہ": "हल्के",
    "ہلکے": "हल्के",
    "لگے": "लगे",
    "لگا": "लगा",
    # Postpositions & auxiliaries
    "کی": "की",
    "کے": "के",
    "کا": "का",
    "کو": "को",
    "میں": "में",
    "ہے": "है",
    "ہیں": "हैं",
    "تھا": "था",
    "تھی": "थी",
    "تھے": "थे",
    "اور": "और",
    # Measurements & numbers
    "تین": "तीन",
    "دو": "दो",
    "چار": "चार",
    "پانچ": "पाँच",
    "دن": "दिन",
    "لمبائی": "लंबाई",
    "لمبا": "लंबा",
    "λنبہ": "लंबाई",
    "λنبائی": "लंबाई",
    "کیمت": "कीमत",
    "قیمت": "कीमत",
    "روپے": "रुपये",
    "روپیہ": "रुपया",
    "میٹر": "मीटर",
}

URDU_CHAR_MAP: dict[str, str] = {
    'ا': 'आ', 'آ': 'आ', 'ب': 'ब', 'پ': 'प', 'ت': 'त', 'ٹ': 'ट', 'ث': 'स',
    'ج': 'ज', 'چ': 'च', 'ح': 'ह', 'خ': 'ख', 'د': 'द', 'ڈ': 'ड', 'ذ': 'ज़',
    'ر': 'र', 'ڑ': 'ड़', 'ز': 'ज़', 'ژ': 'झ़', 'س': 'स', 'ش': 'श', 'ص': 'स',
    'ض': 'ज़', 'ط': 'त', 'ظ': 'ज़', 'ع': 'अ', 'غ': 'ग़', 'ف': 'फ़', 'ق': 'क़',
    'ک': 'क', 'گ': 'ग', 'ل': 'ल', 'م': 'म', 'ن': 'न', 'ں': 'ँ', 'و': 'ो',
    'ہ': 'ह', 'ھ': 'ह', 'ء': '', 'ی': 'ी', 'ے': 'े', 'ئ': 'इ',
    '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5',
    '۶': '6', '۷': '7', '۸': '8', '۹': '9', '۰': '0',
}

DEVA_TO_BENGALI = {
    'अ': 'অ', 'आ': 'আ', 'इ': 'ই', 'ई': 'ঈ', 'उ': 'উ', 'ऊ': 'ঊ', 'ऋ': 'ঋ',
    'ए': 'এ', 'ऐ': 'ঐ', 'ओ': 'ও', 'औ': 'ঔ',
    'क': 'ক', 'ख': 'খ', 'ग': 'গ', 'घ': 'ঘ', 'ङ': 'ঙ',
    'च': 'চ', 'छ': 'ছ', 'ज': 'জ', 'झ': 'ঝ', 'ञ': 'ঞ',
    'ट': 'ট', 'ठ': 'ঠ', 'ड': 'ড', 'ढ': 'ঢ', 'ण': 'ণ',
    'त': 'ত', 'थ': 'থ', 'द': 'দ', 'ध': 'ধ', 'न': 'ন',
    'प': 'প', 'फ': 'ফ', 'ब': 'ব', 'भ': 'ভ', 'म': 'ম',
    'य': 'য', 'र': 'র', 'ल': 'ল', 'व': 'ব',
    'श': 'শ', 'ष': 'ষ', 'स': 'স', 'ह': 'হ',
    '़': '়', 'ऽ': '',
    'ा': 'া', 'ि': 'ি', 'ी': 'ী', 'ु': 'ু', 'ू': 'ূ', 'ृ': 'ৃ',
    'े': 'ে', 'ै': 'ৈ', 'ो': 'ো', 'ौ': 'ৌ', '्': '্',
    'ं': 'ং', 'ँ': 'ঁ', 'ः': 'ঃ',
    '०': '০', '१': '১', '२': '২', '३': '৩', '४': '৪',
    '५': '৫', '६': '৬', '७': '৭', '८': '৮', '९': '৯',
    'ड़': 'ড়', 'ढ़': 'ঢ়', 'फ़': 'ফ', 'ज़': 'জ', 'क़': 'ক', 'ख़': 'খ', 'ग़': 'গ'
}

BENGALI_PHONETIC_MAP = {
    "সাডি": "শাড়ি",
    "সাড়ি": "শাড়ি",
    "সারি": "শাড়ি",
    "শাডি": "শাড়ি",
    "শাডী": "শাড়ি",
    "শআডীআ": "শাড়ি",
    "কচে": "কাছে",
    "কচহআ": "কাছে",
    "আমর": "আমার",
    "আকতআ": "একটা",
    "একতা": "একটা",
    "এক্তা": "একটা",
    "নিল": "নীল",
    "রোগه": "রঙের",
    "রোগ": "রঙের",
    "র঵হো": "রঙের",
    "রোংগে": "রঙের",
    "রংগে": "রঙের",
    "রঙ্গের": "রঙের",
    "চহে": "আছে",
    "অচ৊": "আছে",
    "আজে": "আছে",
}

def is_perso_arabic(text: str) -> bool:
    """Check if string contains Perso-Arabic / Urdu script characters."""
    return bool(re.search(r'[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]', text))

def is_devanagari(text: str) -> bool:
    """Check if string contains Devanagari script characters."""
    return bool(re.search(r'[\u0900-\u097F]', text))

def clean_repetitive_hallucinations(text: str) -> str:
    """Remove repetitive looping tokens (e.g. 'বিবিবিবি' or '........')."""
    if not text:
        return ""
    # Deduplicate repeating single characters (> 3 repeats)
    text = re.sub(r'(.)\1{3,}', r'\1', text)
    # Deduplicate repeating 2-char tokens (e.g., 'বিবিবিবি')
    text = re.sub(r'(.{2,4})\1{3,}', r'\1', text)
    # Strip dots/punctuation loops
    text = re.sub(r'[\.\-_=~]{3,}', ' ', text)
    return text.strip()

def convert_perso_arabic_to_devanagari(text: str) -> str:
    """Convert Hindustani text in Perso-Arabic script into clean Devanagari."""
    text = clean_repetitive_hallucinations(text)
    if not is_perso_arabic(text):
        return text
    
    words = text.split()
    converted = []
    for w in words:
        w_clean = re.sub(r'[^\w\u0600-\u06FF]', '', w)
        p_pre_m = re.match(r'^[^\w\u0600-\u06FF]+', w)
        p_suf_m = re.search(r'[^\w\u0600-\u06FF]+$', w)
        p_pre = p_pre_m.group(0) if p_pre_m else ""
        p_suf = p_suf_m.group(0) if p_suf_m else ""
        
        if w_clean in URDU_WORD_MAP:
            converted.append(p_pre + URDU_WORD_MAP[w_clean] + p_suf)
        elif w in URDU_WORD_MAP:
            converted.append(URDU_WORD_MAP[w])
        else:
            chars = [URDU_CHAR_MAP.get(c, c) for c in w]
            converted.append("".join(chars))
    
    res = " ".join(converted)
    res = re.sub(r'([क-हड़ढ़])([ािीुूेैोौंँ])\1', r'\1\2', res)
    return res

def devanagari_to_bengali(text: str) -> str:
    """Convert Devanagari text representation to authentic Bengali script."""
    text = clean_repetitive_hallucinations(text)
    res = []
    i = 0
    while i < len(text):
        if i + 1 < len(text) and text[i:i+2] in DEVA_TO_BENGALI:
            res.append(DEVA_TO_BENGALI[text[i:i+2]])
            i += 2
        elif text[i] in DEVA_TO_BENGALI:
            res.append(DEVA_TO_BENGALI[text[i]])
            i += 1
        else:
            res.append(text[i])
            i += 1
    out = "".join(res)
    
    for k, v in BENGALI_PHONETIC_MAP.items():
        out = re.sub(r'\b' + k + r'\b', v, out)
    return out

def normalize_transcript_for_language(text: str, lang: str) -> str:
    """Normalize and clean transcript based on targeted spoken language."""
    text = clean_repetitive_hallucinations(text)
    if lang == "bn":
        if is_devanagari(text):
            text = devanagari_to_bengali(text)
        elif is_perso_arabic(text):
            deva = convert_perso_arabic_to_devanagari(text)
            text = devanagari_to_bengali(deva)
        
        # Remove any lingering perso-arabic characters
        text = re.sub(r'[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]', '', text)
        
        words = text.split()
        cleaned_words = []
        for w in words:
            w_strip = re.sub(r'[^\w\u0980-\u09FF]', '', w)
            if w_strip in BENGALI_PHONETIC_MAP:
                cleaned_words.append(BENGALI_PHONETIC_MAP[w_strip])
            elif w in BENGALI_PHONETIC_MAP:
                cleaned_words.append(BENGALI_PHONETIC_MAP[w])
            else:
                cleaned_words.append(w)
        text = " ".join(cleaned_words)
        for k, v in BENGALI_PHONETIC_MAP.items():
            text = re.sub(r'\b' + k + r'\b', v, text)
    elif lang == "hi":
        if is_perso_arabic(text):
            text = convert_perso_arabic_to_devanagari(text)
        text = re.sub(r'\bरंखि\b|\bरंखी\b|\bरंकि\b', 'रंग की', text)
        text = re.sub(r'\bसारी\b|\bसाडि\b', 'साड़ी', text)
    return re.sub(r'\s+', ' ', text).strip()
