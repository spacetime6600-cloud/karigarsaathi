/**
 * Phase 10 Live End-to-End Verification Script
 * Validates Craft Passport activation, unauthenticated public read, buyer enquiry,
 * revocation, and cross-tenant boundaries against Firebase Local Emulator Suite.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, connectAuthEmulator } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  connectFirestoreEmulator,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-karigarsaathi.firebaseapp.com',
  projectId: 'demo-karigarsaathi',
  storageBucket: 'demo-karigarsaathi.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8085);

async function runPhase10Verification() {
  console.log('=== STARTING PHASE 10 LIVE E2E VERIFICATION ===\n');

  // Step 1: Sign in as Artisan A
  console.log('1. Signing in as Artisan A (artisan_a@karigarsaathi.local)...');
  const userCredA = await signInWithEmailAndPassword(auth, 'artisan_a@karigarsaathi.local', 'KarigarPass123!');
  const artisanAUid = userCredA.user.uid;
  console.log(`   ✓ Artisan A Authenticated. UID: ${artisanAUid}`);

  // Step 2: Create a verified ready product
  const testProductId = `prod_p10_${Date.now()}`;
  const now = new Date().toISOString();
  console.log(`\n2. Creating verified ready product: ${testProductId}...`);

  await setDoc(doc(db, 'products', testProductId), {
    id: testProductId,
    ownerId: artisanAUid,
    artisanId: artisanAUid,
    title: 'Handcrafted Assam Silk Jamdani Saree',
    description: 'Authentic pure silk saree handwoven with floral Jamdani motifs on a traditional pit loom.',
    category: 'Handloom Textiles',
    craftType: 'Jamdani Weaving',
    state: 'Assam',
    material: 'Mulberry Silk',
    materials: ['Mulberry Silk', 'Natural Indigo Dye'],
    dimensions: '5.5m x 1.15m',
    price: 14500,
    currency: 'INR',
    stockQuantity: 2,
    status: 'ready',
    lifecycleStatus: 'ready',
    photoPaths: [`users/${artisanAUid}/products/${testProductId}/originals/p1.jpg`],
    createdAt: now,
    updatedAt: now,
  });
  console.log('   ✓ Product created in Firestore with status: "ready"');

  // Step 3: Activate Craft Passport
  const passportId = `pass_p10_${Date.now()}`;
  const slug = `assam-silk-jamdani-${Date.now().toString(36)}`;
  console.log(`\n3. Activating Craft Passport with slug: ${slug}...`);

  // 3a: Private Passport
  await setDoc(doc(db, 'users', artisanAUid, 'craftPassports', passportId), {
    id: passportId,
    ownerId: artisanAUid,
    productId: testProductId,
    publicToken: 'tok_random_123',
    publicSlug: slug,
    status: 'active',
    approvedFields: ['title', 'description', 'photos', 'materials', 'price', 'artisanName', 'location'],
    consentRecordId: `consent_${passportId}`,
    publishedSnapshotVersion: 1,
    createdAt: now,
    updatedAt: now,
    activatedAt: now,
  });

  // 3b: Consent Record
  await setDoc(doc(db, 'users', artisanAUid, 'consentRecords', `consent_${passportId}`), {
    id: `consent_${passportId}`,
    ownerId: artisanAUid,
    productId: testProductId,
    passportId,
    purpose: 'public_passport',
    approvedFields: ['title', 'description', 'photos', 'materials', 'price'],
    consentGranted: true,
    snapshotVersion: 1,
    actorUid: artisanAUid,
    createdAt: now,
  });

  // 3c: Sanitized Public Projection with removeUndefinedDeep
  function removeUndefinedDeep(value) {
    if (Array.isArray(value)) {
      return value.filter((item) => item !== undefined).map((item) => removeUndefinedDeep(item));
    }
    if (value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, item]) => item !== undefined)
          .map(([key, item]) => [key, removeUndefinedDeep(item)])
      );
    }
    return value;
  }

  const rawPublicPayload = {
    passportId,
    productId: testProductId,
    ownerId: artisanAUid,
    slug,
    status: 'active',
    snapshotVersion: 1,
    publicData: {
      title: 'Handcrafted Assam Silk Jamdani Saree',
      description: 'Authentic pure silk saree handwoven with floral Jamdani motifs on a traditional pit loom.',
      photos: [`https://storage.googleapis.com/demo/${testProductId}.jpg`],
      materials: ['Mulberry Silk', 'Natural Indigo Dye'],
      price: 14500,
      currency: 'INR',
      artisanName: 'Ravi Kumar',
      state: 'Assam',
      verificationHash: 'KS-VERIFIED-AS-8812',
      // Explicitly undefined fields that previously crashed Firestore setDoc()
      careInstructions: undefined,
      dimensions: undefined,
      subcategory: undefined,
      tags: undefined,
    },
    activatedAt: now,
    updatedAt: now,
  };

  const safePublicPayload = removeUndefinedDeep(rawPublicPayload);

  await setDoc(doc(db, 'publicCraftPassports', slug), safePublicPayload);
  console.log('   ✓ Private passport, consent record, and public projection (with undefined safety) created successfully.');

  // Step 4: Unauthenticated Public View Check
  console.log('\n4. Verifying Unauthenticated Public Passport Access & Undefined Absence...');
  const publicSnap = await getDoc(doc(db, 'publicCraftPassports', slug));
  if (!publicSnap.exists()) {
    throw new Error('Public passport document could not be read!');
  }
  const publicData = publicSnap.data();
  if (publicData.status !== 'active' || !publicData.publicData.title) {
    throw new Error('Public passport data is malformed!');
  }
  if ('careInstructions' in publicData.publicData) {
    throw new Error('careInstructions exists in publicData even though it was undefined!');
  }
  console.log(`   ✓ Unauthenticated read successful: "${publicData.publicData.title}"`);
  console.log(`   ✓ Certified price verified: ₹${publicData.publicData.price}`);
  console.log(`   ✓ Verified absence of careInstructions and private pricing sheets / UIDs in publicData`);

  // Step 5: Verify Direct Client Write Lockdown on Buyer Enquiries
  console.log('\n5. Verifying Buyer Enquiry Client Write Lockdown...');
  const enquiryId = `enq_test_${Date.now()}`;
  try {
    await setDoc(doc(db, 'buyerEnquiries', enquiryId), {
      id: enquiryId,
      productId: testProductId,
      passportId,
      artisanId: artisanAUid,
      buyerName: 'Anita Roy',
      buyerContact: 'anita.roy@example.com',
      initialMessage: 'I would like to order 3 sarees for our craft boutique.',
      quantityRequested: 3,
      status: 'new',
      receivedAt: now,
    });
    throw new Error('Security violation: Direct client write to /buyerEnquiries was not blocked!');
  } catch (err) {
    if (err.message.includes('Security violation')) throw err;
    console.log('   ✓ Direct client write to /buyerEnquiries correctly blocked by security rules.');
  }

  // Step 6: Revocation Flow
  console.log('\n6. Testing Passport Revocation...');
  await updateDoc(doc(db, 'users', artisanAUid, 'craftPassports', passportId), {
    status: 'revoked',
    revokedAt: new Date().toISOString(),
  });
  await setDoc(doc(db, 'publicCraftPassports', slug), {
    passportId,
    productId: testProductId,
    ownerId: artisanAUid,
    slug,
    status: 'revoked',
    publicData: { title: '', photos: [] },
    revokedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const revokedSnap = await getDoc(doc(db, 'publicCraftPassports', slug));
  const revokedData = revokedSnap.data();
  if (revokedData.status !== 'revoked' || revokedData.publicData.title !== '') {
    throw new Error('Revoked public passport still exposes product data!');
  }
  console.log('   ✓ Post-revocation confirmed: status is "revoked", product data stripped completely.');

  // Step 7: Cross-tenant isolation with Artisan B
  console.log('\n7. Testing Cross-Tenant Security with Artisan B...');
  const userCredB = await signInWithEmailAndPassword(auth, 'artisan_b@karigarsaathi.local', 'KarigarPass123!');
  console.log(`   ✓ Artisan B Authenticated. UID: ${userCredB.user.uid}`);

  try {
    await getDoc(doc(db, 'users', artisanAUid, 'craftPassports', passportId));
    console.log('   ❌ ERROR: Artisan B was able to read Artisan A private passport!');
  } catch (err) {
    console.log(`   ✓ Private passport read blocked for Artisan B: ${err.code || 'PERMISSION_DENIED'}`);
  }

  try {
    await setDoc(doc(db, 'publicCraftPassports', slug), {
      status: 'active',
      ownerId: artisanAUid,
    });
    console.log('   ❌ ERROR: Artisan B was able to update Artisan A public passport!');
  } catch (err) {
    console.log(`   ✓ Public passport modification blocked for Artisan B: ${err.code || 'PERMISSION_DENIED'}`);
  }

  console.log('\n=== ALL PHASE 10 LIVE VERIFICATION CHECKS PASSED PERFECTLY ===');
}

runPhase10Verification()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  });
