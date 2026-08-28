import os

out_dir = os.path.join('src', 'assets', 'craft-thumbnails')
os.makedirs(out_dir, exist_ok=True)

CRAFTS_INFO = [
    ('AP', 'Srikalahasti Kalamkari', '#C65A35', '#001D36', 'Tree of Life with Lotus & Peacocks'),
    ('AR', 'Monpa Wood Carving', '#8C4D2D', '#F4E9D8', 'Carved Wooden Ritual Masks & Brier Wood'),
    ('AS', 'Muga Silk Weaving', '#D4AF37', '#001D36', 'Golden Wild Muga Silk with Kaziranga Rhinoceros'),
    ('BR', 'Mithila Madhubani Art', '#B83A24', '#FFF9EF', 'Fish, Sun & Kohbar Matriarchal Lineage'),
    ('CG', 'Bastar Dhokra Metalwork', '#996515', '#001D36', 'Tribal Musician, Elephant & Deer in Cast Bell Metal'),
    ('GA', 'Kunbi Sarees & Azulejos', '#A62626', '#FFF9EF', 'Checkered Red Kunbi Weave & Cobalt Glazed Ceramic Tile'),
    ('GJ', 'Patan Patola Double Ikat', '#B33925', '#001D36', 'Nari Kunjar Elephant, Parrot & Jewel Geometry'),
    ('HR', 'Panipat Punja Durries', '#4A6B82', '#FBF8F3', 'Geometric Pit-Loom Warp & Woollen Flooring'),
    ('HP', 'Kullu Shawls & Chamba Rumal', '#3B6E8C', '#FFF9EF', 'Geometric Mountain Border & Double-sided Silk Needlework'),
    ('JH', 'Sohrai & Khovar Painting', '#705335', '#F5EBE1', 'Clay Murals, Forest Fauna & Nuptial Fertility Motifs'),
    ('KA', 'Bidriware & Mysore Silk', '#1C252C', '#E5E9EC', 'Silver Floral Inlay on Soil-Blackened Zinc Alloy'),
    ('KL', 'Aranmula Metal Mirror', '#C89D3C', '#001D36', 'Front-Surface Polished Metallurgical Bell Metal Mirror'),
    ('MP', 'Chanderi Weave & Gond Art', '#B07D38', '#FFF9EF', 'Translucent Silk Zari Booti & Tribal Dot Painting'),
    ('MH', 'Paithani Silk & Warli Art', '#9E2A2B', '#FFF9EF', 'Peacock Mor-Bangadi Pallu & Rice Paste Tribal Dance'),
    ('MN', 'Longpi Black Pottery', '#2B2D2F', '#DDEBF8', 'Wheel-less Serpentine Stone & Leaf-burnished Clay Pot'),
    ('ML', 'Ryndia Organic Peace Silk', '#5B7065', '#FFF9EF', 'Non-violent Wild Eri Silk & Forest Plant Dyes'),
    ('MZ', 'Mizo Puan Handloom', '#C14953', '#001D36', 'Puanchei Tribal Stripe & Backstrap Loom Geometric Motif'),
    ('NL', 'Naga Warrior Shawls', '#A8282B', '#1E232A', 'Chakhesang Heraldic Black, Red & White Striped Shawl'),
    ('OD', 'Raghurajpur Pattachitra', '#B23A22', '#FFF9EF', 'Jagannath Devotional Palm-leaf & Cloth Scroll Painting'),
    ('PB', 'Phulkari Floral Embroidery', '#D95D39', '#FFF9EF', 'Silk Floss Geometric Floral Bagh on Khaddar Cotton'),
    ('RJ', 'Jaipur Blue Pottery', '#2E6F9E', '#FFF9EF', 'Clay-free Quartz Ceramic Floral Tile with Cobalt Glaze'),
    ('SK', 'Thangka Silk Painting', '#944838', '#FBF8F3', 'Ashtamangala Sacred Buddhist Silk Scroll & Choktse Table'),
    ('TN', 'Kanchipuram Temple Silk', '#8B263E', '#F9F5EC', 'Korvai Interlocked Gold Zari Border & Temple Gope'),
    ('TG', 'Pochampally Telia Rumal', '#B23B2A', '#001D36', 'Double-Ikat Castor-Oil Dyed Geometric Grid'),
    ('TR', 'Tripura Split Bamboo Craft', '#587A5B', '#FFF9EF', 'Micro-thin Pliable Woven Bamboo Screen & Basketry'),
    ('UP', 'Banarasi Silk & Chikankari', '#881B34', '#FFF9EF', 'Mughal Gold Zari Brocade & Shadow White Needlework'),
    ('UK', 'Aipan Ritual Floor Art', '#A33327', '#FFF9EF', 'Geru Terracotta Clay Base with Rice-Paste Sacred Mandala'),
    ('WB', 'Baluchari Silk & Bankura Horse', '#9C2738', '#FFF9EF', 'Epics Pallu Weave & Long-eared Terracotta Votive Horse'),
    ('AN', 'Andaman Padauk Woodcraft', '#7B3F28', '#F5EAE1', 'Dense Padauk Hardwood Carving & Turbo Sea Shell Art'),
    ('CH', 'Modernist Tapestry Weaving', '#3F5E78', '#F5F7FA', 'Le Corbusier Architectural Geometric Handloom'),
    ('DN', 'Warli Coastal Shellcraft', '#6E473B', '#FAF3EB', 'Tribal Tarpa Dance Mural & Marine Sea Shell Ornaments'),
    ('DL', 'Zardozi Gold & Meenakari', '#A07116', '#001D36', 'Metallic Bullion Wire Embroidery & Vitreous Enamel Art'),
    ('JK', 'Kashmir Pashmina & Walnut Wood', '#3D5A73', '#F9F6F0', 'Kani Taleem Wooden Needle Pashmina & Deep Walnut Relief'),
    ('LA', 'Ladakhi Pashmina & Metalcraft', '#855845', '#F5EFEB', 'Changthangi 12-Micron Cashmere & Chilling Copper Teapots'),
    ('LD', 'Lagoon Coir & Coconut Shell', '#486B62', '#F4F7F5', 'Naturally Cured Golden Lagoon Coir & Polished Shellware'),
    ('PY', 'Villianur Temple Terracotta', '#A84C2A', '#FBF6EE', 'Lake Clay Monumental Sculpture & Handmade Rag Paper')
]

for code, title, primary_col, bg_col, desc in CRAFTS_INFO:
    svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <rect width="120" height="120" rx="16" fill="{bg_col}"/>
  <rect x="3" y="3" width="114" height="114" rx="13" fill="none" stroke="{primary_col}" stroke-width="1.5" stroke-opacity="0.35"/>
  <circle cx="60" cy="50" r="26" fill="{primary_col}" fill-opacity="0.15"/>
  <circle cx="60" cy="50" r="20" fill="none" stroke="{primary_col}" stroke-width="1.2" stroke-dasharray="3 2"/>
  <text x="60" y="57" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="{primary_col}" text-anchor="middle">{code}</text>
  <rect x="10" y="86" width="100" height="22" rx="6" fill="{primary_col}" fill-opacity="0.92"/>
  <text x="60" y="100" font-family="system-ui, sans-serif" font-size="7.5" font-weight="bold" fill="#FFFFFF" text-anchor="middle">{title[:20]}</text>
</svg>'''
    file_path = os.path.join(out_dir, f"{code.lower()}-craft.svg")
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(svg_content)

print(f"Generated {len(CRAFTS_INFO)} craft thumbnails!")
