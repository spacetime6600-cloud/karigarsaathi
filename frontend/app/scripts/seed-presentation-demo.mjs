import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const PROJECT_ID = 'demo-karigarsaathi';
const DEMO_DATASET_ID = 'sih_presentation_2026';

// 1. Safety Check: Refuse production
if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_EMULATOR_HUB) {
  console.error('ERROR: Refusing to run demo seed script in production!');
  process.exit(1);
}

const firebaseConfig = {
  apiKey: 'AIzaSyDemoFakeApiKeyForLocalEmulator123',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890abcdef',
};

const app = initializeApp(firebaseConfig, 'demo-seed-app');
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8085);
connectStorageEmulator(storage, '127.0.0.1', 9199);

function toFirestoreValue(val) {
  if (val === null || val === undefined) return { nullValue: null };
  if (typeof val === 'boolean') return { booleanValue: val };
  if (typeof val === 'number') {
    if (Number.isInteger(val)) return { integerValue: String(val) };
    return { doubleValue: val };
  }
  if (typeof val === 'string') return { stringValue: val };
  if (Array.isArray(val)) return { arrayValue: { values: val.map(toFirestoreValue) } };
  if (typeof val === 'object') {
    const fields = {};
    for (const [k, v] of Object.entries(val)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(val) };
}

async function seedAdminDoc(collectionPath, docId, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) {
    fields[k] = toFirestoreValue(v);
  }
  await fetch(`http://127.0.0.1:8085/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}/${docId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer owner',
    },
    body: JSON.stringify({ fields }),
  });
}

// -----------------------------------------------------------------------------
// Data Fixtures Definition
// -----------------------------------------------------------------------------
const DEMO_ARTISANS = [
  {
    uid: 'demo_artisan_ravi',
    email: 'ravi.kumar@demo-karigarsaathi.local',
    name: 'Ravi Kumar',
    phone: '9876543210',
    craftType: 'Handloom Muga & Mulberry Silk Weaving',
    location: 'Sualkuchi, Kamrup Rural, Assam',
    workshopName: 'Ravi Handlooms & Heritage Weaves',
    bio: 'Master weaver with 24 years of experience preserving indigenous golden Muga silk, natural terracotta dyeing, and traditional Assamese Jamdani motifs.',
    joinedYear: 2021,
  },
  {
    uid: 'demo_artisan_sunita',
    email: 'sunita.devi@demo-karigarsaathi.local',
    name: 'Sunita Devi',
    phone: '9876543211',
    craftType: 'Mithila & Madhubani Folk Painting',
    location: 'Ranti Village, Madhubani, Bihar',
    workshopName: 'Mithila Kala Heritage Centre',
    bio: 'State-awarded master artist specializing in natural twig-and-nib painting on handmade paper and Ahimsa tussar silk fabrics.',
    joinedYear: 2022,
  },
  {
    uid: 'demo_artisan_rameshwar',
    email: 'rameshwar.sahu@demo-karigarsaathi.local',
    name: 'Rameshwar Sahu',
    phone: '9876543212',
    craftType: 'Dhokra Lost-Wax Bell Metal Casting',
    location: 'Kondagaon, Bastar, Chhattisgarh',
    workshopName: 'Bastar Bell Metal Craft Guild',
    bio: 'Traditional 4th-generation metalsmith creating hollow-cast brass tribal figurines, lamps, and musical motifs using alluvial clay and beeswax moulds.',
    joinedYear: 2021,
  },
  {
    uid: 'demo_artisan_farooq',
    email: 'farooq.ahmed@demo-karigarsaathi.local',
    name: 'Farooq Ahmed',
    phone: '9876543213',
    craftType: 'Carved Walnut Woodcraft & Lacquerware',
    location: 'Zadibal, Srinagar, Jammu & Kashmir',
    workshopName: 'Chinar Woodcrafts & Artifacts',
    bio: 'Artisan carver creating intricate lattice jaali work and floral reliefs using sustainably harvested native Kashmiri walnut wood.',
    joinedYear: 2020,
  },
  {
    uid: 'demo_artisan_ananya',
    email: 'ananya.mohapatra@demo-karigarsaathi.local',
    name: 'Ananya Mohapatra',
    phone: '9876543214',
    craftType: 'Pattachitra Scroll Painting & Palm Leaf Etching',
    location: 'Raghurajpur Heritage Crafts Village, Puri, Odisha',
    workshopName: 'Utkala Pattachitra Mandir',
    bio: 'Preserving ancient Oriya scroll narratives using natural mineral pigments, conch-shell whites, and iron-stylus palm leaf etchings.',
    joinedYear: 2022,
  },
  {
    uid: 'demo_artisan_biren',
    email: 'biren.das@demo-karigarsaathi.local',
    name: 'Biren Das',
    phone: '9876543215',
    craftType: 'Split Bamboo & Cane Structural Weaving',
    location: 'Garamur, Majuli Island, Assam',
    workshopName: 'Majuli Eco-Cane Artisans',
    bio: 'Crafting fine bamboo storage units, lanterns, and modern eco-friendly lifestyle products using indigenous riverine cane.',
    joinedYear: 2023,
  },
];

const DEMO_COORDINATORS = [
  {
    uid: 'demo_coord_priya',
    email: 'priya.sharma@demo-karigarsaathi.local',
    name: 'Priya Sharma',
    phone: '9123456780',
    craftType: 'Eastern & North-East Cluster Linkage Coordinator',
    location: 'Guwahati Cluster Hub, Assam',
    workshopName: 'Eastern Handloom & Handicraft Development Board',
    bio: 'Regional coordinator facilitating digital craft passports, living-wage pricing audits, and institutional exports for Assam, Bihar, and Odisha clusters.',
    joinedYear: 2020,
    assignedArtisans: ['demo_artisan_ravi', 'demo_artisan_sunita', 'demo_artisan_biren'],
  },
  {
    uid: 'demo_coord_vikram',
    email: 'vikram.rathore@demo-karigarsaathi.local',
    name: 'Vikramaditya Rathore',
    phone: '9123456781',
    craftType: 'Central & Western Heritage Crafts Coordinator',
    location: 'Raipur & Jaipur Regional Field Office',
    workshopName: 'Tribal Craft Development Federation',
    bio: 'Facilitating fair trade compliance, buyer enquiry verification, and logistics for Bastar metalcraft and Northern artisan clusters.',
    joinedYear: 2019,
    assignedArtisans: ['demo_artisan_rameshwar', 'demo_artisan_farooq', 'demo_artisan_ananya'],
  },
];

const DEMO_PRODUCTS = [
  {
    id: 'prod_muga_silk_saree_01',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Assam Muga Silk Saree with Traditional Gos Buta',
    description: 'Rare wild golden Muga silk saree meticulously hand-loomed in Sualkuchi with authentic flora-inspired Gos Buta motifs and natural terracotta dyed pallu border.',
    category: 'Handloom Textiles',
    craftType: 'Muga Silk Handloom Weaving',
    state: 'Assam',
    district: 'Kamrup Rural',
    material: '100% Pure Muga Silk & Natural Zari',
    materials: ['Wild Golden Muga Silk Yarn', 'Natural Plant-Extracted Mordants', 'Pure Silver-Coated Zari Thread'],
    technique: 'Traditional Pit Loom Extra-Weft Brocade',
    dimensions: '6.4m x 1.15m (with matching unstitched blouse piece)',
    weight: '720g',
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
  {
    id: 'prod_eri_silk_stole_02',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Natural Indigo-Dyed Eri Silk Stole (Ahimsa Peace Silk)',
    description: 'Cruelty-free handspun Eri silk scarf with soft thermal texture, hand-dyed with organic indigo leaves and finished with delicate hand-knotted fringe.',
    category: 'Handloom Textiles',
    craftType: 'Eri Peace Silk Weaving',
    state: 'Assam',
    district: 'Kamrup Rural',
    material: 'Handspun Ahimsa Eri Silk',
    materials: ['Organic Cultivated Eri Silk', 'Fermented Indigo Leaf Dye'],
    technique: 'Four-Shaft Frame Loom Weave',
    dimensions: '2.0m x 0.65m',
    weight: '240g',
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
  {
    id: 'prod_jamdani_dupatta_03',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Handloomed Terracotta & Indigo Jamdani Dupatta',
    description: 'Fine translucent mulberry silk dupatta with discontinuous weft geometric motifs inspired by Brahmaputra river ripples.',
    category: 'Handloom Textiles',
    craftType: 'Silk Jamdani Weaving',
    state: 'Assam',
    district: 'Kamrup Rural',
    material: 'Fine Mulberry Silk & Organic Cotton Warp',
    materials: ['Mulberry Silk 60D', 'Combed Cotton Yarn 100s', 'Mineral Dye'],
    technique: 'Discontinuous Weft Supplementary Looming',
    dimensions: '2.5m x 0.9m',
    weight: '180g',
    price: 6800,
    currency: 'INR',
    stockQuantity: 3,
    status: 'ready',
    photoPaths: ['/src/assets/marketplace/craft-category-textiles.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-textiles.jpg',
    createdAt: '2026-08-10T08:00:00Z',
    updatedAt: '2026-08-25T16:00:00Z',
  },
  {
    id: 'prod_assamese_gamosa_04',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Traditional Assamese Phulam Gamosa with Red Floral Border',
    description: 'Authentic cotton Gamosa handwoven with vibrant scarlet floral cross-border patterns signifying cultural honour and welcome.',
    category: 'Handloom Textiles',
    craftType: 'Phulam Gamosa Weaving',
    state: 'Assam',
    district: 'Kamrup Rural',
    material: '100% Pure Organic Cotton',
    materials: ['High-count Natural Cotton Yarn', 'Fast-dyed Crimson Cotton Thread'],
    technique: 'Handloom Plain Weave with Tapestry Weft Insertion',
    dimensions: '1.6m x 0.7m',
    weight: '150g',
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
  {
    id: 'prod_bihu_tapestry_draft_05',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Mulberry Silk Wall Hanging Tapestry - Bihu Folk Motif',
    description: 'Decorative handwoven wall hanging celebrating springtime harvest festivities with traditional dhol drum and horn dancers motif.',
    category: 'Handloom Textiles',
    craftType: 'Tapestry Brocade Weaving',
    state: 'Assam',
    district: 'Kamrup Rural',
    material: 'Raw Silk & Bamboo Hanging Rod',
    materials: ['Heavy Denier Raw Mulberry Silk', 'Natural Turmeric & Madder Root Dyes'],
    technique: 'Tapestry Weave',
    dimensions: '1.2m x 0.8m',
    weight: '450g',
    price: 5200,
    currency: 'INR',
    stockQuantity: 2,
    status: 'draft',
    photoPaths: ['/src/assets/marketplace/craft-story-loom.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-story-loom.jpg',
    createdAt: '2026-08-26T14:00:00Z',
    updatedAt: '2026-08-28T18:30:00Z',
  },
  {
    id: 'prod_raw_silk_shawl_06',
    ownerId: 'demo_artisan_ravi',
    artisanId: 'demo_artisan_ravi',
    title: 'Pure Raw Silk Warp Shawl with Tribal Geometric Border',
    description: 'Heavyweight winter wrap woven with textured hand-reeled raw silk yarns, featuring geometric chevron edge motifs in natural mineral black.',
    category: 'Handloom Textiles',
    craftType: 'Textured Raw Silk Weaving',
    state: 'Assam',
    district: 'Kamrup Rural',
    material: 'Coarse Raw Reeled Silk',
    materials: ['Unbleached Raw Silk', 'Plant Gall-Nut Black Dye'],
    technique: 'Fly-Shuttle Loom Twill Weave',
    dimensions: '2.2m x 1.0m',
    weight: '520g',
    price: 8900,
    currency: 'INR',
    stockQuantity: 5,
    status: 'ready',
    photoPaths: ['/src/assets/marketplace/craft-category-textiles.jpg'],
    thumbnailPath: '/src/assets/marketplace/craft-category-textiles.jpg',
    createdAt: '2026-08-15T10:00:00Z',
    updatedAt: '2026-08-27T11:00:00Z',
  },
  {
    id: 'prod_madhubani_canvas_07',
    ownerId: 'demo_artisan_sunita',
    artisanId: 'demo_artisan_sunita',
    title: 'Madhubani Tree of Life Folk Art Canvas Painting',
    description: 'Intricate Kachni and Bharni style painting depicting the celestial Kalpavriksha tree with pairs of peacocks and fish symbols of fertility and harmony.',
    category: 'Folk & Traditional Art',
    craftType: 'Mithila / Madhubani Painting',
    state: 'Bihar',
    district: 'Madhubani',
    material: 'Natural Mineral & Vegetable Pigments on Handmade Cloth Paper',
    materials: ['Handmade Bamboo Paper', 'Lampblack', 'Indigo', 'Kusum Flower Red', 'Turmeric Yellow'],
    technique: 'Bamboo Twig and Cotton Nib Freehand Drawing',
    dimensions: '75cm x 50cm (Unframed)',
    weight: '300g',
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
  {
    id: 'prod_dhokra_figure_08',
    ownerId: 'demo_artisan_rameshwar',
    artisanId: 'demo_artisan_rameshwar',
    title: 'Dhokra Brass Tribal Dancing Figure (Lost-Wax Casting)',
    description: '4,000-year-old traditional hollow bell metal sculpture portraying a Bastar tribal dancer with ceremonial dhol drum and brass horn.',
    category: 'Metalwork & Sculptures',
    craftType: 'Dhokra Lost-Wax Casting',
    state: 'Chhattisgarh',
    district: 'Bastar',
    material: 'Scrap Brass & Bell Metal Alloy',
    materials: ['Recycled Brass Ingots', 'Natural Beeswax Filaments', 'Alluvial Anthill Clay'],
    technique: 'Cire-Perdue (Lost Wax Technique)',
    dimensions: '28cm x 14cm x 10cm',
    weight: '1450g',
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
  {
    id: 'prod_walnut_box_09',
    ownerId: 'demo_artisan_farooq',
    artisanId: 'demo_artisan_farooq',
    title: 'Hand-Carved Kashmiri Walnut Wood Trinket Jewellery Box',
    description: 'Seasoned Himalayan walnut wood box carved with relief dragon and chinar leaf arabesques, velvet lined with hidden locking key.',
    category: 'Woodcraft & Carvings',
    craftType: 'Kashmiri Walnut Wood Carving',
    state: 'Jammu and Kashmir',
    district: 'Srinagar',
    material: 'Mature Juglans Regia (Kashmir Walnut Wood)',
    materials: ['Sun-dried Walnut Wood', 'Natural Wax Polish', 'Brass Hinges'],
    technique: 'Deep Undercut Relief Chiseling',
    dimensions: '20cm x 12cm x 8cm',
    weight: '680g',
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
  {
    id: 'prod_pattachitra_scroll_10',
    ownerId: 'demo_artisan_ananya',
    artisanId: 'demo_artisan_ananya',
    title: 'Traditional Raghurajpur Pattachitra Cloth Scroll Painting',
    description: 'Exquisite cloth-based scroll depicting Krishna Leela stories painted on treated cotton canvas with conch shell white and stone pigments.',
    category: 'Folk & Traditional Art',
    craftType: 'Odia Pattachitra Art',
    state: 'Odisha',
    district: 'Puri',
    material: 'Treated Cotton Cloth Canvas & Natural Mineral Pigments',
    materials: ['Tamarind Seed Gum Treated Canvas', 'Natural Stone Ochre', 'Hingula Vermilion', 'Lampblack'],
    technique: 'Traditional Fine-line Stylus Painting & Varnish Sealing',
    dimensions: '90cm x 40cm',
    weight: '350g',
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
  {
    id: 'prod_bamboo_basket_11',
    ownerId: 'demo_artisan_biren',
    artisanId: 'demo_artisan_biren',
    title: 'Handcrafted Assam Split-Bamboo Eco Storage Basket Set (Set of 3)',
    description: 'Sustainable hand-braided bamboo organizers featuring fine hexagonal weaving pattern and steam-bent reinforced cane rim.',
    category: 'Cane & Bamboo Crafts',
    craftType: 'Assam Bamboo Weaving',
    state: 'Assam',
    district: 'Majuli',
    material: 'Native Riverbank Bhaluka Bamboo & Jati Cane',
    materials: ['Seasoned Split Bamboo Strips', 'Smoked Jati Cane Straps', 'Natural Plant Varnish'],
    technique: 'Fine Hexagonal Interlocking Basketry',
    dimensions: 'Large: 30x30cm, Med: 24x24cm, Small: 18x18cm',
    weight: '850g (Total set)',
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
  {
    id: 'prod_mithila_dupatta_12',
    ownerId: 'demo_artisan_sunita',
    artisanId: 'demo_artisan_sunita',
    title: 'Handpainted Mithila Peacock Motif Tussar Silk Dupatta',
    description: 'Golden beige wild tussar silk wrap decorated with hand-painted peacock pairs and floral borders along the length and tassels.',
    category: 'Handloom Textiles',
    craftType: 'Tussar Handpainting',
    state: 'Bihar',
    district: 'Madhubani',
    material: '100% Bhagalpur Tussar Silk & Fast Dyes',
    materials: ['Unbleached Tussar Silk Fabric', 'Non-toxic Permanent Fabric Inks'],
    technique: 'Freehand Fine Nib Textile Painting',
    dimensions: '2.4m x 0.85m',
    weight: '210g',
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

async function main() {
  const isReset = process.argv.includes('--reset');

  if (isReset) {
    console.log(`[SEED] Resetting demo dataset "${DEMO_DATASET_ID}"...`);
    for (const p of DEMO_PRODUCTS) {
      await deleteDoc(doc(db, 'products', p.id)).catch(() => {});
    }
    console.log('[SEED] Demo dataset cleaned up successfully.');
    await deleteApp(app);
    return;
  }

  console.log(`\n============================================================`);
  console.log(`  KARIGARSAATHI: SIH PRESENTATION DEMO DATA SEEDER`);
  console.log(`============================================================\n`);

  // 1. Seed Artisans
  for (const artisan of DEMO_ARTISANS) {
    console.log(`[SEED] Seeding artisan: ${artisan.name} (${artisan.uid})`);
    await seedAdminDoc('users', artisan.uid, {
      uid: artisan.uid,
      role: 'artisan',
      displayName: artisan.name,
      email: artisan.email,
      phone: artisan.phone,
      preferredLanguage: 'en',
      createdAt: '2026-06-01T10:00:00Z',
      demo_dataset: DEMO_DATASET_ID,
    });

    await seedAdminDoc('artisanProfiles', artisan.uid, {
      ownerId: artisan.uid,
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
      demo_dataset: DEMO_DATASET_ID,
    });
  }

  // 2. Seed Coordinators
  for (const coord of DEMO_COORDINATORS) {
    console.log(`[SEED] Seeding coordinator: ${coord.name} (${coord.uid})`);
    await seedAdminDoc('users', coord.uid, {
      uid: coord.uid,
      role: 'coordinator',
      displayName: coord.name,
      email: coord.email,
      phone: coord.phone,
      preferredLanguage: 'en',
      createdAt: '2026-06-01T10:00:00Z',
      demo_dataset: DEMO_DATASET_ID,
    });

    // Seed assignments
    for (const artisanUid of coord.assignedArtisans) {
      const assignmentId = `coord_${coord.uid}_${artisanUid}`;
      await seedAdminDoc('coordinatorAssignments', assignmentId, {
        id: assignmentId,
        coordinatorUid: coord.uid,
        artisanUid: artisanUid,
        clusterName: coord.workshopName,
        active: true,
        approvedAt: '2026-06-01T10:00:00Z',
        approvedBy: 'admin_root',
        permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
        createdAt: '2026-06-01T10:00:00Z',
        updatedAt: '2026-06-01T10:00:00Z',
        demo_dataset: DEMO_DATASET_ID,
      });
    }
  }

  // 3. Seed Products
  for (const prod of DEMO_PRODUCTS) {
    console.log(`[SEED] Seeding product: ${prod.title} (${prod.id})`);
    await seedAdminDoc('products', prod.id, {
      ...prod,
      demo_dataset: DEMO_DATASET_ID,
    });
  }

  // 4. Seed Public Passports
  const DEMO_PUBLIC_PASSPORTS = [
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
      demo_dataset: DEMO_DATASET_ID,
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
      demo_dataset: DEMO_DATASET_ID,
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
      demo_dataset: DEMO_DATASET_ID,
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
      demo_dataset: DEMO_DATASET_ID,
    },
  ];

  for (const pass of DEMO_PUBLIC_PASSPORTS) {
    console.log(`[SEED] Seeding passport: ${pass.slug}`);
    await seedAdminDoc('publicCraftPassports', pass.slug, pass);
    await seedAdminDoc(`users/${pass.ownerId}/craftPassports`, pass.passportId, {
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

  // 5. Seed Enquiries
  const DEMO_ENQUIRIES = [
    {
      id: 'enq_demo_01',
      productId: 'prod_muga_silk_saree_01',
      artisanId: 'demo_artisan_ravi',
      buyerName: 'Aarav Mehta',
      buyerOrganization: 'Heritage Living Boutique, Mumbai',
      buyerPhone: '+91 98200 XXXXX',
      buyerEmail: 'sourcing.aarav@demo-craft-buyer.local',
      message: 'Namaste Ravi ji, we are interested in curating 15 pieces of the Assam Muga Silk Saree for our Diwali festive showcase. Could you share the production lead time?',
      status: 'new',
      createdAt: '2026-08-27T10:15:00Z',
      updatedAt: '2026-08-27T10:15:00Z',
      replies: [],
      demo_dataset: DEMO_DATASET_ID,
    },
    {
      id: 'enq_demo_02',
      productId: 'prod_eri_silk_stole_02',
      artisanId: 'demo_artisan_ravi',
      buyerName: 'Meera Nambiar',
      buyerOrganization: 'Sustainable Fashion Collective, Bengaluru',
      buyerPhone: '+91 94480 XXXXX',
      buyerEmail: 'meera.design@demo-craft-buyer.local',
      message: 'Hello, can the Eri Silk Stole be customized in a deep forest-green natural dye from local leaves instead of indigo?',
      status: 'replied',
      createdAt: '2026-08-25T14:30:00Z',
      updatedAt: '2026-08-26T09:00:00Z',
      replies: [
        {
          id: 'rep_01',
          senderId: 'demo_artisan_ravi',
          senderRole: 'artisan',
          message: 'Namaste Meera ji! Yes, we extract a rich olive and forest green using local Nahor tree bark and tea-leaf bath. It takes approximately 4 additional days.',
          createdAt: '2026-08-26T09:00:00Z',
        },
      ],
      demo_dataset: DEMO_DATASET_ID,
    },
    {
      id: 'enq_demo_03',
      productId: 'prod_assamese_gamosa_04',
      artisanId: 'demo_artisan_ravi',
      buyerName: 'Rohit Deshmukh',
      buyerOrganization: 'Cultural Events Society, Pune',
      buyerPhone: '+91 97650 XXXXX',
      buyerEmail: 'rohit.d@demo-craft-buyer.local',
      message: 'Looking to order 20 Assamese Gamosas for our upcoming inter-state cultural symposium. What is the batch rate?',
      status: 'in_progress',
      createdAt: '2026-08-23T11:20:00Z',
      updatedAt: '2026-08-24T16:00:00Z',
      replies: [
        {
          id: 'rep_02',
          senderId: 'demo_artisan_ravi',
          senderRole: 'artisan',
          message: 'Namaste Rohit ji, batch volume orders above 10 units are certified under fair trade living wages at ₹1,100 per unit with official Craft Passport tags.',
          createdAt: '2026-08-24T16:00:00Z',
        },
      ],
      demo_dataset: DEMO_DATASET_ID,
    },
  ];

  for (const enq of DEMO_ENQUIRIES) {
    console.log(`[SEED] Seeding enquiry: ${enq.buyerName} -> ${enq.productId}`);
    await seedAdminDoc('buyerEnquiries', enq.id, enq);
  }

  console.log(`\n[SUCCESS] Successfully populated 6 Artisans, 2 Coordinators, 12 Products, 4 Passports, and 3 Enquiries into Firebase Emulators!`);
  await deleteApp(app);
}

main().catch((err) => {
  console.error('[SEED ERROR]', err);
  process.exit(1);
});
