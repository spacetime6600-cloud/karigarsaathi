import { ArtisanProfile, BuyerEnquiry, CoordinatorAssignment, PublicCraftPassport } from '@/types';
import { ProductRecord } from '@/domain/products';
import { RecordedSale, BuyerSector } from '@/domain/analytics';
import { storage } from '@/services/storage/localStorage';
import { db } from '@/config/firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { logger } from '@/services/logging/logger';

export const DEMO_DATASET_ID = 'sih_presentation_2026';

// -----------------------------------------------------------------------------
// 1. Six Dedicated Artisan Profiles
// -----------------------------------------------------------------------------
export const DEMO_ARTISANS: ArtisanProfile[] = [
  {
    id: 'demo_artisan_ravi',
    name: 'Ravi Kumar',
    phone: '9876543210',
    role: 'artisan',
    craftType: 'Handloom Muga & Mulberry Silk Weaving',
    location: 'Sualkuchi, Kamrup Rural, Assam',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Ravi Handlooms & Heritage Weaves',
    bio: 'Master weaver with 24 years of experience preserving indigenous golden Muga silk, natural terracotta dyeing, and traditional Assamese Jamdani motifs.',
    joinedYear: 2021,
  },
  {
    id: 'demo_artisan_sunita',
    name: 'Sunita Devi',
    phone: '9876543211',
    role: 'artisan',
    craftType: 'Mithila & Madhubani Folk Painting',
    location: 'Ranti Village, Madhubani, Bihar',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Mithila Kala Heritage Centre',
    bio: 'State-awarded master artist specializing in natural twig-and-nib painting on handmade paper and Ahimsa tussar silk fabrics.',
    joinedYear: 2022,
  },
  {
    id: 'demo_artisan_rameshwar',
    name: 'Rameshwar Sahu',
    phone: '9876543212',
    role: 'artisan',
    craftType: 'Dhokra Lost-Wax Bell Metal Casting',
    location: 'Kondagaon, Bastar, Chhattisgarh',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Bastar Bell Metal Craft Guild',
    bio: 'Traditional 4th-generation metalsmith creating hollow-cast brass tribal figurines, lamps, and musical motifs using alluvial clay and beeswax moulds.',
    joinedYear: 2021,
  },
  {
    id: 'demo_artisan_farooq',
    name: 'Farooq Ahmed',
    phone: '9876543213',
    role: 'artisan',
    craftType: 'Carved Walnut Woodcraft & Lacquerware',
    location: 'Zadibal, Srinagar, Jammu & Kashmir',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Chinar Woodcrafts & Artifacts',
    bio: 'Artisan carver creating intricate lattice jaali work and floral reliefs using sustainably harvested native Kashmiri walnut wood.',
    joinedYear: 2020,
  },
  {
    id: 'demo_artisan_ananya',
    name: 'Ananya Mohapatra',
    phone: '9876543214',
    role: 'artisan',
    craftType: 'Pattachitra Scroll Painting & Palm Leaf Etching',
    location: 'Raghurajpur Heritage Crafts Village, Puri, Odisha',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Utkala Pattachitra Mandir',
    bio: 'Preserving ancient Oriya scroll narratives using natural mineral pigments, conch-shell whites, and iron-stylus palm leaf etchings.',
    joinedYear: 2022,
  },
  {
    id: 'demo_artisan_biren',
    name: 'Biren Das',
    phone: '9876543215',
    role: 'artisan',
    craftType: 'Split Bamboo & Cane Structural Weaving',
    location: 'Garamur, Majuli Island, Assam',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Majuli Eco-Cane Artisans',
    bio: 'Crafting fine bamboo storage units, lanterns, and modern eco-friendly lifestyle products using indigenous riverine cane.',
    joinedYear: 2023,
  },
];

// -----------------------------------------------------------------------------
// 2. Two Dedicated Coordinator Accounts & Geographic Assignments
// -----------------------------------------------------------------------------
export const DEMO_COORDINATORS: ArtisanProfile[] = [
  {
    id: 'demo_coord_priya',
    name: 'Priya Sharma',
    phone: '9123456780',
    role: 'coordinator',
    craftType: 'Eastern & North-East Cluster Linkage Coordinator',
    location: 'Guwahati Cluster Hub, Assam',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Eastern Handloom & Handicraft Development Board',
    bio: 'Regional coordinator facilitating digital craft passports, living-wage pricing audits, and institutional exports for Assam, Bihar, and Odisha clusters.',
    joinedYear: 2020,
  },
  {
    id: 'demo_coord_vikram',
    name: 'Vikramaditya Rathore',
    phone: '9123456781',
    role: 'coordinator',
    craftType: 'Central & Western Heritage Crafts Coordinator',
    location: 'Raipur & Jaipur Regional Field Office',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    workshopName: 'Tribal Craft Development Federation',
    bio: 'Facilitating fair trade compliance, buyer enquiry verification, and logistics for Bastar metalcraft and Northern artisan clusters.',
    joinedYear: 2019,
  },
];

export const DEMO_COORDINATOR_ASSIGNMENTS: CoordinatorAssignment[] = [
  // Priya's assigned artisans: Ravi, Sunita, Biren
  {
    id: 'coord_demo_coord_priya_demo_artisan_ravi',
    coordinatorUid: 'demo_coord_priya',
    artisanUid: 'demo_artisan_ravi',
    artisanName: 'Ravi Kumar',
    clusterName: 'Kamrup Silk & Jamdani Cluster',
    active: true,
    approvedAt: '2026-06-01T10:00:00Z',
    approvedBy: 'admin_root',
    permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
    createdAt: '2026-06-01T10:00:00Z',
    updatedAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'coord_demo_coord_priya_demo_artisan_sunita',
    coordinatorUid: 'demo_coord_priya',
    artisanUid: 'demo_artisan_sunita',
    artisanName: 'Sunita Devi',
    clusterName: 'Madhubani Painting Cluster',
    active: true,
    approvedAt: '2026-06-05T10:00:00Z',
    approvedBy: 'admin_root',
    permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
    createdAt: '2026-06-05T10:00:00Z',
    updatedAt: '2026-06-05T10:00:00Z',
  },
  {
    id: 'coord_demo_coord_priya_demo_artisan_biren',
    coordinatorUid: 'demo_coord_priya',
    artisanUid: 'demo_artisan_biren',
    artisanName: 'Biren Das',
    clusterName: 'Majuli Cane & Bamboo Cluster',
    active: true,
    approvedAt: '2026-06-10T10:00:00Z',
    approvedBy: 'admin_root',
    permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
    createdAt: '2026-06-10T10:00:00Z',
    updatedAt: '2026-06-10T10:00:00Z',
  },

  // Vikram's assigned artisans: Rameshwar, Farooq, Ananya
  {
    id: 'coord_demo_coord_vikram_demo_artisan_rameshwar',
    coordinatorUid: 'demo_coord_vikram',
    artisanUid: 'demo_artisan_rameshwar',
    artisanName: 'Rameshwar Sahu',
    clusterName: 'Bastar Bell Metal Guild',
    active: true,
    approvedAt: '2026-06-02T10:00:00Z',
    approvedBy: 'admin_root',
    permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
    createdAt: '2026-06-02T10:00:00Z',
    updatedAt: '2026-06-02T10:00:00Z',
  },
  {
    id: 'coord_demo_coord_vikram_demo_artisan_farooq',
    coordinatorUid: 'demo_coord_vikram',
    artisanUid: 'demo_artisan_farooq',
    artisanName: 'Farooq Ahmed',
    clusterName: 'Srinagar Woodcraft Cluster',
    active: true,
    approvedAt: '2026-06-04T10:00:00Z',
    approvedBy: 'admin_root',
    permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
    createdAt: '2026-06-04T10:00:00Z',
    updatedAt: '2026-06-04T10:00:00Z',
  },
  {
    id: 'coord_demo_coord_vikram_demo_artisan_ananya',
    coordinatorUid: 'demo_coord_vikram',
    artisanUid: 'demo_artisan_ananya',
    artisanName: 'Ananya Mohapatra',
    clusterName: 'Raghurajpur Heritage Village',
    active: true,
    approvedAt: '2026-06-08T10:00:00Z',
    approvedBy: 'admin_root',
    permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
    createdAt: '2026-06-08T10:00:00Z',
    updatedAt: '2026-06-08T10:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// 3. Twelve Presentation Craft Products
// -----------------------------------------------------------------------------
export const DEMO_PRODUCTS: ProductRecord[] = [
  // 1. Ravi Kumar — Published Muga Silk Saree with active Craft Passport
  {
    id: 'prod_muga_silk_saree_01',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Assam Muga Silk Saree with Traditional Gos Buta',
    description: 'Rare wild golden Muga silk saree meticulously hand-loomed in Sualkuchi with authentic flora-inspired Gos Buta motifs and natural terracotta dyed pallu border.',
    category: 'Handloom Textiles',
    craftType: 'Muga Silk Handloom Weaving',
    state: 'Assam',
    material: '100% Pure Muga Silk & Natural Zari',
    materials: ['Wild Golden Muga Silk Yarn', 'Natural Plant-Extracted Mordants', 'Pure Silver-Coated Zari Thread'],
    technique: 'Traditional Pit Loom Extra-Weft Brocade',
    dimensions: '6.4m x 1.15m (with matching unstitched blouse piece)',
    price: 18500,
    currency: 'INR',
    stockQuantity: 4,
    status: 'published',
    passportSlug: 'assam-muga-silk-saree-kamrup-7701',
    photoPaths: ['/src/assets/marketplace/craft-category-textiles.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-textiles.jpg',
    createdAt: '2026-06-15T09:30:00Z',
    updatedAt: '2026-08-20T14:15:00Z',
  },

  // 2. Ravi Kumar — Published Eri Silk Stole
  {
    id: 'prod_eri_silk_stole_02',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Natural Indigo-Dyed Eri Silk Stole (Ahimsa Peace Silk)',
    description: 'Cruelty-free handspun Eri silk scarf with soft thermal texture, hand-dyed with organic indigo leaves and finished with delicate hand-knotted fringe.',
    category: 'Handloom Textiles',
    craftType: 'Eri Peace Silk Weaving',
    state: 'Assam',
    material: 'Handspun Ahimsa Eri Silk',
    materials: ['Organic Cultivated Eri Silk', 'Fermented Indigo Leaf Dye'],
    technique: 'Four-Shaft Frame Loom Weave',
    dimensions: '2.0m x 0.65m',
    price: 4200,
    currency: 'INR',
    stockQuantity: 8,
    status: 'published',
    passportSlug: 'natural-dyed-eri-silk-stole-sualkuchi-7702',
    photoPaths: ['/src/assets/marketplace/craft-story-loom.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-story-loom.jpg',
    createdAt: '2026-06-20T11:00:00Z',
    updatedAt: '2026-08-18T10:00:00Z',
  },

  // 3. Ravi Kumar — Ready for Review Jamdani Dupatta
  {
    id: 'prod_jamdani_dupatta_03',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Handloomed Terracotta & Indigo Jamdani Dupatta',
    description: 'Fine translucent mulberry silk dupatta with discontinuous weft geometric motifs inspired by Brahmaputra river ripples.',
    category: 'Handloom Textiles',
    craftType: 'Silk Jamdani Weaving',
    state: 'Assam',
    material: 'Fine Mulberry Silk & Organic Cotton Warp',
    materials: ['Mulberry Silk 60D', 'Combed Cotton Yarn 100s', 'Mineral Dye'],
    technique: 'Discontinuous Weft Supplementary Looming',
    dimensions: '2.5m x 0.9m',
    price: 6800,
    currency: 'INR',
    stockQuantity: 3,
    status: 'ready',
    photoPaths: ['/src/assets/marketplace/craft-category-textiles.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-textiles.jpg',
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-08-25T16:00:00Z',
  },

  // 4. Ravi Kumar — Published Assamese Gamosa (Low stock alert)
  {
    id: 'prod_assamese_gamosa_04',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Traditional Assamese Phulam Gamosa with Red Floral Border',
    description: 'Authentic cotton Gamosa handwoven with vibrant scarlet floral cross-border patterns signifying cultural honour and welcome.',
    category: 'Handloom Textiles',
    craftType: 'Phulam Gamosa Weaving',
    state: 'Assam',
    material: '100% Pure Organic Cotton',
    materials: ['High-count Natural Cotton Yarn', 'Fast-dyed Crimson Cotton Thread'],
    technique: 'Handloom Plain Weave with Tapestry Weft Insertion',
    dimensions: '1.6m x 0.7m',
    price: 1250,
    currency: 'INR',
    stockQuantity: 1,
    status: 'published',
    passportSlug: 'traditional-assamese-gamosa-kamrup-7704',
    photoPaths: ['/src/assets/marketplace/craft-category-textiles.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-textiles.jpg',
    createdAt: '2026-07-01T12:00:00Z',
    updatedAt: '2026-08-22T09:00:00Z',
  },

  // 5. Ravi Kumar — Incomplete Draft (Ideal for testing "Resume Draft" live in presentation)
  {
    id: 'prod_bihu_tapestry_draft_05',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Mulberry Silk Wall Hanging Tapestry - Bihu Folk Motif',
    description: 'Decorative handwoven wall hanging celebrating springtime harvest festivities with traditional dhol drum and horn dancers motif.',
    category: 'Handloom Textiles',
    craftType: 'Tapestry Brocade Weaving',
    state: 'Assam',
    material: 'Raw Silk & Bamboo Hanging Rod',
    materials: ['Heavy Denier Raw Mulberry Silk', 'Natural Turmeric & Madder Root Dyes'],
    technique: 'Tapestry Weave',
    dimensions: '1.2m x 0.8m',
    price: 5200,
    currency: 'INR',
    stockQuantity: 2,
    status: 'draft',
    needsReviewFacts: [
      {
        key: 'hours',
        label: 'Crafting Hours',
        value: '42 hours',
        isConfirmed: false,
        confidenceScore: 0.85,
        needsReviewReason: 'Confirm living wage labor hours breakdown',
      },
    ],
    photoPaths: ['/src/assets/marketplace/craft-story-loom.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-story-loom.jpg',
    createdAt: '2026-08-26T14:00:00Z',
    updatedAt: '2026-08-28T18:30:00Z',
  },

  // 6. Ravi Kumar — Ready Shawl
  {
    id: 'prod_raw_silk_shawl_06',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Pure Raw Silk Warp Shawl with Tribal Geometric Border',
    description: 'Heavyweight winter wrap woven with textured hand-reeled raw silk yarns, featuring geometric chevron edge motifs in natural mineral black.',
    category: 'Handloom Textiles',
    craftType: 'Textured Raw Silk Weaving',
    state: 'Assam',
    material: 'Coarse Raw Reeled Silk',
    materials: ['Unbleached Raw Silk', 'Plant Gall-Nut Black Dye'],
    technique: 'Fly-Shuttle Loom Twill Weave',
    dimensions: '2.2m x 1.0m',
    price: 8900,
    currency: 'INR',
    stockQuantity: 5,
    status: 'ready',
    photoPaths: ['/src/assets/marketplace/craft-category-textiles.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-textiles.jpg',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-27T11:00:00Z',
  },

  // 7. Sunita Devi — Published Madhubani Canvas Painting
  {
    id: 'prod_madhubani_canvas_07',
    ownerId: 'demo_artisan_sunita',
    artisanId: 'demo_artisan_sunita',
    title: 'Madhubani Tree of Life Folk Art Canvas Painting',
    description: 'Intricate Kachni and Bharni style painting depicting the celestial Kalpavriksha tree with pairs of peacocks and fish symbols of fertility and harmony.',
    category: 'Folk & Traditional Art',
    craftType: 'Mithila / Madhubani Painting',
    state: 'Bihar',
    material: 'Natural Mineral & Vegetable Pigments on Handmade Cloth Paper',
    materials: ['Handmade Bamboo Paper', 'Lampblack', 'Indigo', 'Kusum Flower Red', 'Turmeric Yellow'],
    technique: 'Bamboo Twig and Cotton Nib Freehand Drawing',
    dimensions: '75cm x 50cm (Unframed)',
    price: 5500,
    currency: 'INR',
    stockQuantity: 2,
    status: 'published',
    passportSlug: 'madhubani-tree-of-life-canvas-bihar-8801',
    photoPaths: ['/src/assets/marketplace/craft-category-painting.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-painting.jpg',
    createdAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-08-19T15:00:00Z',
  },

  // 8. Rameshwar Sahu — Published Dhokra Bell Metal Figure
  {
    id: 'prod_dhokra_figure_08',
    ownerId: 'demo_artisan_rameshwar',
    artisanId: 'demo_artisan_rameshwar',
    title: 'Dhokra Brass Tribal Dancing Figure (Lost-Wax Casting)',
    description: '4,000-year-old traditional hollow bell metal sculpture portraying a Bastar tribal dancer with ceremonial dhol drum and brass horn.',
    category: 'Metalwork & Sculptures',
    craftType: 'Dhokra Lost-Wax Casting',
    state: 'Chhattisgarh',
    material: 'Scrap Brass & Bell Metal Alloy',
    materials: ['Recycled Brass Ingots', 'Natural Beeswax Filaments', 'Alluvial Anthill Clay'],
    technique: 'Cire-Perdue (Lost Wax Technique)',
    dimensions: '28cm x 14cm x 10cm',
    price: 3800,
    currency: 'INR',
    stockQuantity: 4,
    status: 'published',
    passportSlug: 'dhokra-brass-tribal-figure-bastar-9901',
    photoPaths: ['/src/assets/marketplace/craft-category-metalwork.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-metalwork.jpg',
    createdAt: '2026-07-14T09:00:00Z',
    updatedAt: '2026-08-21T13:00:00Z',
  },

  // 9. Farooq Ahmed — Published Carved Walnut Wood Trinket Box
  {
    id: 'prod_walnut_box_09',
    ownerId: 'demo_artisan_farooq',
    artisanId: 'demo_artisan_farooq',
    title: 'Hand-Carved Kashmiri Walnut Wood Trinket Jewellery Box',
    description: 'Seasoned Himalayan walnut wood box carved with relief dragon and chinar leaf arabesques, velvet lined with hidden locking key.',
    category: 'Woodcraft & Carvings',
    craftType: 'Kashmiri Walnut Wood Carving',
    state: 'Jammu and Kashmir',
    material: 'Mature Juglans Regia (Kashmir Walnut Wood)',
    materials: ['Sun-dried Walnut Wood', 'Natural Wax Polish', 'Brass Hinges'],
    technique: 'Deep Undercut Relief Chiseling',
    dimensions: '20cm x 12cm x 8cm',
    price: 2900,
    currency: 'INR',
    stockQuantity: 6,
    status: 'published',
    passportSlug: 'carved-walnut-wood-box-kashmir-6601',
    photoPaths: ['/src/assets/marketplace/craft-category-woodcraft.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-woodcraft.jpg',
    createdAt: '2026-07-20T11:30:00Z',
    updatedAt: '2026-08-23T10:00:00Z',
  },

  // 10. Ananya Mohapatra — Published Pattachitra Scroll
  {
    id: 'prod_pattachitra_scroll_10',
    ownerId: 'demo_artisan_ananya',
    artisanId: 'demo_artisan_ananya',
    title: 'Traditional Raghurajpur Pattachitra Cloth Scroll Painting',
    description: 'Exquisite cloth-based scroll depicting Krishna Leela stories painted on treated cotton canvas with conch shell white and stone pigments.',
    category: 'Folk & Traditional Art',
    craftType: 'Odia Pattachitra Art',
    state: 'Odisha',
    material: 'Treated Cotton Cloth Canvas & Natural Mineral Pigments',
    materials: ['Tamarind Seed Gum Treated Canvas', 'Natural Stone Ochre', 'Hingula Vermilion', 'Lampblack'],
    technique: 'Traditional Fine-line Stylus Painting & Varnish Sealing',
    dimensions: '90cm x 40cm',
    price: 7200,
    currency: 'INR',
    stockQuantity: 2,
    status: 'published',
    passportSlug: 'raghurajpur-pattachitra-scroll-odisha-5501',
    photoPaths: ['/src/assets/marketplace/craft-category-painting.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-painting.jpg',
    createdAt: '2026-07-25T14:00:00Z',
    updatedAt: '2026-08-24T12:00:00Z',
  },

  // 11. Biren Das — Published Cane Storage Basket Set
  {
    id: 'prod_bamboo_basket_11',
    ownerId: 'demo_artisan_biren',
    artisanId: 'demo_artisan_biren',
    title: 'Handcrafted Assam Split-Bamboo Eco Storage Basket Set (Set of 3)',
    description: 'Sustainable hand-braided bamboo organizers featuring fine hexagonal weaving pattern and steam-bent reinforced cane rim.',
    category: 'Cane & Bamboo Crafts',
    craftType: 'Assam Bamboo Weaving',
    state: 'Assam',
    material: 'Native Riverbank Bhaluka Bamboo & Jati Cane',
    materials: ['Seasoned Split Bamboo Strips', 'Smoked Jati Cane Straps', 'Natural Plant Varnish'],
    technique: 'Fine Hexagonal Interlocking Basketry',
    dimensions: 'Large: 30x30cm, Med: 24x24cm, Small: 18x18cm',
    price: 1850,
    currency: 'INR',
    stockQuantity: 12,
    status: 'published',
    passportSlug: 'split-bamboo-storage-basket-majuli-4401',
    photoPaths: ['/src/assets/marketplace/craft-category-cane.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-cane.jpg',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-25T15:00:00Z',
  },

  // 12. Sunita Devi — Ready Mithila Peacock Dupatta
  {
    id: 'prod_mithila_dupatta_12',
    ownerId: 'demo_artisan_sunita',
    artisanId: 'demo_artisan_sunita',
    title: 'Handpainted Mithila Peacock Motif Tussar Silk Dupatta',
    description: 'Golden beige wild tussar silk wrap decorated with hand-painted peacock pairs and floral borders along the length and tassels.',
    category: 'Handloom Textiles',
    craftType: 'Tussar Handpainting',
    state: 'Bihar',
    material: '100% Bhagalpur Tussar Silk & Fast Dyes',
    materials: ['Unbleached Tussar Silk Fabric', 'Non-toxic Permanent Fabric Inks'],
    technique: 'Freehand Fine Nib Textile Painting',
    dimensions: '2.4m x 0.85m',
    price: 4600,
    currency: 'INR',
    stockQuantity: 3,
    status: 'ready',
    photoPaths: ['/src/assets/marketplace/craft-category-textiles.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-textiles.jpg',
    createdAt: '2026-08-18T10:00:00Z',
    updatedAt: '2026-08-27T09:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// 4. Eight Realistic Buyer Enquiries Across Workflow States
// -----------------------------------------------------------------------------
export const DEMO_ENQUIRIES: BuyerEnquiry[] = [
  {
    id: 'enq_demo_01',
    productId: 'prod_muga_silk_saree_01',
    productTitle: 'Assam Muga Silk Saree with Traditional Gos Buta',
    artisanId: 'demo_artisan_ravi',
    buyerName: 'Aarav Mehta',
    buyerOrganisation: 'Heritage Living Boutique, Mumbai',
    buyerPhone: '+91 98200 XXXXX',
    buyerContact: '+91 98200 XXXXX',
    buyerEmail: 'sourcing.aarav@demo-craft-buyer.local',
    quantityRequested: 15,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    message: 'Namaste Ravi ji, we are interested in curating 15 pieces of the Assam Muga Silk Saree for our Diwali festive showcase. Could you share the production lead time?',
    status: 'new',
    receivedAt: '2026-08-27T10:15:00Z',
    createdAt: '2026-08-27T10:15:00Z',
    updatedAt: '2026-08-27T10:15:00Z',
    replies: [],
    schemaVersion: 1,
  },
  {
    id: 'enq_demo_02',
    productId: 'prod_eri_silk_stole_02',
    productTitle: 'Natural Indigo-Dyed Eri Silk Stole (Ahimsa Peace Silk)',
    artisanId: 'demo_artisan_ravi',
    buyerName: 'Meera Nambiar',
    buyerOrganisation: 'Sustainable Fashion Collective, Bengaluru',
    buyerPhone: '+91 94480 XXXXX',
    buyerContact: '+91 94480 XXXXX',
    buyerEmail: 'meera.design@demo-craft-buyer.local',
    quantityRequested: 10,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    message: 'Hello, can the Eri Silk Stole be customized in a deep forest-green natural dye from local leaves instead of indigo?',
    status: 'replied',
    receivedAt: '2026-08-25T14:30:00Z',
    createdAt: '2026-08-25T14:30:00Z',
    updatedAt: '2026-08-26T09:00:00Z',
    replies: [
      {
        id: 'rep_01',
        sender: 'artisan',
        text: 'Namaste Meera ji! Yes, we extract a rich olive and forest green using local Nahor tree bark and tea-leaf bath. It takes approximately 4 additional days.',
        timestamp: '2026-08-26T09:00:00Z',
      },
    ],
    schemaVersion: 1,
  },
  {
    id: 'enq_demo_03',
    productId: 'prod_assamese_gamosa_04',
    productTitle: 'Traditional Assamese Phulam Gamosa with Red Floral Border',
    artisanId: 'demo_artisan_ravi',
    buyerName: 'Rohit Deshmukh',
    buyerOrganisation: 'Cultural Events Society, Pune',
    buyerPhone: '+91 97650 XXXXX',
    buyerContact: '+91 97650 XXXXX',
    buyerEmail: 'rohit.d@demo-craft-buyer.local',
    quantityRequested: 20,
    preferredContactMethod: 'phone',
    consentToBeContacted: true,
    message: 'Looking to order 20 Assamese Gamosas for our upcoming inter-state cultural symposium. What is the batch rate?',
    status: 'replied',
    receivedAt: '2026-08-23T11:20:00Z',
    createdAt: '2026-08-23T11:20:00Z',
    updatedAt: '2026-08-24T16:00:00Z',
    replies: [
      {
        id: 'rep_02',
        sender: 'artisan',
        text: 'Namaste Rohit ji, batch volume orders above 10 units are certified under fair trade living wages at ₹1,100 per unit with official Craft Passport tags.',
        timestamp: '2026-08-24T16:00:00Z',
      },
    ],
    schemaVersion: 1,
  },
  {
    id: 'enq_demo_04',
    productId: 'prod_muga_silk_saree_01',
    productTitle: 'Assam Muga Silk Saree with Traditional Gos Buta',
    artisanId: 'demo_artisan_ravi',
    buyerName: 'Elena Rostova',
    buyerOrganisation: 'Global Artisans Museum Store, Berlin',
    buyerPhone: '+49 152 XXXXXXXX',
    buyerContact: '+49 152 XXXXXXXX',
    buyerEmail: 'e.rostova@demo-museum-curation.local',
    quantityRequested: 2,
    preferredContactMethod: 'email',
    consentToBeContacted: true,
    message: 'We verified the Craft Passport for this Muga Silk saree via the QR code. We would like to feature this maker provenance story in our Indian textile exhibition.',
    status: 'new',
    receivedAt: '2026-08-28T08:45:00Z',
    createdAt: '2026-08-28T08:45:00Z',
    updatedAt: '2026-08-28T08:45:00Z',
    replies: [],
    schemaVersion: 1,
  },
  {
    id: 'enq_demo_05',
    productId: 'prod_assamese_gamosa_04',
    productTitle: 'Traditional Assamese Phulam Gamosa with Red Floral Border',
    artisanId: 'demo_artisan_ravi',
    buyerName: 'Kavita Singhania',
    buyerPhone: '+91 98110 XXXXX',
    buyerContact: '+91 98110 XXXXX',
    buyerEmail: 'kavita.singh@demo-craft-buyer.local',
    quantityRequested: 1,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    message: 'Package safely received in New Delhi! The craftsmanship is extraordinary and the scanned digital passport authenticated the weaver origin immediately.',
    status: 'closed',
    receivedAt: '2026-08-15T12:00:00Z',
    createdAt: '2026-08-15T12:00:00Z',
    updatedAt: '2026-08-20T17:00:00Z',
    replies: [
      {
        id: 'rep_03',
        sender: 'artisan',
        text: 'Thank you so much Kavita ji! Your patronage directly supports 3 weaver families in Sualkuchi.',
        timestamp: '2026-08-20T17:00:00Z',
      },
    ],
    schemaVersion: 1,
  },

  // 3 enquiries for other artisans
  {
    id: 'enq_demo_06',
    productId: 'prod_madhubani_canvas_07',
    productTitle: 'Madhubani Tree of Life Folk Art Canvas Painting',
    artisanId: 'demo_artisan_sunita',
    buyerName: 'Devika Ray',
    buyerOrganisation: 'Folk Art Foundation, Kolkata',
    buyerPhone: '+91 98300 XXXXX',
    buyerContact: '+91 98300 XXXXX',
    buyerEmail: 'curator@demo-folkart.local',
    quantityRequested: 1,
    preferredContactMethod: 'email',
    consentToBeContacted: true,
    message: 'Inquiring about commissioning a custom 6ft x 4ft Madhubani Tree of Life mural canvas.',
    status: 'new',
    receivedAt: '2026-08-26T15:00:00Z',
    createdAt: '2026-08-26T15:00:00Z',
    updatedAt: '2026-08-26T15:00:00Z',
    replies: [],
    schemaVersion: 1,
  },
  {
    id: 'enq_demo_07',
    productId: 'prod_dhokra_figure_08',
    productTitle: 'Dhokra Brass Tribal Dancing Figure',
    artisanId: 'demo_artisan_rameshwar',
    buyerName: 'Karan Virani',
    buyerOrganisation: 'Studio Virani Interior Architecture, Ahmedabad',
    buyerPhone: '+91 98790 XXXXX',
    buyerContact: '+91 98790 XXXXX',
    buyerEmail: 'karan@demo-architecture.local',
    quantityRequested: 6,
    preferredContactMethod: 'phone',
    consentToBeContacted: true,
    message: 'Requesting sample dimensions and shipping weight for 6 Bastar Dhokra Dancing Figures for a hospitality project.',
    status: 'replied',
    receivedAt: '2026-08-24T13:00:00Z',
    createdAt: '2026-08-24T13:00:00Z',
    updatedAt: '2026-08-25T11:00:00Z',
    replies: [],
    schemaVersion: 1,
  },
  {
    id: 'enq_demo_08',
    productId: 'prod_bamboo_basket_11',
    productTitle: 'Handcrafted Assam Split-Bamboo Storage Basket Set',
    artisanId: 'demo_artisan_biren',
    buyerName: 'Pooja Hegde',
    buyerOrganisation: 'EarthHome Sustainable Living, Hyderabad',
    buyerPhone: '+91 99890 XXXXX',
    buyerContact: '+91 99890 XXXXX',
    buyerEmail: 'pooja@demo-earthhome.local',
    quantityRequested: 30,
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    message: 'We would like to place an initial order for 30 sets of the Majuli split-bamboo storage baskets for our zero-waste store.',
    status: 'new',
    receivedAt: '2026-08-27T16:20:00Z',
    createdAt: '2026-08-27T16:20:00Z',
    updatedAt: '2026-08-27T16:20:00Z',
    replies: [],
    schemaVersion: 1,
  },
];

// -----------------------------------------------------------------------------
// 5. Fifteen Realistic Recorded Sales (Distributed across the past 90 days)
// -----------------------------------------------------------------------------
export const DEMO_SALES: RecordedSale[] = [
  // 10 Sales for Primary Artisan Ravi Kumar (Totals: 14 units, ₹1,12,050 across 7 regions)
  {
    id: 'sale_demo_ravi_01',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_muga_silk_saree_01',
    productTitle: 'Assam Muga Silk Saree with Traditional Gos Buta',
    category: 'Handloom Textiles',
    quantity: 1,
    unitPrice: 18500,
    totalAmount: 18500,
    currency: 'INR',
    buyerRegionCode: 'DL',
    buyerRegionName: 'Delhi NCR',
    buyerSector: 'individual' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-26T14:30:00Z',
  },
  {
    id: 'sale_demo_ravi_02',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_eri_silk_stole_02',
    productTitle: 'Natural Indigo-Dyed Eri Silk Stole (Ahimsa Peace Silk)',
    category: 'Handloom Textiles',
    quantity: 2,
    unitPrice: 4200,
    totalAmount: 8400,
    currency: 'INR',
    buyerRegionCode: 'MH',
    buyerRegionName: 'Maharashtra',
    buyerSector: 'retailer' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-24T11:15:00Z',
  },
  {
    id: 'sale_demo_ravi_03',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_assamese_gamosa_04',
    productTitle: 'Traditional Assamese Phulam Gamosa',
    category: 'Handloom Textiles',
    quantity: 4,
    unitPrice: 1250,
    totalAmount: 5000,
    currency: 'INR',
    buyerRegionCode: 'AS',
    buyerRegionName: 'Assam',
    buyerSector: 'other' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-21T16:00:00Z',
  },
  {
    id: 'sale_demo_ravi_04',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_muga_silk_saree_01',
    productTitle: 'Assam Muga Silk Saree with Traditional Gos Buta',
    category: 'Handloom Textiles',
    quantity: 1,
    unitPrice: 18500,
    totalAmount: 18500,
    currency: 'INR',
    buyerRegionCode: 'KA',
    buyerRegionName: 'Karnataka',
    buyerSector: 'individual' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-17T09:45:00Z',
  },
  {
    id: 'sale_demo_ravi_05',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_eri_silk_stole_02',
    productTitle: 'Natural Indigo-Dyed Eri Silk Stole',
    category: 'Handloom Textiles',
    quantity: 2,
    unitPrice: 4200,
    totalAmount: 8400,
    currency: 'INR',
    buyerRegionCode: 'WB',
    buyerRegionName: 'West Bengal',
    buyerSector: 'individual' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-12T15:20:00Z',
  },
  {
    id: 'sale_demo_ravi_06',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_muga_silk_saree_01',
    productTitle: 'Assam Muga Silk Saree with Traditional Gos Buta',
    category: 'Handloom Textiles',
    quantity: 1,
    unitPrice: 18500,
    totalAmount: 18500,
    currency: 'INR',
    buyerRegionCode: 'TG',
    buyerRegionName: 'Telangana',
    buyerSector: 'retailer' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-05T10:00:00Z',
  },
  {
    id: 'sale_demo_ravi_07',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_assamese_gamosa_04',
    productTitle: 'Traditional Assamese Phulam Gamosa',
    category: 'Handloom Textiles',
    quantity: 2,
    unitPrice: 1250,
    totalAmount: 2500,
    currency: 'INR',
    buyerRegionCode: 'TN',
    buyerRegionName: 'Tamil Nadu',
    buyerSector: 'individual' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-07-31T13:30:00Z',
  },
  // Previous period (30-90 days ago) for truthful comparison percentages
  {
    id: 'sale_demo_ravi_08',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_muga_silk_saree_01',
    productTitle: 'Assam Muga Silk Saree',
    category: 'Handloom Textiles',
    quantity: 1,
    unitPrice: 17500,
    totalAmount: 17500,
    currency: 'INR',
    buyerRegionCode: 'MH',
    buyerRegionName: 'Maharashtra',
    buyerSector: 'individual' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-07-15T10:00:00Z',
  },
  {
    id: 'sale_demo_ravi_09',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_eri_silk_stole_02',
    productTitle: 'Natural Dyed Eri Silk Stole',
    category: 'Handloom Textiles',
    quantity: 1,
    unitPrice: 4000,
    totalAmount: 4000,
    currency: 'INR',
    buyerRegionCode: 'DL',
    buyerRegionName: 'Delhi NCR',
    buyerSector: 'retailer' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-07-02T16:00:00Z',
  },
  {
    id: 'sale_demo_ravi_10',
    ownerId: 'demo_artisan_ravi',
    productId: 'prod_assamese_gamosa_04',
    productTitle: 'Traditional Assamese Gamosa',
    category: 'Handloom Textiles',
    quantity: 1,
    unitPrice: 1250,
    totalAmount: 1250,
    currency: 'INR',
    buyerRegionCode: 'AS',
    buyerRegionName: 'Assam',
    buyerSector: 'other' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-06-20T12:00:00Z',
  },

  // 5 Sales for Other Demo Artisans
  {
    id: 'sale_demo_sunita_01',
    ownerId: 'demo_artisan_sunita',
    productId: 'prod_madhubani_canvas_07',
    productTitle: 'Madhubani Tree of Life Folk Art Canvas Painting',
    category: 'Folk & Traditional Art',
    quantity: 1,
    unitPrice: 5500,
    totalAmount: 5500,
    currency: 'INR',
    buyerRegionCode: 'DL',
    buyerRegionName: 'Delhi NCR',
    buyerSector: 'other' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-22T15:00:00Z',
  },
  {
    id: 'sale_demo_rameshwar_01',
    ownerId: 'demo_artisan_rameshwar',
    productId: 'prod_dhokra_figure_08',
    productTitle: 'Dhokra Brass Tribal Dancing Figure',
    category: 'Metalwork & Sculptures',
    quantity: 2,
    unitPrice: 3800,
    totalAmount: 7600,
    currency: 'INR',
    buyerRegionCode: 'GJ',
    buyerRegionName: 'Gujarat',
    buyerSector: 'hospitality' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-20T10:00:00Z',
  },
  {
    id: 'sale_demo_farooq_01',
    ownerId: 'demo_artisan_farooq',
    productId: 'prod_walnut_box_09',
    productTitle: 'Hand-Carved Kashmiri Walnut Wood Trinket Box',
    category: 'Woodcraft & Carvings',
    quantity: 1,
    unitPrice: 2900,
    totalAmount: 2900,
    currency: 'INR',
    buyerRegionCode: 'MH',
    buyerRegionName: 'Maharashtra',
    buyerSector: 'individual' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-18T14:00:00Z',
  },
  {
    id: 'sale_demo_ananya_01',
    ownerId: 'demo_artisan_ananya',
    productId: 'prod_pattachitra_scroll_10',
    productTitle: 'Traditional Raghurajpur Pattachitra Cloth Scroll',
    category: 'Folk & Traditional Art',
    quantity: 1,
    unitPrice: 7200,
    totalAmount: 7200,
    currency: 'INR',
    buyerRegionCode: 'WB',
    buyerRegionName: 'West Bengal',
    buyerSector: 'other' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-16T12:00:00Z',
  },
  {
    id: 'sale_demo_biren_01',
    ownerId: 'demo_artisan_biren',
    productId: 'prod_bamboo_basket_11',
    productTitle: 'Handcrafted Assam Split-Bamboo Storage Basket Set',
    category: 'Cane & Bamboo Crafts',
    quantity: 3,
    unitPrice: 1850,
    totalAmount: 5550,
    currency: 'INR',
    buyerRegionCode: 'TG',
    buyerRegionName: 'Telangana',
    buyerSector: 'retailer' as BuyerSector,
    source: 'marketplace',
    recordedAt: '2026-08-25T11:00:00Z',
  },
];

// -----------------------------------------------------------------------------
// 6. Craft Passports for Published Products
// -----------------------------------------------------------------------------
export const DEMO_PUBLIC_PASSPORTS: PublicCraftPassport[] = [
  {
    passportId: 'passport_muga_silk_saree_01',
    productId: 'prod_muga_silk_saree_01',
    ownerId: 'demo_artisan_ravi',
    slug: 'assam-muga-silk-saree-kamrup-7701',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Assam Muga Silk Saree with Traditional Gos Buta',
      description: 'Rare wild golden Muga silk saree meticulously hand-loomed in Sualkuchi with authentic flora-inspired Gos Buta motifs and natural terracotta dyed pallu border.',
      photos: ['/src/assets/marketplace/craft-category-textiles.jpg'],
      category: 'Handloom Textiles',
      technique: 'Traditional Pit Loom Extra-Weft Brocade',
      materials: ['Wild Golden Muga Silk Yarn', 'Natural Plant-Extracted Mordants', 'Pure Silver-Coated Zari Thread'],
      dimensions: '6.4m x 1.15m (with matching unstitched blouse piece)',
      price: 18500,
      currency: 'INR',
      artisanName: 'Ravi Kumar',
      workshopName: 'Ravi Handlooms & Heritage Weaves',
      state: 'Assam',
      district: 'Kamrup Rural',
      artisanStory: 'Master weaver with 24 years of experience preserving indigenous golden Muga silk, natural terracotta dyeing, and traditional Assamese Jamdani motifs.',
      contactOption: true,
      verificationHash: '0x8f2a9e1d4b7c3e5a6f8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0',
    },
    activatedAt: '2026-06-15T09:30:00Z',
    updatedAt: '2026-08-20T14:15:00Z',
  },
  {
    passportId: 'passport_eri_silk_stole_02',
    productId: 'prod_eri_silk_stole_02',
    ownerId: 'demo_artisan_ravi',
    slug: 'natural-dyed-eri-silk-stole-sualkuchi-7702',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Natural Indigo-Dyed Eri Silk Stole (Ahimsa Peace Silk)',
      description: 'Cruelty-free handspun Eri silk scarf with soft thermal texture, hand-dyed with organic indigo leaves and finished with delicate hand-knotted fringe.',
      photos: ['/src/assets/marketplace/craft-story-loom.jpg'],
      category: 'Handloom Textiles',
      technique: 'Four-Shaft Frame Loom Weave',
      materials: ['Organic Cultivated Eri Silk', 'Fermented Indigo Leaf Dye'],
      dimensions: '2.0m x 0.65m',
      price: 4200,
      currency: 'INR',
      artisanName: 'Ravi Kumar',
      workshopName: 'Ravi Handlooms & Heritage Weaves',
      state: 'Assam',
      district: 'Kamrup Rural',
      artisanStory: 'Preserving eco-friendly Ahimsa silk weaving in Sualkuchi.',
      contactOption: true,
      verificationHash: '0x3c7e9a1b5f8d2c4e6a0b8d1f3e5a7b9c1d3e5f7a9b0c2d4e6f8a0b2c4d6e8f0',
    },
    activatedAt: '2026-06-20T11:00:00Z',
    updatedAt: '2026-08-18T10:00:00Z',
  },
  {
    passportId: 'passport_assamese_gamosa_04',
    productId: 'prod_assamese_gamosa_04',
    ownerId: 'demo_artisan_ravi',
    slug: 'traditional-assamese-gamosa-kamrup-7704',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Traditional Assamese Phulam Gamosa with Red Floral Border',
      description: 'Authentic cotton Gamosa handwoven with vibrant scarlet floral cross-border patterns signifying cultural honour and welcome.',
      photos: ['/src/assets/marketplace/craft-category-textiles.jpg'],
      category: 'Handloom Textiles',
      technique: 'Handloom Plain Weave with Tapestry Weft Insertion',
      materials: ['High-count Natural Cotton Yarn', 'Fast-dyed Crimson Cotton Thread'],
      dimensions: '1.6m x 0.7m',
      price: 1250,
      currency: 'INR',
      artisanName: 'Ravi Kumar',
      workshopName: 'Ravi Handlooms & Heritage Weaves',
      state: 'Assam',
      district: 'Kamrup Rural',
      artisanStory: 'Crafting cultural pride through heritage Phulam Gamosa.',
      contactOption: true,
      verificationHash: '0x1b4d7a0c3e6f9b2d5a8c1e4f7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2e5f8a1b4',
    },
    activatedAt: '2026-07-01T12:00:00Z',
    updatedAt: '2026-08-22T09:00:00Z',
  },
  {
    passportId: 'passport_madhubani_canvas_07',
    productId: 'prod_madhubani_canvas_07',
    ownerId: 'demo_artisan_sunita',
    slug: 'madhubani-tree-of-life-canvas-bihar-8801',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Madhubani Tree of Life Folk Art Canvas Painting',
      description: 'Intricate Kachni and Bharni style painting depicting the celestial Kalpavriksha tree with pairs of peacocks and fish symbols of fertility and harmony.',
      photos: ['/src/assets/marketplace/craft-category-painting.jpg'],
      category: 'Folk & Traditional Art',
      technique: 'Bamboo Twig and Cotton Nib Freehand Drawing',
      materials: ['Handmade Bamboo Paper', 'Lampblack', 'Indigo', 'Kusum Flower Red', 'Turmeric Yellow'],
      dimensions: '75cm x 50cm (Unframed)',
      price: 5500,
      currency: 'INR',
      artisanName: 'Sunita Devi',
      workshopName: 'Mithila Kala Heritage Centre',
      state: 'Bihar',
      district: 'Madhubani',
      artisanStory: 'State-awarded master artist specializing in natural twig-and-nib painting.',
      contactOption: true,
      verificationHash: '0x9a2c5e8b1d4f7a0c3e6f9b2d5a8c1e4f7a0b3c6d9e2f5a8b1c4d7e0a3b6c9d2',
    },
    activatedAt: '2026-07-10T10:00:00Z',
    updatedAt: '2026-08-19T15:00:00Z',
  },
  {
    passportId: 'passport_dhokra_figure_08',
    productId: 'prod_dhokra_figure_08',
    ownerId: 'demo_artisan_rameshwar',
    slug: 'dhokra-brass-tribal-figure-bastar-9901',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Dhokra Brass Tribal Dancing Figure (Lost-Wax Casting)',
      description: '4,000-year-old traditional hollow bell metal sculpture portraying a Bastar tribal dancer with ceremonial dhol drum and brass horn.',
      photos: ['/src/assets/marketplace/craft-category-metalwork.jpg'],
      category: 'Metalwork & Sculptures',
      technique: 'Cire-Perdue (Lost Wax Technique)',
      materials: ['Recycled Brass Ingots', 'Natural Beeswax Filaments', 'Alluvial Anthill Clay'],
      dimensions: '28cm x 14cm x 10cm',
      price: 3800,
      currency: 'INR',
      artisanName: 'Rameshwar Sahu',
      workshopName: 'Bastar Bell Metal Craft Guild',
      state: 'Chhattisgarh',
      district: 'Bastar',
      artisanStory: 'Traditional 4th-generation metalsmith creating hollow-cast brass tribal figurines.',
      contactOption: true,
      verificationHash: '0x5f8b1d4e7a0c3f6a9b2d5c8e1a4f7b0c3d6e9f2a5b8c1d4e7a0b3c6d9e2f5a8',
    },
    activatedAt: '2026-07-14T09:00:00Z',
    updatedAt: '2026-08-21T13:00:00Z',
  },
  {
    passportId: 'passport_walnut_box_09',
    productId: 'prod_walnut_box_09',
    ownerId: 'demo_artisan_farooq',
    slug: 'carved-walnut-wood-box-kashmir-6601',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Hand-Carved Kashmiri Walnut Wood Trinket Jewellery Box',
      description: 'Seasoned Himalayan walnut wood box carved with relief dragon and chinar leaf arabesques, velvet lined with hidden locking key.',
      photos: ['/src/assets/marketplace/craft-category-woodcraft.jpg'],
      category: 'Woodcraft & Carvings',
      technique: 'Deep Undercut Relief Chiseling',
      materials: ['Sun-dried Walnut Wood', 'Natural Wax Polish', 'Brass Hinges'],
      dimensions: '20cm x 12cm x 8cm',
      price: 2900,
      currency: 'INR',
      artisanName: 'Farooq Ahmed',
      workshopName: 'Chinar Woodcrafts & Artifacts',
      state: 'Jammu and Kashmir',
      district: 'Srinagar',
      artisanStory: 'Master woodcarver from Zadibal specializing in relief carving.',
      contactOption: true,
      verificationHash: '0x2d4e6f8a0b2c4d6e8f0a2c4e6f8b0d2e4f6a8c0e2a4b6d8f0a2c4e6f8b0d2e4',
    },
    activatedAt: '2026-07-20T11:30:00Z',
    updatedAt: '2026-08-23T10:00:00Z',
  },
  {
    passportId: 'passport_pattachitra_scroll_10',
    productId: 'prod_pattachitra_scroll_10',
    ownerId: 'demo_artisan_ananya',
    slug: 'raghurajpur-pattachitra-scroll-odisha-5501',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Traditional Raghurajpur Pattachitra Cloth Scroll Painting',
      description: 'Exquisite cloth-based scroll depicting Krishna Leela stories painted on treated cotton canvas with conch shell white and stone pigments.',
      photos: ['/src/assets/marketplace/craft-category-painting.jpg'],
      category: 'Folk & Traditional Art',
      technique: 'Traditional Fine-line Stylus Painting & Varnish Sealing',
      materials: ['Tamarind Seed Gum Treated Canvas', 'Natural Stone Ochre', 'Hingula Vermilion', 'Lampblack'],
      dimensions: '90cm x 40cm',
      price: 7200,
      currency: 'INR',
      artisanName: 'Ananya Mohapatra',
      workshopName: 'Utkala Pattachitra Mandir',
      state: 'Odisha',
      district: 'Puri',
      artisanStory: 'Preserving ancient Oriya scroll narratives using natural mineral pigments.',
      contactOption: true,
      verificationHash: '0x7e0a3b6c9d2e5f8a1b4c7e0a3b6c9d2e5f8a1b4c7e0a3b6c9d2e5f8a1b4c7e0',
    },
    activatedAt: '2026-07-25T14:00:00Z',
    updatedAt: '2026-08-24T12:00:00Z',
  },
  {
    passportId: 'passport_bamboo_basket_11',
    productId: 'prod_bamboo_basket_11',
    ownerId: 'demo_artisan_biren',
    slug: 'split-bamboo-storage-basket-majuli-4401',
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Handcrafted Assam Split-Bamboo Eco Storage Basket Set (Set of 3)',
      description: 'Sustainable hand-braided bamboo organizers featuring fine hexagonal weaving pattern and steam-bent reinforced cane rim.',
      photos: ['/src/assets/marketplace/craft-category-cane.jpg'],
      category: 'Cane & Bamboo Crafts',
      technique: 'Fine Hexagonal Interlocking Basketry',
      materials: ['Seasoned Split Bamboo Strips', 'Smoked Jati Cane Straps', 'Natural Plant Varnish'],
      dimensions: 'Large: 30x30cm, Med: 24x24cm, Small: 18x18cm',
      price: 1850,
      currency: 'INR',
      artisanName: 'Biren Das',
      workshopName: 'Majuli Eco-Cane Artisans',
      state: 'Assam',
      district: 'Majuli',
      artisanStory: 'Crafting fine bamboo storage units and eco-friendly lifestyle products.',
      contactOption: true,
      verificationHash: '0x4b7c0e2a5d8f1c4e7a0b3d6f9b2e5a8c1e4f7a0b3c6d9e2f5a8b1c4d7e0a3b6',
    },
    activatedAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-25T15:00:00Z',
  },
];

export const DEMO_PASSPORTS = DEMO_PUBLIC_PASSPORTS;

// -----------------------------------------------------------------------------
// Seeding & Reset Engine
// -----------------------------------------------------------------------------
export const demoDataService = {
  isSeeded(): boolean {
    return storage.get<boolean>(`demo_dataset_${DEMO_DATASET_ID}_active`, false);
  },

  async seedPresentationDemoData(): Promise<{ success: boolean; message: string }> {
    // 1. Safety Check: Refuse in production
    const isProduction =
      import.meta.env.PROD &&
      !import.meta.env.DEV &&
      !import.meta.env.VITE_USE_FIREBASE_EMULATORS &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1');

    if (isProduction) {
      throw new Error('DEMO_SAFETY_ERROR: Seeding demonstration dataset is strictly disabled in production environments.');
    }

    logger.info('SYSTEM', 'Starting SIH presentation demo dataset seeding...', { datasetId: DEMO_DATASET_ID });

    try {
      // 2. Seed Artisan & Coordinator Profiles in Local Storage
      for (const artisan of DEMO_ARTISANS) {
        storage.set(`mock_profile_${artisan.id}`, {
          ownerId: artisan.id,
          artisanName: artisan.name,
          craftType: artisan.craftType,
          state: artisan.location,
          district: artisan.location.split(',')[0],
          bio: artisan.bio,
          languages: ['en', 'hi'],
          profileImagePath: artisan.avatarUrl,
          phone: artisan.phone,
          workshopName: artisan.workshopName,
          joinedYear: artisan.joinedYear,
          createdAt: '2026-06-01T10:00:00Z',
          updatedAt: '2026-08-20T10:00:00Z',
        });
      }

      for (const coord of DEMO_COORDINATORS) {
        storage.set(`mock_profile_${coord.id}`, {
          ownerId: coord.id,
          artisanName: coord.name,
          craftType: coord.craftType,
          state: coord.location,
          district: coord.location.split(',')[0],
          bio: coord.bio,
          languages: ['en', 'hi'],
          profileImagePath: coord.avatarUrl,
          phone: coord.phone,
          workshopName: coord.workshopName,
          joinedYear: coord.joinedYear,
          createdAt: '2026-06-01T10:00:00Z',
          updatedAt: '2026-08-20T10:00:00Z',
        });
      }

      // 3. Seed Products in Firestore & Local Storage
      const productsByOwner: Record<string, ProductRecord[]> = {};
      for (const p of DEMO_PRODUCTS) {
        if (!productsByOwner[p.ownerId]) {
          productsByOwner[p.ownerId] = [];
        }
        productsByOwner[p.ownerId].push(p);

        // Firestore setDoc (if emulator connected)
        try {
          if (db) {
            await setDoc(doc(db, 'products', p.id), {
              ...p,
              demo_dataset: DEMO_DATASET_ID,
            });
          }
        } catch {
          // Fallback to local storage
        }
      }

      for (const [ownerId, list] of Object.entries(productsByOwner)) {
        storage.set(`mock_products_${ownerId}`, list);
      }

      // 4. Seed Coordinator Assignments in Firestore & Local Storage
      for (const a of DEMO_COORDINATOR_ASSIGNMENTS) {
        try {
          if (db) {
            await setDoc(doc(db, 'coordinatorAssignments', a.id), {
              ...a,
              demo_dataset: DEMO_DATASET_ID,
            });
          }
        } catch {
          // ignore
        }
      }

      // 5. Seed Passports in Firestore & Local Storage
      for (const pass of DEMO_PUBLIC_PASSPORTS) {
        storage.set(`mock_passport_slug_${pass.slug}`, pass);
        storage.set(`mock_passport_prod_${pass.productId}`, pass);

        try {
          if (db) {
            await setDoc(doc(db, 'publicCraftPassports', pass.slug), {
              ...pass,
              demo_dataset: DEMO_DATASET_ID,
            });
            await setDoc(doc(db, 'users', pass.ownerId, 'craftPassports', pass.passportId), {
              id: pass.passportId,
              ownerId: pass.ownerId,
              productId: pass.productId,
              publicSlug: pass.slug,
              status: pass.status,
              createdAt: pass.activatedAt,
              updatedAt: pass.updatedAt,
              activatedAt: pass.activatedAt,
              artisanName: pass.publicData.artisanName,
              productTitle: pass.publicData.title,
              demo_dataset: DEMO_DATASET_ID,
            });
          }
        } catch {
          // ignore
        }
      }

      // 6. Seed Enquiries in Firestore & Local Storage
      const enquiriesByArtisan: Record<string, BuyerEnquiry[]> = {};
      for (const enq of DEMO_ENQUIRIES) {
        if (!enquiriesByArtisan[enq.artisanId]) {
          enquiriesByArtisan[enq.artisanId] = [];
        }
        enquiriesByArtisan[enq.artisanId].push(enq);
        storage.set(`mock_enquiry_${enq.id}`, enq);

        try {
          if (db) {
            await setDoc(doc(db, 'buyerEnquiries', enq.id), {
              ...enq,
              demo_dataset: DEMO_DATASET_ID,
            });
          }
        } catch {
          // ignore
        }
      }

      for (const [artisanId, list] of Object.entries(enquiriesByArtisan)) {
        storage.set(`mock_artisan_enquiries_${artisanId}`, list);
      }

      // 7. Seed Recorded Sales in Local Storage
      const salesByArtisan: Record<string, RecordedSale[]> = {};
      for (const sale of DEMO_SALES) {
        if (!salesByArtisan[sale.ownerId]) {
          salesByArtisan[sale.ownerId] = [];
        }
        salesByArtisan[sale.ownerId].push(sale);
      }

      for (const [ownerId, list] of Object.entries(salesByArtisan)) {
        storage.set(`artisan_recorded_sales_${ownerId}`, list);
      }

      // 8. Mark demo dataset active
      storage.set(`demo_dataset_${DEMO_DATASET_ID}_active`, true);

      logger.info('SYSTEM', 'SIH presentation demo dataset seeded successfully!', {
        artisans: DEMO_ARTISANS.length,
        coordinators: DEMO_COORDINATORS.length,
        products: DEMO_PRODUCTS.length,
        enquiries: DEMO_ENQUIRIES.length,
        sales: DEMO_SALES.length,
        passports: DEMO_PUBLIC_PASSPORTS.length,
      });

      return {
        success: true,
        message: 'SIH presentation demo data successfully populated.',
      };
    } catch (err) {
      logger.error('SYSTEM', 'Failed to seed demo dataset', err);
      throw err;
    }
  },

  async resetPresentationDemoData(): Promise<{ success: boolean; message: string }> {
    logger.info('SYSTEM', 'Resetting SIH presentation demo dataset...');

    // Clear local storage entries created for demo dataset
    for (const artisan of DEMO_ARTISANS) {
      storage.remove(`mock_profile_${artisan.id}`);
      storage.remove(`mock_products_${artisan.id}`);
      storage.remove(`mock_artisan_enquiries_${artisan.id}`);
      storage.remove(`artisan_recorded_sales_${artisan.id}`);
    }

    for (const coord of DEMO_COORDINATORS) {
      storage.remove(`mock_profile_${coord.id}`);
    }

    for (const p of DEMO_PRODUCTS) {
      storage.remove(`mock_passport_slug_${p.passportSlug}`);
      storage.remove(`mock_passport_prod_${p.id}`);
    }

    for (const enq of DEMO_ENQUIRIES) {
      storage.remove(`mock_enquiry_${enq.id}`);
    }

    // Delete from Firestore
    try {
      if (db) {
        for (const p of DEMO_PRODUCTS) {
          await deleteDoc(doc(db, 'products', p.id)).catch(() => {});
        }
        for (const a of DEMO_COORDINATOR_ASSIGNMENTS) {
          await deleteDoc(doc(db, 'coordinatorAssignments', a.id)).catch(() => {});
        }
        for (const pass of DEMO_PUBLIC_PASSPORTS) {
          await deleteDoc(doc(db, 'publicCraftPassports', pass.slug)).catch(() => {});
          await deleteDoc(doc(db, 'users', pass.ownerId, 'craftPassports', pass.passportId)).catch(() => {});
        }
        for (const enq of DEMO_ENQUIRIES) {
          await deleteDoc(doc(db, 'buyerEnquiries', enq.id)).catch(() => {});
        }
      }
    } catch {
      // ignore
    }

    storage.set(`demo_dataset_${DEMO_DATASET_ID}_active`, false);
    return { success: true, message: 'Demo dataset reset successfully.' };
  },
};
