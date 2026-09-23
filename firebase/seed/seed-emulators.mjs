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

async function seedUser(email, password, displayName, craftType, state, district, bio) {
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

  // 2. Seed private artisan profile (preserving createdAt on re-seed)
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

  return uid;
}

async function seedProductDraft(ownerId, productId, title, category, craftType, state, price) {
  const now = new Date().toISOString();
  const photoPath = `users/${ownerId}/products/${productId}/originals/sample_cover.jpg`;

  const productDocRef = doc(db, 'products', productId);
  let productCreatedAt = now;
  try {
    const existingProduct = await getDoc(productDocRef);
    if (existingProduct.exists()) {
      productCreatedAt = existingProduct.data().createdAt;
    }
  } catch {
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
    status: 'draft',
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

  console.log(`[SEED] Seeded product draft & sample photo: ${productId} for ${ownerId}`);
}

async function main() {
  console.log('--- Starting Firebase Local Emulator Seed ---');
  console.log(`Target Project: ${PROJECT_ID}`);

  // Seed Artisan A
  const artisanAUid = await seedUser(
    'artisan_a@karigarsaathi.local',
    'KarigarPass123!',
    'Ravi Kumar',
    'Handloom Silk Jamdani Weaving',
    'Assam',
    'Kamrup Cluster',
    'Master weaver with 24 years preserving mulberry silk traditions.'
  );

  await seedProductDraft(
    artisanAUid,
    'draft_jamdani_saree_01',
    'Indigo & Terracotta Silk Jamdani Saree',
    'Handloom Textiles',
    'Jamdani Silk Weave',
    'Assam',
    14500
  );

  // Seed Artisan B
  const artisanBUid = await seedUser(
    'artisan_b@karigarsaathi.local',
    'KarigarPass123!',
    'Sunita Devi',
    'Traditional Terracotta Pottery',
    'West Bengal',
    'Bankura Cluster',
    'Panchmura terracotta craftsperson specializing in traditional votive figurines.'
  );

  await seedProductDraft(
    artisanBUid,
    'draft_terracotta_horse_01',
    'Bankura Heritage Terracotta Figurine',
    'Pottery & Ceramics',
    'Terracotta Kiln Craft',
    'West Bengal',
    3800
  );

  // Seed Coordinator
  await seedUser(
    'coordinator@karigarsaathi.gov.in',
    'CoordinatorPass123!',
    'Priya Sharma',
    'Cluster Coordination & Documentation',
    'Assam',
    'Guwahati Cluster Hub',
    'Regional coordinator facilitating digital craft passports and artisan assistance.'
  );

  // Update coordinator role in user doc
  const coordUserRef = doc(db, 'users', (await signInWithEmailAndPassword(auth, 'coordinator@karigarsaathi.gov.in', 'CoordinatorPass123!')).user.uid);
  await setDoc(coordUserRef, { role: 'coordinator' }, { merge: true });

  console.log('--- Emulator Seed Completed Successfully ---');
  await deleteApp(app);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
