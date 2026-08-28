import os

dirs = [
    os.path.join('public', 'craft-thumbnails'),
    os.path.join('src', 'assets', 'craft-thumbnails')
]
for d in dirs:
    os.makedirs(d, exist_ok=True)

CRAFTS_INFO = [
    ('AP', 'Srikalahasti Kalamkari', '#C65A35', '#FFF6ED', 'Tree of Life with Lotus & Peacocks'),
    ('AR', 'Monpa Wood Carving', '#8C4D2D', '#F9F1E6', 'Carved Wooden Ritual Masks & Brier Wood'),
    ('AS', 'Muga Silk Weaving', '#C89D3C', '#FCF8ED', 'Golden Wild Muga Silk with Kaziranga Rhinoceros'),
    ('BR', 'Mithila Madhubani Art', '#B83A24', '#FFF5F0', 'Fish, Sun & Kohbar Matriarchal Lineage'),
    ('CG', 'Bastar Dhokra Metalwork', '#996515', '#FAF4EA', 'Tribal Musician, Elephant & Deer in Cast Bell Metal'),
    ('GA', 'Kunbi Sarees & Azulejos', '#A62626', '#FFF4F2', 'Checkered Red Kunbi Weave & Cobalt Glazed Ceramic Tile'),
    ('GJ', 'Patan Patola Double Ikat', '#B33925', '#FFF3EE', 'Nari Kunjar Elephant, Parrot & Jewel Geometry'),
    ('HR', 'Panipat Punja Durries', '#3D617A', '#F0F5F9', 'Geometric Pit-Loom Warp & Woollen Flooring'),
    ('HP', 'Kullu Shawls & Chamba Rumal', '#2D6B8C', '#F0F7FB', 'Geometric Mountain Border & Double-sided Silk Needlework'),
    ('JH', 'Sohrai & Khovar Painting', '#705335', '#F8F2EB', 'Clay Murals, Forest Fauna & Nuptial Fertility Motifs'),
    ('KA', 'Bidriware & Mysore Silk', '#25323D', '#EEF2F5', 'Silver Floral Inlay on Soil-Blackened Zinc Alloy'),
    ('KL', 'Aranmula Metal Mirror', '#B5872A', '#FCF7EB', 'Front-Surface Polished Metallurgical Bell Metal Mirror'),
    ('MP', 'Chanderi Weave & Gond Art', '#A6732E', '#FAF4EA', 'Translucent Silk Zari Booti & Tribal Dot Painting'),
    ('MH', 'Paithani Silk & Warli Art', '#9E2A2B', '#FFF2F2', 'Peacock Mor-Bangadi Pallu & Rice Paste Tribal Dance'),
    ('MN', 'Longpi Black Pottery', '#2A3038', '#EDF2F7', 'Wheel-less Serpentine Stone & Leaf-burnished Clay Pot'),
    ('ML', 'Ryndia Organic Peace Silk', '#4D6B5A', '#EFF5F1', 'Non-violent Wild Eri Silk & Forest Plant Dyes'),
    ('MZ', 'Mizo Puan Handloom', '#B83E48', '#FFF0F2', 'Puanchei Tribal Stripe & Backstrap Loom Geometric Motif'),
    ('NL', 'Naga Warrior Shawls', '#A32427', '#FDF0F1', 'Chakhesang Heraldic Black, Red & White Striped Shawl'),
    ('OD', 'Raghurajpur Pattachitra', '#B23A22', '#FFF3EE', 'Jagannath Devotional Palm-leaf & Cloth Scroll Painting'),
    ('PB', 'Phulkari Floral Embroidery', '#D95D39', '#FFF3ED', 'Silk Floss Geometric Floral Bagh on Khaddar Cotton'),
    ('RJ', 'Jaipur Blue Pottery', '#1E6B9E', '#EDF6FC', 'Clay-free Quartz Ceramic Floral Tile with Cobalt Glaze'),
    ('SK', 'Thangka Silk Painting', '#8A3B2B', '#FAF1EE', 'Ashtamangala Sacred Buddhist Silk Scroll & Choktse Table'),
    ('TN', 'Kanchipuram Temple Silk', '#8B263E', '#FAF0F2', 'Korvai Interlocked Gold Zari Border & Temple Gope'),
    ('TG', 'Pochampally Telia Rumal', '#B23B2A', '#FFF2EE', 'Double-Ikat Castor-Oil Dyed Geometric Grid'),
    ('TR', 'Tripura Split Bamboo Craft', '#4F7552', '#EFF6F0', 'Micro-thin Pliable Woven Bamboo Screen & Basketry'),
    ('UP', 'Banarasi Silk & Chikankari', '#881B34', '#FAF0F2', 'Mughal Gold Zari Brocade & Shadow White Needlework'),
    ('UK', 'Aipan Ritual Floor Art', '#A33327', '#FFF2F0', 'Geru Terracotta Clay Base with Rice-Paste Sacred Mandala'),
    ('WB', 'Baluchari Silk & Bankura Horse', '#9C2738', '#FAF0F2', 'Epics Pallu Weave & Long-eared Terracotta Votive Horse'),
    ('AN', 'Andaman Padauk Woodcraft', '#7B3F28', '#F9F1EA', 'Dense Padauk Hardwood Carving & Turbo Sea Shell Art'),
    ('CH', 'Modernist Tapestry Weaving', '#3F5E78', '#F0F4F8', 'Le Corbusier Architectural Geometric Handloom'),
    ('DN', 'Warli Coastal Shellcraft', '#6E473B', '#F8F1EB', 'Tribal Tarpa Dance Mural & Marine Sea Shell Ornaments'),
    ('DL', 'Zardozi Gold & Meenakari', '#966810', '#FAF4EA', 'Metallic Bullion Wire Embroidery & Vitreous Enamel Art'),
    ('JK', 'Kashmir Pashmina & Walnut Wood', '#35536E', '#F0F4F8', 'Kani Taleem Wooden Needle Pashmina & Deep Walnut Relief'),
    ('LA', 'Ladakhi Pashmina & Metalcraft', '#7D4F3C', '#F8F1EC', 'Changthangi 12-Micron Cashmere & Chilling Copper Teapots'),
    ('LD', 'Lagoon Coir & Coconut Shell', '#3E665C', '#EEF6F3', 'Naturally Cured Golden Lagoon Coir & Polished Shellware'),
    ('PY', 'Villianur Temple Terracotta', '#A34624', '#FAF1EC', 'Lake Clay Monumental Sculpture & Handmade Rag Paper')
]

for code, title, primary_col, bg_col, desc in CRAFTS_INFO:
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <defs>
    <linearGradient id="bg_{code}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{bg_col}"/>
      <stop offset="100%" stop-color="#FFF9EF"/>
    </linearGradient>
    <filter id="glow_{code}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="{primary_col}" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="120" height="120" rx="20" fill="url(#bg_{code})"/>
  <rect x="3" y="3" width="114" height="114" rx="17" fill="none" stroke="{primary_col}" stroke-width="1.5" stroke-opacity="0.3"/>
  <circle cx="60" cy="50" r="28" fill="{primary_col}" fill-opacity="0.14" filter="url(#glow_{code})"/>
  <circle cx="60" cy="50" r="22" fill="none" stroke="{primary_col}" stroke-width="1.4" stroke-dasharray="3.5 2.5"/>
  <text x="60" y="57" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="800" fill="{primary_col}" text-anchor="middle">{code}</text>
  <rect x="8" y="86" width="104" height="24" rx="7" fill="{primary_col}" fill-opacity="0.95"/>
  <text x="60" y="101" font-family="system-ui, -apple-system, sans-serif" font-size="8" font-weight="700" fill="#FFFFFF" text-anchor="middle" letter-spacing="0.02em">{title[:22]}</text>
</svg>'''
    for d in dirs:
        with open(os.path.join(d, f'{code.lower()}-craft.svg'), 'w', encoding='utf-8') as f:
            f.write(svg_content)

print(f"Generated {len(CRAFTS_INFO)} craft thumbnails in public/ and src/!")
