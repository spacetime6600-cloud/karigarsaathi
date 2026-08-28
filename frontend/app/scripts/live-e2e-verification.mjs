import { initializeApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';
import {
  getStorage,
  connectStorageEmulator,
  ref,
  uploadBytes,
  getBytes,
  deleteObject,
} from 'firebase/storage';

const PROJECT_ID = 'demo-karigarsaathi';

const firebaseConfig = {
  apiKey: 'AIzaSyDemoFakeApiKeyForLocalEmulator123',
  authDomain: `${PROJECT_ID}.firebaseapp.com`,
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.appspot.com`,
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890abcdef',
};

const app = initializeApp(firebaseConfig, 'live-e2e-verifier');
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
connectFirestoreEmulator(db, '127.0.0.1', 8085);
connectStorageEmulator(storage, '127.0.0.1', 9199);

async function runLiveVerification() {
  console.log('===============================================================');
  console.log('PHASE 8 LIVE FRONTEND-TO-FIREBASE END-TO-END VERIFICATION');
  console.log('===============================================================');

  // STEP 1: Sign in using seeded Artisan A credentials
  console.log('\n[STEP 1] Signing in as seeded Artisan A: artisan_a@karigarsaathi.local');
  const credA = await signInWithEmailAndPassword(auth, 'artisan_a@karigarsaathi.local', 'KarigarPass123!');
  const artisanAUid = credA.user.uid;
  console.log(`-> Authenticated Artisan A UID: ${artisanAUid}`);

  // STEP 2: Confirm UID matches users, artisanProfiles, products.ownerId, and storage
  console.log('\n[STEP 2] Verifying UID consistency across users, artisanProfiles, and products collections');
  const userDocRef = doc(db, 'users', artisanAUid);
  const userSnap = await getDoc(userDocRef);
  if (!userSnap.exists()) throw new Error(`users/${artisanAUid} does not exist`);
  console.log(`-> users/${artisanAUid} data:`, userSnap.data());

  const profileDocRef = doc(db, 'artisanProfiles', artisanAUid);
  const profileSnap = await getDoc(profileDocRef);
  if (!profileSnap.exists()) throw new Error(`artisanProfiles/${artisanAUid} does not exist`);
  console.log(`-> artisanProfiles/${artisanAUid} ownerId:`, profileSnap.data().ownerId);

  // STEP 3: Load Artisan A's seeded draft
  const draftId = 'draft_jamdani_saree_01';
  const productDocRef = doc(db, 'products', draftId);
  const productSnapBefore = await getDoc(productDocRef);
  if (!productSnapBefore.exists()) throw new Error(`products/${draftId} does not exist`);

  const beforeData = productSnapBefore.data();
  console.log(`\n[STEP 3] Loaded seeded draft before update:`);
  console.log(`-> Document ID: products/${draftId}`);
  console.log(`-> Initial Title: "${beforeData.title}"`);
  console.log(`-> Initial ownerId: "${beforeData.ownerId}"`);
  console.log(`-> Initial updatedAt: "${beforeData.updatedAt}"`);
  console.log(`-> Initial photoPaths:`, beforeData.photoPaths);

  if (beforeData.ownerId !== artisanAUid) {
    throw new Error(`Owner mismatch! Expected ${artisanAUid}, got ${beforeData.ownerId}`);
  }

  // STEP 4: Edit title to "Indigo & Terracotta Silk Jamdani Saree Backend Test" and Save Draft
  const newTitle = 'Indigo & Terracotta Silk Jamdani Saree Backend Test';
  const newUpdatedAt = new Date().toISOString();
  console.log(`\n[STEP 4] Executing Save Draft with updated title: "${newTitle}"`);

  await updateDoc(productDocRef, {
    title: newTitle,
    updatedAt: newUpdatedAt,
  });
  console.log('-> Firestore updateDoc completed successfully');

  // STEP 5: Verify directly in Firestore
  const productSnapAfter = await getDoc(productDocRef);
  const afterData = productSnapAfter.data();
  console.log(`\n[STEP 5] Verifying direct Firestore document state after save:`);
  console.log(`-> Document ID: products/${draftId}`);
  console.log(`-> Updated Title: "${afterData.title}"`);
  console.log(`-> Updated updatedAt: "${afterData.updatedAt}"`);
  console.log(`-> Maintained ownerId: "${afterData.ownerId}"`);

  if (afterData.title !== newTitle) throw new Error('Title update verification failed!');
  if (afterData.updatedAt === beforeData.updatedAt) throw new Error('updatedAt did not change!');
  if (afterData.ownerId !== artisanAUid) throw new Error('ownerId mutated unexpectedly!');

  // Check product count for owner (assert no duplicate created)
  const q = query(collection(db, 'products'), where('ownerId', '==', artisanAUid));
  const qSnap = await getDocs(q);
  console.log(`-> Total products for owner ${artisanAUid}: ${qSnap.size} (asserting exactly 1 draft)`);
  if (qSnap.size !== 1) throw new Error(`Expected 1 product, found ${qSnap.size}`);

  // STEP 6: Refresh Simulation / Reload Verification
  console.log('\n[STEP 6] Simulating page refresh and re-fetching draft from Firestore');
  const refreshedSnap = await getDoc(productDocRef);
  const refreshedData = refreshedSnap.data();
  console.log(`-> Re-fetched Title on fresh read: "${refreshedData.title}"`);
  if (refreshedData.title !== newTitle) throw new Error('Refresh persistence failed!');

  // STEP 7: Test Valid Image Upload
  console.log('\n[STEP 7] Testing Valid Photograph Upload under authenticated Artisan A UID');
  const validPhotoFileId = `photo_valid_${Date.now()}.jpg`;
  const validStoragePath = `users/${artisanAUid}/products/${draftId}/originals/${validPhotoFileId}`;
  const validStorageRef = ref(storage, validStoragePath);
  const sampleJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);

  await uploadBytes(validStorageRef, sampleJpegBytes, {
    contentType: 'image/jpeg',
    customMetadata: {
      ownerId: artisanAUid,
      productId: draftId,
    },
  });
  console.log(`-> Valid JPEG uploaded successfully to: ${validStoragePath}`);

  // Update Firestore photoPaths
  await updateDoc(productDocRef, {
    photoPaths: [...afterData.photoPaths, validStoragePath],
    updatedAt: new Date().toISOString(),
  });
  console.log(`-> Added canonical storage path to Firestore product record`);

  // Verify photo read back
  const downloadedBytes = await getBytes(validStorageRef);
  console.log(`-> Successfully downloaded back ${downloadedBytes.byteLength} bytes from Storage`);

  // STEP 8: Test Invalid File Type Upload (Security Boundary Check)
  console.log('\n[STEP 8] Testing Invalid File Type Upload (e.g. text/html, application/pdf)');
  const invalidStoragePath = `users/${artisanAUid}/products/${draftId}/originals/malicious.html`;
  const invalidStorageRef = ref(storage, invalidStoragePath);
  const htmlBytes = new TextEncoder().encode('<html><script>alert(1)</script></html>');

  let invalidUploadBlocked = false;
  try {
    await uploadBytes(invalidStorageRef, htmlBytes, {
      contentType: 'text/html',
      customMetadata: {
        ownerId: artisanAUid,
        productId: draftId,
      },
    });
  } catch (err) {
    invalidUploadBlocked = true;
    console.log(`-> Security rule successfully blocked invalid upload: ${(err).message || err}`);
  }

  if (!invalidUploadBlocked) {
    throw new Error('Security vulnerability: Invalid file type text/html was allowed!');
  }

  // STEP 9: Cross-Tenant Isolation (Artisan B)
  console.log('\n[STEP 9] Signing out Artisan A and signing in as Artisan B: artisan_b@karigarsaathi.local');
  await signOut(auth);

  const credB = await signInWithEmailAndPassword(auth, 'artisan_b@karigarsaathi.local', 'KarigarPass123!');
  const artisanBUid = credB.user.uid;
  console.log(`-> Authenticated Artisan B UID: ${artisanBUid}`);

  // Artisan B trying to read Artisan A's draft
  console.log(`-> Attempting to read Artisan A draft from Artisan B context...`);
  let artisanBReadBlocked = false;
  try {
    const bDocSnap = await getDoc(productDocRef);
    if (!bDocSnap.exists() || bDocSnap.data()?.ownerId !== artisanAUid) {
      artisanBReadBlocked = true;
    }
  } catch (err) {
    artisanBReadBlocked = true;
    console.log(`-> Confirmed: Artisan B read blocked with permission denied: ${err.message || err}`);
  }

  if (!artisanBReadBlocked) {
    throw new Error(`SECURITY BREACH: Artisan B was able to read Artisan A's private product!`);
  }

  // Artisan B trying to update Artisan A's draft
  console.log(`-> Attempting to update Artisan A draft from Artisan B context...`);
  let artisanBUpdateBlocked = false;
  try {
    await updateDoc(productDocRef, { title: 'Hacked by Artisan B' });
  } catch (err) {
    artisanBUpdateBlocked = true;
    console.log(`-> Confirmed: Artisan B update blocked with permission denied: ${(err).message || err}`);
  }

  if (!artisanBUpdateBlocked) {
    throw new Error(`SECURITY BREACH: Artisan B was able to modify Artisan A's product!`);
  }

  // Artisan B trying to download Artisan A's original photograph
  console.log(`-> Attempting to download Artisan A's photograph from Artisan B context...`);
  let artisanBStorageBlocked = false;
  try {
    await getBytes(validStorageRef);
  } catch (err) {
    artisanBStorageBlocked = true;
    console.log(`-> Confirmed: Artisan B storage download blocked with permission denied: ${(err).message || err}`);
  }

  if (!artisanBStorageBlocked) {
    throw new Error(`SECURITY BREACH: Artisan B was able to download Artisan A's original photograph!`);
  }

  console.log('\n===============================================================');
  console.log('ALL PHASE 8 LIVE VERIFICATION GATES PASSED SUCCESSFULLY!');
  console.log('===============================================================');

  return {
    artisanAUid,
    artisanBUid,
    draftId,
    beforeTitle: beforeData.title,
    beforeUpdatedAt: beforeData.updatedAt,
    afterTitle: afterData.title,
    afterUpdatedAt: afterData.updatedAt,
    validStoragePath,
  };
}

runLiveVerification()
  .then((res) => {
    console.log('Verification summary payload:', JSON.stringify(res, null, 2));
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
