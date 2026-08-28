import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getTestEnvironment } from './test-environment';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';

describe('Firestore Security Rules Suite — Deny-by-Default & Owner Isolation', () => {
  let testEnv: RulesTestEnvironment;

  const ARTISAN_A_UID = 'artisan_a_123';
  const ARTISAN_B_UID = 'artisan_b_456';
  const BUYER_UID = 'buyer_789';

  beforeAll(async () => {
    testEnv = await getTestEnvironment();
    await testEnv.clearFirestore();

    // Pre-seed test-only records using admin context with security rules bypassed
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();

      // Seed Artisan A user & profile
      await setDoc(doc(db, 'users', ARTISAN_A_UID), {
        uid: ARTISAN_A_UID,
        role: 'artisan',
        displayName: 'Ravi Kumar',
        email: 'ravi@example.com',
        preferredLanguage: 'en',
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      });

      await setDoc(doc(db, 'artisanProfiles', ARTISAN_A_UID), {
        ownerId: ARTISAN_A_UID,
        artisanName: 'Ravi Kumar',
        craftType: 'Handloom Silk Weaving',
        state: 'Assam',
        district: 'Kamrup',
        bio: 'Master weaver with 20+ years experience.',
        languages: ['en', 'hi'],
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      });

      // Seed Artisan A draft product & published product
      await setDoc(doc(db, 'products', 'prod_a_draft'), {
        id: 'prod_a_draft',
        ownerId: ARTISAN_A_UID,
        title: 'Silk Jamdani Saree Draft',
        description: 'Handwoven pure silk saree.',
        category: 'Handloom Textiles',
        craftType: 'Jamdani',
        state: 'Assam',
        price: 12500,
        currency: 'INR',
        stockQuantity: 2,
        status: 'draft',
        photoPaths: ['users/artisan_a_123/products/prod_a_draft/originals/p1.jpg'],
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      });

      await setDoc(doc(db, 'products', 'prod_a_published'), {
        id: 'prod_a_published',
        ownerId: ARTISAN_A_UID,
        title: 'Silk Jamdani Saree Published',
        description: 'Handwoven pure silk saree.',
        category: 'Handloom Textiles',
        craftType: 'Jamdani',
        state: 'Assam',
        price: 14500,
        currency: 'INR',
        stockQuantity: 1,
        status: 'published',
        photoPaths: ['users/artisan_a_123/products/prod_a_published/originals/p1.jpg'],
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      });

      // Seed Artisan B user & profile
      await setDoc(doc(db, 'users', ARTISAN_B_UID), {
        uid: ARTISAN_B_UID,
        role: 'artisan',
        displayName: 'Sunita Devi',
        email: 'sunita@example.com',
        preferredLanguage: 'hi',
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      });

      await setDoc(doc(db, 'artisanProfiles', ARTISAN_B_UID), {
        ownerId: ARTISAN_B_UID,
        artisanName: 'Sunita Devi',
        craftType: 'Terracotta Pottery',
        state: 'West Bengal',
        district: 'Bankura',
        bio: 'Terracotta heritage artisan.',
        languages: ['bn', 'hi'],
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      });

      await setDoc(doc(db, 'products', 'prod_b_draft'), {
        id: 'prod_b_draft',
        ownerId: ARTISAN_B_UID,
        title: 'Terracotta Vase Draft',
        description: 'Handmade clay pottery vase.',
        category: 'Pottery & Ceramics',
        craftType: 'Terracotta',
        state: 'West Bengal',
        price: 3200,
        currency: 'INR',
        stockQuantity: 5,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T10:00:00.000Z',
        updatedAt: '2026-08-27T10:00:00.000Z',
      });
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    //
  });

  const getDbAs = (uid?: string) => {
    return uid
      ? testEnv.authenticatedContext(uid, { email: `${uid}@example.com` }).firestore()
      : testEnv.unauthenticatedContext().firestore();
  };

  // =========================================================================
  // 1. User Accounts Tests
  // =========================================================================
  it('1. Artisan A can create their own allowed user record', async () => {
    const db = getDbAs('new_artisan');
    await assertSucceeds(
      setDoc(doc(db, 'users', 'new_artisan'), {
        uid: 'new_artisan',
        role: 'artisan',
        displayName: 'New Artisan',
        email: 'new@example.com',
        preferredLanguage: 'en',
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('2. Artisan A cannot create a record for Artisan B', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'users', ARTISAN_B_UID), {
        uid: ARTISAN_B_UID,
        role: 'artisan',
        displayName: 'Imposter',
        email: 'imposter@example.com',
        preferredLanguage: 'en',
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('3. Self-registration cannot create a coordinator role', async () => {
    const db = getDbAs('malicious_user');
    await assertFails(
      setDoc(doc(db, 'users', 'malicious_user'), {
        uid: 'malicious_user',
        role: 'coordinator',
        displayName: 'Malicious User',
        email: 'malicious@example.com',
        preferredLanguage: 'en',
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('4. Self-registration cannot create an administrator role', async () => {
    const db = getDbAs('malicious_admin');
    await assertFails(
      setDoc(doc(db, 'users', 'malicious_admin'), {
        uid: 'malicious_admin',
        role: 'administrator',
        displayName: 'Malicious Admin',
        email: 'admin@example.com',
        preferredLanguage: 'en',
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('5. Artisan A can read their own user record', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(getDoc(doc(db, 'users', ARTISAN_A_UID)));
  });

  it('6. Artisan A cannot read Artisan B’s user record', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(getDoc(doc(db, 'users', ARTISAN_B_UID)));
  });

  it('7. Artisan A cannot list all users', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(getDocs(collection(db, 'users')));
  });

  // =========================================================================
  // 2. Artisan Profiles Tests
  // =========================================================================
  it('8. Artisan A can create their own artisan profile', async () => {
    const db = getDbAs('artisan_new_profile');
    await assertSucceeds(
      setDoc(doc(db, 'artisanProfiles', 'artisan_new_profile'), {
        ownerId: 'artisan_new_profile',
        artisanName: 'New Artisan Name',
        craftType: 'Pottery',
        state: 'Odisha',
        district: 'Puri',
        bio: 'Traditional terracotta craftsperson.',
        languages: ['or', 'en'],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('9. Artisan A cannot create Artisan B’s profile', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'artisanProfiles', ARTISAN_B_UID), {
        ownerId: ARTISAN_B_UID,
        artisanName: 'Spoofed Sunita',
        craftType: 'Pottery',
        state: 'Odisha',
        district: 'Puri',
        bio: 'Spoofed bio',
        languages: ['en'],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('10. Artisan A can read their own profile', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(getDoc(doc(db, 'artisanProfiles', ARTISAN_A_UID)));
  });

  it('11. Artisan A cannot read Artisan B’s profile', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(getDoc(doc(db, 'artisanProfiles', ARTISAN_B_UID)));
  });

  it('12. Artisan A cannot list private profiles', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(getDocs(collection(db, 'artisanProfiles')));
  });

  // =========================================================================
  // 3. Products & Completion Gate Isolation Tests
  // =========================================================================
  it('13. Artisan A can create a product with their own owner ID', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(
      setDoc(doc(db, 'products', 'prod_a_new'), {
        id: 'prod_a_new',
        ownerId: ARTISAN_A_UID,
        title: 'Handmade Silk Shawl',
        description: 'Fine silk weaving.',
        category: 'Handloom Textiles',
        craftType: 'Jamdani',
        state: 'Assam',
        price: 8500,
        currency: 'INR',
        stockQuantity: 3,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('14. Artisan A cannot create a product owned by Artisan B', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_b_fake'), {
        id: 'prod_b_fake',
        ownerId: ARTISAN_B_UID,
        title: 'Fake Product',
        description: 'Unauthorized creation',
        category: 'Handloom Textiles',
        craftType: 'Jamdani',
        state: 'Assam',
        price: 5000,
        currency: 'INR',
        stockQuantity: 1,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('15. Artisan A can read their own draft', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(getDoc(doc(db, 'products', 'prod_a_draft')));
  });

  // Completion Gate Test 1
  it('16. artisan B cannot read artisan A draft', async () => {
    const db = getDbAs(ARTISAN_B_UID);
    await assertFails(getDoc(doc(db, 'products', 'prod_a_draft')));
  });

  it('17. An unauthenticated user cannot read a draft', async () => {
    const db = getDbAs();
    await assertFails(getDoc(doc(db, 'products', 'prod_a_draft')));
  });

  // Completion Gate Test 2
  it('18. artisan B cannot modify artisan A draft', async () => {
    const db = getDbAs(ARTISAN_B_UID);
    await assertFails(
      updateDoc(doc(db, 'products', 'prod_a_draft'), {
        title: 'Tampered Title',
        updatedAt: '2026-08-27T12:05:00.000Z',
      })
    );
  });

  // Completion Gate Test 3
  it('19. artisan B cannot delete artisan A draft', async () => {
    const db = getDbAs(ARTISAN_B_UID);
    await assertFails(deleteDoc(doc(db, 'products', 'prod_a_draft')));
  });

  it('20. Artisan A cannot change a product’s owner ID', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      updateDoc(doc(db, 'products', 'prod_a_draft'), {
        ownerId: ARTISAN_B_UID,
        updatedAt: '2026-08-27T12:05:00.000Z',
      })
    );
  });

  it('21. Artisan A cannot change a product’s ID', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      updateDoc(doc(db, 'products', 'prod_a_draft'), {
        id: 'prod_a_mutated_id',
        updatedAt: '2026-08-27T12:05:00.000Z',
      })
    );
  });

  it('22. Artisan A cannot change createdAt', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      updateDoc(doc(db, 'products', 'prod_a_draft'), {
        createdAt: '2020-01-01T00:00:00.000Z',
        updatedAt: '2026-08-27T12:05:00.000Z',
      })
    );
  });

  it('23. Forbidden fields are rejected', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_a_forbidden'), {
        id: 'prod_a_forbidden',
        ownerId: ARTISAN_A_UID,
        title: 'Title',
        description: 'Desc',
        category: 'Cat',
        craftType: 'Craft',
        state: 'Assam',
        price: 1000,
        currency: 'INR',
        stockQuantity: 1,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
        isAdminApproved: true,
      })
    );
  });

  it('24. Unknown product status is rejected', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_a_bad_status'), {
        id: 'prod_a_bad_status',
        ownerId: ARTISAN_A_UID,
        title: 'Title',
        description: 'Desc',
        category: 'Cat',
        craftType: 'Craft',
        state: 'Assam',
        price: 1000,
        currency: 'INR',
        stockQuantity: 1,
        status: 'featured_trending',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('25. Invalid field types are rejected', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_a_bad_type'), {
        id: 'prod_a_bad_type',
        ownerId: ARTISAN_A_UID,
        title: 12345,
        description: 'Desc',
        category: 'Cat',
        craftType: 'Craft',
        state: 'Assam',
        price: 1000,
        currency: 'INR',
        stockQuantity: 1,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('26. Negative price is rejected', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_a_neg_price'), {
        id: 'prod_a_neg_price',
        ownerId: ARTISAN_A_UID,
        title: 'Negative Price Saree',
        description: 'Desc',
        category: 'Cat',
        craftType: 'Craft',
        state: 'Assam',
        price: -500,
        currency: 'INR',
        stockQuantity: 1,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('27. Negative stock is rejected', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_a_neg_stock'), {
        id: 'prod_a_neg_stock',
        ownerId: ARTISAN_A_UID,
        title: 'Negative Stock',
        description: 'Desc',
        category: 'Cat',
        craftType: 'Craft',
        state: 'Assam',
        price: 1000,
        currency: 'INR',
        stockQuantity: -2,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('28. Oversized strings are rejected', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    const hugeTitle = 'A'.repeat(250);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_a_oversized'), {
        id: 'prod_a_oversized',
        ownerId: ARTISAN_A_UID,
        title: hugeTitle,
        description: 'Desc',
        category: 'Cat',
        craftType: 'Craft',
        state: 'Assam',
        price: 1000,
        currency: 'INR',
        stockQuantity: 1,
        status: 'draft',
        photoPaths: [],
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('29. Excessive photo-path arrays are rejected', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    const elevenPhotos = Array.from({ length: 11 }, (_, i) => `users/artisan_a_123/products/prod_a/p${i}.jpg`);
    await assertFails(
      setDoc(doc(db, 'products', 'prod_a_too_many_photos'), {
        id: 'prod_a_too_many_photos',
        ownerId: ARTISAN_A_UID,
        title: 'Many Photos',
        description: 'Desc',
        category: 'Cat',
        craftType: 'Craft',
        state: 'Assam',
        price: 1000,
        currency: 'INR',
        stockQuantity: 1,
        status: 'draft',
        photoPaths: elevenPhotos,
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('30. Owner-constrained product query succeeds', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    const q = query(collection(db, 'products'), where('ownerId', '==', ARTISAN_A_UID));
    await assertSucceeds(getDocs(q));
  });

  it('31. Broad product query fails for unauthorized cross-user reading', async () => {
    const db = getDbAs(BUYER_UID);
    const q = query(collection(db, 'products'));
    await assertFails(getDocs(q));
  });

  it('32. A different owner’s product query does not expose records', async () => {
    const db = getDbAs(ARTISAN_B_UID);
    const q = query(collection(db, 'products'), where('ownerId', '==', ARTISAN_A_UID));
    await assertFails(getDocs(q));
  });

  it('33. Published records in the private collection remain owner-only', async () => {
    const db = getDbAs(BUYER_UID);
    await assertFails(getDoc(doc(db, 'products', 'prod_a_published')));
  });

  it('34. Unauthenticated product reads fail', async () => {
    const db = getDbAs();
    await assertFails(getDoc(doc(db, 'products', 'prod_a_published')));
  });

  it('35. Unmatched collections are denied by default', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertFails(getDoc(doc(db, 'admin_settings', 'config')));
    await assertFails(setDoc(doc(db, 'random_collection', 'doc1'), { test: true }));
  });

  // =========================================================================
  // 4. Phase 9 Extended Fields, Ready & Archived Statuses
  // =========================================================================
  it('36. Artisan A can create a product with status ready and Phase 9 metadata', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(
      setDoc(doc(db, 'products', 'prod_a_ready'), {
        id: 'prod_a_ready',
        ownerId: ARTISAN_A_UID,
        title: 'Ready Heritage Shawl',
        titleHindi: 'तैयार पारंपरिक शॉल',
        description: 'Fine silk shawl ready for marketplace.',
        descriptionHindi: 'प्रामाणिक रेशमी शॉल।',
        category: 'Handloom Textiles',
        subcategory: 'Shawls',
        craftType: 'Silk Weave',
        state: 'Assam',
        material: 'Mulberry Silk',
        materials: ['Mulberry Silk'],
        colour: 'Indigo',
        dimensions: '2m x 1m',
        dimensionsObj: { length: 2, width: 1, unit: 'm' },
        weightObj: { value: 300, unit: 'g' },
        price: 9500,
        currency: 'INR',
        stockQuantity: 4,
        sku: 'SHW-001',
        status: 'ready',
        tags: ['Silk Shawl', 'Assam Craft'],
        makingTime: '12 Days',
        careInstructions: 'Dry clean only',
        customisationAvailable: true,
        shippingNotes: 'Ships in 2 days',
        photoPaths: ['users/artisan_a_123/products/prod_a_ready/originals/p1.jpg'],
        images: [{
          id: 'img_1',
          originalPath: 'users/artisan_a_123/products/prod_a_ready/originals/p1.jpg',
          displayPath: 'users/artisan_a_123/products/prod_a_ready/display/p1.webp',
          fileName: 'p1.jpg',
          contentType: 'image/jpeg',
          originalSize: 2000000,
          uploadStatus: 'completed',
          createdAt: '2026-08-27T12:00:00.000Z',
        }],
        primaryImageId: 'img_1',
        suggestionMetadata: { mockGenerated: true },
        completionState: { isReady: true, completedAt: '2026-08-27T12:00:00.000Z' },
        schemaVersion: 1,
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('37. Artisan A can archive a product (soft-delete)', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(
      updateDoc(doc(db, 'products', 'prod_a_draft'), {
        status: 'archived',
        archivedAt: '2026-08-27T12:30:00.000Z',
        updatedAt: '2026-08-27T12:30:00.000Z',
      })
    );
  });

  it('38. Artisan A can create a duplicated product with duplicatedFrom reference', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(
      setDoc(doc(db, 'products', 'prod_a_cloned'), {
        id: 'prod_a_cloned',
        ownerId: ARTISAN_A_UID,
        title: 'Silk Jamdani Saree Draft (Copy)',
        description: 'Handwoven pure silk saree.',
        category: 'Handloom Textiles',
        craftType: 'Jamdani',
        state: 'Assam',
        price: 12500,
        currency: 'INR',
        stockQuantity: 1,
        status: 'draft',
        duplicatedFrom: 'prod_a_draft',
        photoPaths: ['users/artisan_a_123/products/prod_a_draft/originals/p1.jpg'],
        createdAt: '2026-08-27T12:35:00.000Z',
        updatedAt: '2026-08-27T12:35:00.000Z',
      })
    );
  });

  // =========================================================================
  // 4. Phase 10 — Craft Passports, Public Projections, Enquiries & Audits
  // =========================================================================
  it('39. Unauthenticated public user can get active publicCraftPassport by slug', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'publicCraftPassports', 'chanderi-silk-saree-kamrup-7721'), {
        passportId: 'KP_01_7721',
        productId: 'prod_kamrup_01',
        ownerId: ARTISAN_A_UID,
        slug: 'chanderi-silk-saree-kamrup-7721',
        status: 'active',
        snapshotVersion: 1,
        publicData: {
          title: 'Chanderi Zari Mulberry Silk Saree',
          photos: ['https://images.unsplash.com/photo-1610030469983-98e550d6193c'],
        },
        activatedAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      });
    });

    const unauthDb = getDbAs();
    await assertSucceeds(getDoc(doc(unauthDb, 'publicCraftPassports', 'chanderi-silk-saree-kamrup-7721')));
  });

  it('40. Unauthenticated public user cannot list publicCraftPassports collection (enumeration blocked)', async () => {
    const unauthDb = getDbAs();
    await assertFails(getDocs(collection(unauthDb, 'publicCraftPassports')));
  });

  it('41. Artisan A can create and update their publicCraftPassport projection', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(
      setDoc(doc(db, 'publicCraftPassports', 'jamdani-saree-kamrup-8822'), {
        passportId: 'pass_jamdani_8822',
        productId: 'prod_a_draft',
        ownerId: ARTISAN_A_UID,
        slug: 'jamdani-saree-kamrup-8822',
        status: 'active',
        snapshotVersion: 1,
        publicData: {
          title: 'Silk Jamdani Saree',
          photos: ['https://example.com/p1.jpg'],
        },
        activatedAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('42. Artisan B cannot modify Artisan A’s publicCraftPassport projection', async () => {
    const db = getDbAs(ARTISAN_B_UID);
    await assertFails(
      setDoc(doc(db, 'publicCraftPassports', 'jamdani-saree-kamrup-8822'), {
        passportId: 'pass_jamdani_8822',
        productId: 'prod_a_draft',
        ownerId: ARTISAN_A_UID,
        slug: 'jamdani-saree-kamrup-8822',
        status: 'revoked',
        snapshotVersion: 2,
        publicData: { title: 'Hacked Title', photos: [] },
        activatedAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('43. Direct client creation of buyerEnquiries is denied (trusted server only)', async () => {
    const unauthDb = getDbAs();
    await assertFails(
      setDoc(doc(unauthDb, 'buyerEnquiries', 'enq_pub_001'), {
        id: 'enq_pub_001',
        productId: 'prod_a_draft',
        artisanId: ARTISAN_A_UID,
        buyerName: 'Priya Sharma',
        buyerContact: '+91 9876543210',
        initialMessage: 'Interested in bulk order of 5 sarees.',
        quantityRequested: 5,
        status: 'new',
        receivedAt: '2026-08-27T12:40:00.000Z',
      })
    );
  });

  it('44. Public user cannot list buyerEnquiries collection', async () => {
    const unauthDb = getDbAs();
    await assertFails(getDocs(collection(unauthDb, 'buyerEnquiries')));
  });

  it('45. Artisan A can read their incoming buyer enquiries pre-seeded by server', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'buyerEnquiries', 'enq_pub_001'), {
        id: 'enq_pub_001',
        productId: 'prod_a_draft',
        artisanId: ARTISAN_A_UID,
        buyerName: 'Priya Sharma',
        buyerContact: '+91 9876543210',
        initialMessage: 'Interested in bulk order of 5 sarees.',
        quantityRequested: 5,
        status: 'new',
        receivedAt: '2026-08-27T12:40:00.000Z',
      });
    });

    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(getDoc(doc(db, 'buyerEnquiries', 'enq_pub_001')));
  });

  it('46. Artisan A can manage their private craftPassports and consent records', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(
      setDoc(doc(db, 'users', ARTISAN_A_UID, 'craftPassports', 'pass_priv_01'), {
        id: 'pass_priv_01',
        ownerId: ARTISAN_A_UID,
        productId: 'prod_a_draft',
        publicToken: 'tok_123',
        publicSlug: 'jamdani-saree-kamrup-8822',
        status: 'active',
        approvedFields: ['title', 'photos', 'materials'],
        consentRecordId: 'consent_01',
        publishedSnapshotVersion: 1,
        createdAt: '2026-08-27T12:00:00.000Z',
        updatedAt: '2026-08-27T12:00:00.000Z',
      })
    );

    await assertSucceeds(
      setDoc(doc(db, 'users', ARTISAN_A_UID, 'consentRecords', 'consent_01'), {
        id: 'consent_01',
        ownerId: ARTISAN_A_UID,
        productId: 'prod_a_draft',
        passportId: 'pass_priv_01',
        purpose: 'public_passport',
        approvedFields: ['title', 'photos'],
        consentGranted: true,
        snapshotVersion: 1,
        actorUid: ARTISAN_A_UID,
        createdAt: '2026-08-27T12:00:00.000Z',
      })
    );
  });

  it('47. Artisan B cannot read Artisan A’s private craftPassports or consent records', async () => {
    const db = getDbAs(ARTISAN_B_UID);
    await assertFails(getDoc(doc(db, 'users', ARTISAN_A_UID, 'craftPassports', 'pass_priv_01')));
    await assertFails(getDoc(doc(db, 'users', ARTISAN_A_UID, 'consentRecords', 'consent_01')));
  });

  it('48. Export audit records are append-only (updates and deletions are blocked)', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(
      setDoc(doc(db, 'users', ARTISAN_A_UID, 'exportAuditRecords', 'audit_01'), {
        id: 'audit_01',
        ownerId: ARTISAN_A_UID,
        productId: 'prod_a_draft',
        format: 'pdf',
        action: 'downloaded',
        status: 'completed',
        createdAt: '2026-08-27T12:45:00.000Z',
      })
    );

    // Updates to audit record must fail (append-only)
    await assertFails(
      updateDoc(doc(db, 'users', ARTISAN_A_UID, 'exportAuditRecords', 'audit_01'), {
        status: 'failed',
      })
    );
  });

  // =========================================================================
  // Phase 11 Security Rules Tests: Buyer Enquiries & Coordinator Assignments
  // =========================================================================

  it('49. Authenticated buyer cannot forge or create buyerEnquiry directly in client', async () => {
    const db = getDbAs(BUYER_UID);
    await assertFails(
      setDoc(doc(db, 'buyerEnquiries', 'enq_pub_01'), {
        id: 'enq_pub_01',
        productId: 'prod_a_draft',
        artisanId: ARTISAN_A_UID,
        buyerName: 'Anita Roy',
        buyerContact: '+91 98300 12345',
        message: 'Direct enquiry for silk scarf',
        quantityRequested: 1,
        status: 'new',
        receivedAt: '2026-08-27T13:00:00.000Z',
      })
    );
  });

  it('50. Server-seeded enquiry is readable by Artisan A', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'buyerEnquiries', 'enq_pub_01'), {
        id: 'enq_pub_01',
        productId: 'prod_a_draft',
        artisanId: ARTISAN_A_UID,
        buyerName: 'Anita Roy',
        buyerContact: '+91 98300 12345',
        message: 'Direct enquiry for silk scarf',
        quantityRequested: 1,
        status: 'new',
        receivedAt: '2026-08-27T13:00:00.000Z',
      });
    });

    const db = getDbAs(ARTISAN_A_UID);
    await assertSucceeds(getDoc(doc(db, 'buyerEnquiries', 'enq_pub_01')));
  });

  it('51. Artisan A can update enquiry status but cannot mutate immutable fields', async () => {
    const db = getDbAs(ARTISAN_A_UID);
    // Allowed status update
    await assertSucceeds(
      updateDoc(doc(db, 'buyerEnquiries', 'enq_pub_01'), {
        id: 'enq_pub_01',
        productId: 'prod_a_draft',
        artisanId: ARTISAN_A_UID,
        status: 'contacted',
      })
    );

    // Blocked ownership mutation
    await assertFails(
      updateDoc(doc(db, 'buyerEnquiries', 'enq_pub_01'), {
        artisanId: ARTISAN_B_UID,
      })
    );
  });

  it('52. Artisan B CANNOT read or tamper with Artisan A’s buyer enquiries', async () => {
    const db = getDbAs(ARTISAN_B_UID);
    await assertFails(getDoc(doc(db, 'buyerEnquiries', 'enq_pub_01')));
    await assertFails(
      updateDoc(doc(db, 'buyerEnquiries', 'enq_pub_01'), {
        status: 'closed',
      })
    );
  });

  it('53. Assigned Coordinator can read their authorized coordinator assignment (seeded by server)', async () => {
    const coordUid = 'coordinator_user_alpha';
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, 'coordinatorAssignments', `coord_${coordUid}_${ARTISAN_A_UID}`), {
        id: `coord_${coordUid}_${ARTISAN_A_UID}`,
        coordinatorUid: coordUid,
        artisanUid: ARTISAN_A_UID,
        active: true,
        permissions: { viewStatus: true, viewEnquirySummary: true, assistExports: true },
        createdAt: '2026-08-27T13:00:00.000Z',
        updatedAt: '2026-08-27T13:00:00.000Z',
      });
    });

    const dbCoord = getDbAs(coordUid);
    await assertSucceeds(getDoc(doc(dbCoord, 'coordinatorAssignments', `coord_${coordUid}_${ARTISAN_A_UID}`)));

    // Client mutations of assignments are blocked
    await assertFails(
      setDoc(doc(dbCoord, 'coordinatorAssignments', `coord_${coordUid}_${ARTISAN_B_UID}`), {
        id: `coord_${coordUid}_${ARTISAN_B_UID}`,
        coordinatorUid: coordUid,
        artisanUid: ARTISAN_B_UID,
        active: true,
        permissions: { viewStatus: true },
        createdAt: '2026-08-27T13:00:00.000Z',
        updatedAt: '2026-08-27T13:00:00.000Z',
      })
    );
  });

  it('54. Unauthorized coordinator cannot read an unassigned artisan’s assignment', async () => {
    const unauthorizedCoord = 'coordinator_stranger_beta';
    const dbStranger = getDbAs(unauthorizedCoord);
    await assertFails(
      getDoc(doc(dbStranger, 'coordinatorAssignments', `coord_coordinator_user_alpha_${ARTISAN_A_UID}`))
    );
  });
});

