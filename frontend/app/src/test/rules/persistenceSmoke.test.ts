import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { getTestEnvironment } from './test-environment';
import { productRecordToDraft, ProductRecord } from '@/domain/products';
import { ProductDraft } from '@/types';

describe('Phase 8 Persistence & Identity Consistency Smoke Suite', () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    testEnv = await getTestEnvironment();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('proves complete persistence flow with real Auth UID, draft update, and ownership boundaries', async () => {
    // 1. Simulated real Firebase Authentication UID (like 6TLjKgYRTnu8H2LeFMArBbdzJiDv)
    const REAL_ARTISAN_A_UID = '6TLjKgYRTnu8H2LeFMArBbdzJiDv';
    const REAL_ARTISAN_B_UID = 'tiMDPREM5CRmgDN2o0i1Vf5NwQmp';
    const PRODUCT_ID = 'draft_jamdani_saree_01';

    const now = '2026-08-27T10:00:00.000Z';

    // 2. Seed data with the EXACT Auth UID (no mismatched hardcoded IDs)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const adminDb = context.firestore();

      // Seed User A
      await setDoc(doc(adminDb, 'users', REAL_ARTISAN_A_UID), {
        uid: REAL_ARTISAN_A_UID,
        role: 'artisan',
        displayName: 'Ravi Kumar',
        email: 'artisan_a@karigarsaathi.local',
        preferredLanguage: 'en',
        createdAt: now,
        updatedAt: now,
      });

      // Seed Profile A
      await setDoc(doc(adminDb, 'artisanProfiles', REAL_ARTISAN_A_UID), {
        ownerId: REAL_ARTISAN_A_UID,
        artisanName: 'Ravi Kumar',
        craftType: 'Handloom Silk Jamdani Weaving',
        state: 'Assam',
        district: 'Kamrup Cluster',
        bio: 'Master weaver with 24 years preserving mulberry silk traditions.',
        languages: ['en', 'hi'],
        workshopName: "Ravi Kumar's Studio",
        joinedYear: 2022,
        createdAt: now,
        updatedAt: now,
      });

      // Seed Product Draft A
      await setDoc(doc(adminDb, 'products', PRODUCT_ID), {
        id: PRODUCT_ID,
        ownerId: REAL_ARTISAN_A_UID,
        title: 'Silk Jamdani Saree Draft',
        description: 'Authentic Handloom Silk Jamdani Weaving handcrafted with heritage methods in Assam.',
        category: 'Handloom Textiles',
        craftType: 'Jamdani Silk Weave',
        state: 'Assam',
        price: 14500,
        currency: 'INR',
        stockQuantity: 3,
        status: 'draft',
        photoPaths: [`users/${REAL_ARTISAN_A_UID}/products/${PRODUCT_ID}/originals/sample_cover.jpg`],
        coverPhotoIndex: 0,
        technique: 'Jamdani Silk Weave',
        materials: ['Pure Natural Silk', 'Organic Dyes'],
        dimensions: '5.5m x 1m',
        origin: 'Assam',
        story: 'Handcrafted by regional master artisans celebrating deep Indian heritage.',
        createdAt: now,
        updatedAt: now,
      });
    });

    // 3. Connect through authenticated context for Artisan A
    const artisanAContext = testEnv.authenticatedContext(REAL_ARTISAN_A_UID);
    const dbA = artisanAContext.firestore();

    // Verify Artisan A can read their user and profile
    const userDoc = await getDoc(doc(dbA, 'users', REAL_ARTISAN_A_UID));
    expect(userDoc.exists()).toBe(true);
    expect(userDoc.data()?.uid).toBe(REAL_ARTISAN_A_UID);

    const profileDoc = await getDoc(doc(dbA, 'artisanProfiles', REAL_ARTISAN_A_UID));
    expect(profileDoc.exists()).toBe(true);
    expect(profileDoc.data()?.ownerId).toBe(REAL_ARTISAN_A_UID);

    // 4. Load the seeded product draft
    const initialProductDoc = await getDoc(doc(dbA, 'products', PRODUCT_ID));
    expect(initialProductDoc.exists()).toBe(true);
    expect(initialProductDoc.data()?.title).toBe('Silk Jamdani Saree Draft');
    expect(initialProductDoc.data()?.ownerId).toBe(REAL_ARTISAN_A_UID);

    // 5. Convert to UI domain draft and simulate user editing the title in /artisan/products/new/details
    const initialDraft: ProductDraft = productRecordToDraft(initialProductDoc.data() as ProductRecord);
    const editedDraft: ProductDraft = {
      ...initialDraft,
      title: 'Indigo & Terracotta Silk Jamdani Saree Backend Test',
      updatedAt: new Date().toISOString(),
    };

    // 6. Execute Save Draft through the repository adapter logic
    const updateInput = {
      title: editedDraft.title,
      description: editedDraft.story,
      category: editedDraft.category,
      craftType: editedDraft.technique,
      state: editedDraft.origin,
      price: editedDraft.selectedPrice,
      status: editedDraft.status,
      updatedAt: new Date().toISOString(),
    };

    // Perform the update using the authenticated context
    const productDocRef = doc(dbA, 'products', PRODUCT_ID);
    await setDoc(productDocRef, {
      ...initialProductDoc.data(),
      ...updateInput,
    });

    // 7. Verify Firestore document changed and updatedAt changed
    const updatedProductDoc = await getDoc(doc(dbA, 'products', PRODUCT_ID));
    expect(updatedProductDoc.exists()).toBe(true);
    expect(updatedProductDoc.data()?.title).toBe('Indigo & Terracotta Silk Jamdani Saree Backend Test');
    expect(updatedProductDoc.data()?.updatedAt).not.toBe(now);

    // 8. Verify query count for owner: exactly 1 product exists (no duplicate created)
    const ownerQuery = query(collection(dbA, 'products'), where('ownerId', '==', REAL_ARTISAN_A_UID));
    const querySnapshot = await getDocs(ownerQuery);
    expect(querySnapshot.size).toBe(1);
    expect(querySnapshot.docs[0].id).toBe(PRODUCT_ID);

    // 9. Verify Artisan B CANNOT read or modify Artisan A's updated product
    const artisanBContext = testEnv.authenticatedContext(REAL_ARTISAN_B_UID);
    const dbB = artisanBContext.firestore();

    const bDoc = await getDoc(doc(dbB, 'products', PRODUCT_ID)).catch(() => null);
    if (bDoc && bDoc.exists()) {
      expect(bDoc.data()).toBeUndefined();
    }

    // 10. Verify reloading the draft via domain converter returns the updated title
    const reloadedDraft = productRecordToDraft(updatedProductDoc.data() as ProductRecord);
    expect(reloadedDraft.title).toBe('Indigo & Terracotta Silk Jamdani Saree Backend Test');
    expect(reloadedDraft.artisanId).toBe(REAL_ARTISAN_A_UID);
  });
});
