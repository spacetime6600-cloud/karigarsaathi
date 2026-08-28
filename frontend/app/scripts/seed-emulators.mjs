import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDoc, setDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, ref, uploadBytes } from 'firebase/storage';

const PROJECT_ID = 'demo-karigarsaathi';

if (process.env.NODE_ENV === 'production' && !process.env.FIREBASE_EMULATOR_HUB) {
  console.error('ERROR: Refusing to run emulator seed script in production!');
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

const app = initializeApp(firebaseConfig, 'seed-app');
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

async function seedUser(email, password, displayName, craftType, state, district, bio, role = 'artisan') {
  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`[SEED] Created auth user: ${email} (UID: ${uid})`);
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`[SEED] Re-using existing auth user: ${email} (UID: ${uid})`);
    } else {
      throw err;
    }
  }

  const now = new Date().toISOString();

  // 1. Seed private user record (preserving createdAt on re-seed for immutability compliance)
  const userDocRef = doc(db, 'users', uid);
  let userCreatedAt = now;
  try {
    const existingUser = await getDoc(userDocRef);
    if (existingUser.exists()) {
      userCreatedAt = existingUser.data().createdAt;
    }
  } catch {
    userCreatedAt = now;
  }

  await setDoc(userDocRef, {
    uid,
    role: 'artisan',
    displayName,
    email,
    preferredLanguage: 'en',
    createdAt: userCreatedAt,
    updatedAt: now,
  });

  // 2. Seed private artisan profile if artisan (preserving createdAt on re-seed)
  if (role === 'artisan') {
    const profileDocRef = doc(db, 'artisanProfiles', uid);
    let profileCreatedAt = now;
    try {
      const existingProfile = await getDoc(profileDocRef);
      if (existingProfile.exists()) {
        profileCreatedAt = existingProfile.data().createdAt;
      }
    } catch {
      profileCreatedAt = now;
    }

    await setDoc(profileDocRef, {
      ownerId: uid,
      artisanName: displayName,
      craftType,
      state,
      district,
      bio,
      languages: ['en', 'hi'],
      workshopName: `${displayName}'s Studio`,
      joinedYear: 2022,
      createdAt: profileCreatedAt,
      updatedAt: now,
    });
  }

  return uid;
}

async function seedProductDraft(ownerId, productId, title, category, craftType, state, price, status = 'draft') {
  const now = new Date().toISOString();
  const photoPath = `users/${ownerId}/products/${productId}/originals/sample_cover.jpg`;

  const productDocRef = doc(db, 'products', productId);
  let productCreatedAt = now;
  try {
    const existingProduct = await getDoc(productDocRef);
    if (existingProduct.exists()) {
      console.log(`[SEED] Existing product data for ${productId}:`, existingProduct.data());
      productCreatedAt = existingProduct.data().createdAt;
    } else {
      console.log(`[SEED] Product ${productId} does not exist yet.`);
    }
  } catch (err) {
    console.log(`[SEED] getDoc product note: ${err.message}`);
    productCreatedAt = now;
  }

  await setDoc(productDocRef, {
    id: productId,
    ownerId,
    title,
    description: `Authentic ${craftType} handcrafted with heritage methods in ${state}.`,
    category,
    craftType,
    state,
    price,
    currency: 'INR',
    stockQuantity: 3,
    status,
    photoPaths: [photoPath],
    coverPhotoIndex: 0,
    technique: craftType,
    materials: ['Pure Natural Silk', 'Organic Dyes'],
    dimensions: '5.5m x 1m',
    origin: state,
    story: `Handcrafted by regional master artisans celebrating deep Indian heritage.`,
    createdAt: productCreatedAt,
    updatedAt: now,
  });

  // Upload small valid JPEG sample to storage emulator
  const sampleJpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const storageRef = ref(storage, photoPath);
  await uploadBytes(storageRef, sampleJpeg, {
    contentType: 'image/jpeg',
    customMetadata: {
      ownerId,
      productId,
    },
  });

  console.log(`[SEED] Seeded product: ${productId} (${status}) for ${ownerId}`);
}

async function main() {
  console.log('--- Starting Firebase Local Emulator Seed (Phase 11) ---');
  console.log(`Target Project: ${PROJECT_ID}`);
  const now = new Date().toISOString();

  // 1. Seed Artisan A
  const artisanAUid = await seedUser(
    'artisan_a@karigarsaathi.local',
    'KarigarPass123!',
    'Ravi Kumar',
    'Handloom Silk Jamdani Weaving',
    'Assam',
    'Kamrup Cluster',
    'Master weaver with 24 years preserving mulberry silk traditions.',
    'artisan'
  );

  const productAId = 'prod_seed_jamdani_01';
  await seedProductDraft(
    artisanAUid,
    productAId,
    'Indigo & Terracotta Silk Jamdani Saree',
    'Handloom Textiles',
    'Jamdani Silk Weave',
    'Assam',
    14500,
    'ready'
  );

  // Seed Public Active Passport for Artisan A (while signed in as Artisan A)
  const activeSlug = 'indigo-terracotta-silk-jamdani-s-f18665bedbaf';
  await setDoc(doc(db, 'publicCraftPassports', activeSlug), {
    slug: activeSlug,
    passportId: 'KP_ASSAM_001',
    productId: productAId,
    ownerId: artisanAUid,
    status: 'active',
    publicData: {
      title: 'Indigo & Terracotta Silk Jamdani Saree',
      photos: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800'],
      category: 'Handloom Textiles',
      technique: 'Jamdani Silk Weave',
      materials: ['Pure Mulberry Silk', 'Organic Dyes'],
      dimensions: '5.5m x 1m',
      price: 14500,
      currency: 'INR',
      artisanName: 'Ravi Kumar',
      artisanStory: 'Preserving 500-year-old Assamese mulberry silk weaving traditions.',
      state: 'Assam',
      contactOption: true,
    },
    activatedAt: now,
    updatedAt: now,
    snapshotVersion: 1,
  });

  // Seed Public Revoked Passport (while signed in as Artisan A)
  const revokedSlug = 'revoked-sample-craft-passport-001';
  await setDoc(doc(db, 'publicCraftPassports', revokedSlug), {
    slug: revokedSlug,
    passportId: 'KP_REVOKED_001',
    productId: productAId,
    ownerId: artisanAUid,
    status: 'revoked',
    publicData: {
      title: 'Revoked Craft Item',
      photos: [],
    },
    activatedAt: now,
    updatedAt: now,
    revokedAt: now,
    snapshotVersion: 1,
  });

  // Seed Export Audit Failure for Artisan A
  const exportFailId = `exp_failed_${Date.now()}`;
  await setDoc(doc(db, 'users', artisanAUid, 'exportAuditRecords', exportFailId), {
    id: exportFailId,
    ownerId: artisanAUid,
    productId: productAId,
    format: 'pdf',
    action: 'export',
    status: 'failed',
    errorMessage: 'Missing GI verification tag attachment',
    errorCode: 'GI_TAG_REQUIRED',
    createdAt: now,
  });

  // 2. Seed Artisan B
  const artisanBUid = await seedUser(
    'artisan_b@karigarsaathi.local',
    'KarigarPass123!',
    'Sunita Devi',
    'Traditional Terracotta Pottery',
    'West Bengal',
    'Bankura Cluster',
    'Panchmura terracotta craftsperson specializing in traditional votive figurines.',
    'artisan'
  );

  const productBId = 'prod_seed_terracotta_01';
  await seedProductDraft(
    artisanBUid,
    productBId,
    'Bankura Heritage Terracotta Figurine',
    'Pottery & Ceramics',
    'Terracotta Kiln Craft',
    'West Bengal',
    3800,
    'ready'
  );

  // 3. Seed Assigned Coordinator (Coordinator A)
  const coordinatorAUid = await seedUser(
    'coordinator_a@karigarsaathi.local',
    'KarigarPass123!',
    'Animesh Barua',
    'Cluster Facilitator',
    'Assam',
    'Kamrup Cluster',
    'Regional coordinator assisting weaver clusters.',
    'coordinator'
  );

  // Seed Coordinator Assignment (Coordinator A -> Artisan A)
  const assignmentId = `coord_${coordinatorAUid}_${artisanAUid}`;
  await seedAdminDoc('coordinatorAssignments', assignmentId, {
    id: assignmentId,
    coordinatorUid: coordinatorAUid,
    artisanUid: artisanAUid,
    artisanName: 'Ravi Kumar',
    clusterName: 'Kamrup Handloom Cluster',
    active: true,
    approvedAt: now,
    approvedBy: 'admin_super_user',
    permissions: {
      viewStatus: true,
      viewEnquirySummary: true,
      assistExports: true,
    },
    createdAt: now,
    updatedAt: now,
  });

  // 4. Seed Unauthorized Coordinator (Coordinator with No Assignments)
  await seedUser(
    'coordinator_unauthorized@karigarsaathi.local',
    'KarigarPass123!',
    'Guest Coordinator',
    'Unassigned Helper',
    'Delhi',
    'Central Hub',
    'Coordinator without active artisan grants.',
    'coordinator'
  );

  // 5. Seed Buyer User
  await seedUser(
    'buyer_user@karigarsaathi.local',
    'KarigarPass123!',
    'Anita Roy',
    'Art Collector',
    'Maharashtra',
    'Mumbai',
    'Heritage textile enthusiast and boutique owner.',
    'artisan'
  );

  // 6. Seed Initial Buyer Enquiry for Artisan A
  const enquiryId = 'enq_seeded_001';
  await seedAdminDoc('buyerEnquiries', enquiryId, {
    id: enquiryId,
    publicSlug: activeSlug,
    passportId: 'KP_ASSAM_001',
    productId: productAId,
    productTitle: 'Indigo & Terracotta Silk Jamdani Saree',
    productImage: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800',
    artisanId: artisanAUid,
    buyerName: 'Anita Roy',
    buyerContact: '+91 98300 12345',
    buyerOrganisation: 'Heritage Sarees Mumbai',
    destinationCity: 'Mumbai',
    quantityRequested: 2,
    targetPrice: 14000,
    message: 'Namaste Ravi ji! Would like to inquire about 2 sarees with matching silk blouse pieces.',
    initialMessage: 'Namaste Ravi ji! Would like to inquire about 2 sarees with matching silk blouse pieces.',
    preferredContactMethod: 'whatsapp',
    consentToBeContacted: true,
    status: 'new',
    receivedAt: now,
    createdAt: now,
    updatedAt: now,
    replies: [],
    schemaVersion: 1,
  });

  console.log('--- Emulator Seed (Phase 11) Completed Successfully ---');
  await deleteApp(app);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
