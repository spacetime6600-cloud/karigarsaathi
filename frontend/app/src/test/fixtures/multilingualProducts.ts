export interface MultilingualProductFixture {
  languageCode: 'en' | 'hi' | 'or' | 'bn' | 'te';
  languageName: string;
  scriptName: string;
  title: string;
  description: string;
  craftType: string;
  category: string;
  state: string;
  materials: string[];
  dimensions: string;
  story: string;
  artisanName: string;
  price: number;
  careInstructions: string;
}

export const MULTILINGUAL_PRODUCT_FIXTURES: Record<'en' | 'hi' | 'or' | 'bn' | 'te', MultilingualProductFixture> = {
  en: {
    languageCode: 'en',
    languageName: 'English',
    scriptName: 'Latin',
    title: 'Handcrafted Assam Mulberry Silk Jamdani Saree',
    description: 'Authentic pure silk saree handwoven on a traditional pit loom with intricate floral motifs and vegetable dyes.',
    craftType: 'Jamdani Silk Weave',
    category: 'Handloom Textiles',
    state: 'Assam',
    materials: ['Pure Mulberry Silk', 'Natural Indigo Dye', 'Zari Thread'],
    dimensions: '5.5 meters x 1.2 meters',
    story: 'Woven over 18 days by master weaver Ravi Kumar celebrating centuries of Brahmaputra valley heritage.',
    artisanName: 'Ravi Kumar',
    price: 14500,
    careInstructions: 'Dry clean only. Store wrapped in pure muslin cloth.',
  },
  hi: {
    languageCode: 'hi',
    languageName: 'Hindi',
    scriptName: 'Devanagari',
    title: 'हस्तनिर्मित असम शहतूत रेशम जामदानी साड़ी',
    description: 'पारंपरिक गड्ढा करघे पर प्राकृतिक रंगों और जटिल फूलों के रूपांकनों से बुनी गई शुद्ध रेशम की साड़ी।',
    craftType: 'जामदानी रेशम बुनाई',
    category: 'हथकरघा वस्त्र',
    state: 'असम',
    materials: ['शुद्ध शहतूत रेशम', 'प्राकृतिक नील रंग', 'जरी का धागा'],
    dimensions: '5.5 मीटर x 1.2 मीटर',
    story: 'मास्टर बुनकर रवि कुमार द्वारा 18 दिनों में ब्रह्मपुत्र घाटी की विरासत को संजोते हुए बुनी गई।',
    artisanName: 'रवि कुमार',
    price: 14500,
    careInstructions: 'केवल ड्राई क्लीन करें। शुद्ध मलमल के कपड़े में लपेटकर रखें।',
  },
  or: {
    languageCode: 'or',
    languageName: 'Odia',
    scriptName: 'Odia',
    title: 'ହସ୍ତତନ୍ତ ଆସାମ ତୁତ ରେଶମ ଜାମଦାନୀ ଶାଢ଼ୀ',
    description: 'ପାରମ୍ପରିକ ତନ୍ତରେ ପ୍ରାକୃତିକ ରଙ୍ଗ ଏବଂ ସୂକ୍ଷ୍ମ ଫୁଲ ଡିଜାଇନରେ ବୁଣାଯାଇଥିବା ଶୁଦ୍ଧ ରେଶମ ଶାଢ଼ୀ।',
    craftType: 'ଜାମଦାନୀ ରେଶମ ବୁଣା',
    category: 'ହସ୍ତତନ୍ତ ବସ୍ତ୍ର',
    state: 'ଆସାମ',
    materials: ['ଶୁଦ୍ଧ ତୁତ ରେଶମ', 'ପ୍ରାକୃତିକ ନୀଳ ରଙ୍ଗ', 'ଜରୀ ସୂତା'],
    dimensions: '5.5 ମିଟର x 1.2 ମିଟର',
    story: 'ବ୍ରହ୍ମପୁତ୍ର ଉପତ୍ୟକାର ଶତାବ୍ଦୀର ପରମ୍ପରାକୁ ୧୮ ଦିନ ଧରି ମାଷ୍ଟର ବୁଣାକାର ରବି କୁମାରଙ୍କ ଦ୍ୱାରା ପ୍ରସ୍ତୁତ।',
    artisanName: 'ରବି କୁମାର',
    price: 14500,
    careInstructions: 'କେବଳ ଡ୍ରାଏ କ୍ଲିନ୍ କରନ୍ତୁ। ମଲମଲ କପଡ଼ାରେ ଗୁଡ଼ାଇ ରଖନ୍ତୁ।',
  },
  bn: {
    languageCode: 'bn',
    languageName: 'Bengali',
    scriptName: 'Bengali',
    title: 'হস্তশিল্প আসাম তুত রেশম জামদানি শাড়ি',
    description: 'ঐতিহ্যবাহী তাঁতে প্রাকৃতিক রঙ এবং জটিল ফুলের নকশায় বোনা খাঁটি রেশম শাড়ি।',
    craftType: 'জামদানি রেশম বুনন',
    category: 'হস্তচালিত বস্ত্র',
    state: 'আসাম',
    materials: ['খাঁটি তুত রেশম', 'প্রাকৃতিক নীল রঙ', 'জরির সুতো'],
    dimensions: '5.5 মিটার x 1.2 মিটার',
    story: 'মাস্টার তাঁতি রবি কুমার দ্বারা ১৮ দিনে ব্রহ্মপুত্র উপত্যকার শতবর্ষের ঐতিহ্যকে ধরে রেখে বোনা।',
    artisanName: 'রবি কুমার',
    price: 14500,
    careInstructions: 'শুধুমাত্র ড্রাই ক্লিন করুন। খাঁটি মসলিন কাপড়ে মুড়ে রাখুন।',
  },
  te: {
    languageCode: 'te',
    languageName: 'Telugu',
    scriptName: 'Telugu',
    title: 'చేనేత అస్సాం మల్బరీ పట్టు జామ్‌దానీ చీర',
    description: 'సాంప్రదాయ పిట్ మగ్గంపై సహజ రంగులు మరియు సున్నితమైన పూల డిజైన్లతో నేసిన స్వచ్ఛమైన పట్టు చీర.',
    craftType: 'జామ్‌దానీ పట్టు నేత',
    category: 'చేనేత వస్త్రాలు',
    state: 'అస్సాం',
    materials: ['స్వచ్ఛమైన మల్బరీ పట్టు', 'సహజ నీలి రంగు', 'జరీ దారం'],
    dimensions: '5.5 మీటర్లు x 1.2 మీటర్లు',
    story: 'బ్రహ్మపుత్ర లోయ శతాబ్దాల వారసత్వాన్ని ప్రతిబింబిస్తూ మాస్టర్ నేత కార్మికుడు రవి కుమార్ 18 రోజులలో నేసినది.',
    artisanName: 'రవి కుమార్',
    price: 14500,
    careInstructions: 'డ్రై క్లీన్ మాత్రమే చేయండి. స్వచ్ఛమైన మస్లిన్ గుడ్డలో చుట్టి ఉంచండి.',
  },
};

