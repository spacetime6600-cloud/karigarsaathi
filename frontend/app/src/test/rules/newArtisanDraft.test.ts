import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, getDocs, query, collection, where, limit } from 'firebase/firestore';
import { getTestEnvironment } from './test-environment';

describe('Newly Registered Production-Style Artisan & Enquiry Query Rules Suite', () => {
  let testEnv: RulesTestEnvironment;

  const NEW_ARTISAN_UID = 'Wj58bK2LmPQr49XyZ10AbCdEfGh';
  const OTHER_ARTISAN_UID = 'kL99mNoPqRsTuVwXyZ123456789';
  const DRAFT_PRODUCT_ID = `draft_${Date.now()}_test1`;
  const NON_EXISTENT_PRODUCT_ID = 'draft_does_not_exist_999';

  beforeAll(async () => {
    testEnv = await getTestEnvironment();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  it('1. Newly registered artisan can create their own user document', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();
    const now = new Date().toISOString();

    await assertSucceeds(
      setDoc(doc(db, 'users', NEW_ARTISAN_UID), {
        uid: NEW_ARTISAN_UID,
        role: 'artisan',
        displayName: 'Aarohi Patel',
        email: 'aarohi.crafts@production.com',
        preferredLanguage: 'hi',
        createdAt: now,
        updatedAt: now,
      })
    );
  });

  it('2. Newly registered artisan can create their own artisan profile with phone and profileImagePath', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();
    const now = new Date().toISOString();

    await assertSucceeds(
      setDoc(doc(db, 'artisanProfiles', NEW_ARTISAN_UID), {
        ownerId: NEW_ARTISAN_UID,
        artisanName: 'Aarohi Patel',
        craftType: 'Bandhani Textile Dyeing',
        state: 'Gujarat',
        district: 'Kutch',
        bio: 'Traditional tie-and-dye master artisan.',
        languages: ['gu', 'hi'],
        phone: '+91 9876543210',
        profileImagePath: 'https://example.com/avatar.jpg',
        createdAt: now,
        updatedAt: now,
      })
    );
  });

  it('3. Newly registered artisan can create their own product draft', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();
    const now = new Date().toISOString();

    const productPayload = {
      id: DRAFT_PRODUCT_ID,
      ownerId: NEW_ARTISAN_UID,
      title: 'Handcrafted Kutch Bandhani Dupatta',
      description: 'Pure georgette silk traditional tie-dye dupatta.',
      category: 'Handloom Textiles',
      craftType: 'Bandhani Dyeing',
      state: 'Gujarat',
      price: 3500,
      currency: 'INR',
      stockQuantity: 4,
      status: 'draft',
      photoPaths: [],
      createdAt: now,
      updatedAt: now,
    };

    await assertSucceeds(setDoc(doc(db, 'products', DRAFT_PRODUCT_ID), productPayload));
  });

  it('4. Artisan can read their own created product draft by ID', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();
    const now = new Date().toISOString();

    // First create
    await setDoc(doc(db, 'products', DRAFT_PRODUCT_ID), {
      id: DRAFT_PRODUCT_ID,
      ownerId: NEW_ARTISAN_UID,
      title: 'Handcrafted Kutch Bandhani Dupatta',
      description: 'Pure georgette silk traditional tie-dye dupatta.',
      category: 'Handloom Textiles',
      craftType: 'Bandhani Dyeing',
      state: 'Gujarat',
      price: 3500,
      currency: 'INR',
      stockQuantity: 4,
      status: 'draft',
      photoPaths: [],
      createdAt: now,
      updatedAt: now,
    });

    const docSnap = await assertSucceeds(getDoc(doc(db, 'products', DRAFT_PRODUCT_ID)));
    expect(docSnap.exists()).toBe(true);
    expect(docSnap.data()?.title).toBe('Handcrafted Kutch Bandhani Dupatta');
  });

  it('5. Artisan reading a non-existent product draft by ID', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();
    const docSnap = await assertSucceeds(getDoc(doc(db, 'products', NON_EXISTENT_PRODUCT_ID)));
    expect(docSnap.exists()).toBe(false);
  });

  it('6. Artisan can list their own products using owner-scoped query', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();
    const now = new Date().toISOString();

    await setDoc(doc(db, 'products', DRAFT_PRODUCT_ID), {
      id: DRAFT_PRODUCT_ID,
      ownerId: NEW_ARTISAN_UID,
      title: 'Handcrafted Kutch Bandhani Dupatta',
      description: 'Pure georgette silk traditional tie-dye dupatta.',
      category: 'Handloom Textiles',
      craftType: 'Bandhani Dyeing',
      state: 'Gujarat',
      price: 3500,
      currency: 'INR',
      stockQuantity: 4,
      status: 'draft',
      photoPaths: [],
      createdAt: now,
      updatedAt: now,
    });

    const q = query(
      collection(db, 'products'),
      where('ownerId', '==', NEW_ARTISAN_UID),
      limit(100)
    );
    const snap = await assertSucceeds(getDocs(q));
    expect(snap.size).toBe(1);
    expect(snap.docs[0].id).toBe(DRAFT_PRODUCT_ID);
  });

  it('7. Querying products with fallback demo_artisan_ravi fails permissions when authenticated as new artisan', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();

    const mismatchedQuery = query(
      collection(db, 'products'),
      where('ownerId', '==', 'demo_artisan_ravi'),
      limit(100)
    );
    // Rules require resource.data.ownerId == request.auth.uid
    await assertFails(getDocs(mismatchedQuery));
  });

  it('8. Artisan can query their own buyerEnquiries with artisanId == auth.uid', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();

    // Query on buyerEnquiries with artisanId == auth.uid
    const q = query(
      collection(db, 'buyerEnquiries'),
      where('artisanId', '==', NEW_ARTISAN_UID),
      limit(100)
    );
    const snap = await assertSucceeds(getDocs(q));
    expect(snap.size).toBe(0);
  });

  it('9. Querying buyerEnquiries with mismatched artisanId fails permissions', async () => {
    const db = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();

    const mismatchedQuery = query(
      collection(db, 'buyerEnquiries'),
      where('artisanId', '==', 'demo_artisan_ravi'),
      limit(100)
    );
    await assertFails(getDocs(mismatchedQuery));
  });

  it('10. Other artisan cannot read new artisan product draft', async () => {
    const dbOwner = testEnv.authenticatedContext(NEW_ARTISAN_UID).firestore();
    const now = new Date().toISOString();

    await setDoc(doc(dbOwner, 'products', DRAFT_PRODUCT_ID), {
      id: DRAFT_PRODUCT_ID,
      ownerId: NEW_ARTISAN_UID,
      title: 'Secret Draft',
      description: 'Private',
      category: 'Handloom Textiles',
      craftType: 'Bandhani Dyeing',
      state: 'Gujarat',
      price: 3500,
      currency: 'INR',
      stockQuantity: 4,
      status: 'draft',
      photoPaths: [],
      createdAt: now,
      updatedAt: now,
    });

    const dbOther = testEnv.authenticatedContext(OTHER_ARTISAN_UID).firestore();
    await assertFails(getDoc(doc(dbOther, 'products', DRAFT_PRODUCT_ID)));
  });
});
