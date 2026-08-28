import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { assertFails, assertSucceeds, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { getTestEnvironment } from './test-environment';
import { ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';

describe('Cloud Storage Security Rules Suite — Deny-by-Default & Photo Isolation', () => {
  let testEnv: RulesTestEnvironment;

  const ARTISAN_A_UID = 'artisan_a_123';
  const ARTISAN_B_UID = 'artisan_b_456';
  const PRODUCT_A_ID = 'prod_a_101';
  const PRODUCT_B_ID = 'prod_b_202';

  const validJpegBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
  const validPngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const validWebpBytes = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);
  const emptyBytes = new Uint8Array(0);

  beforeAll(async () => {
    testEnv = await getTestEnvironment();
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearStorage();

    // Pre-seed Artisan A's photo using admin context (security rules bypassed)
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const storage = context.storage();
      const photoRef = ref(
        storage,
        `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_01.jpg`
      );
      await uploadBytes(photoRef, validJpegBytes, {
        contentType: 'image/jpeg',
        customMetadata: {
          ownerId: ARTISAN_A_UID,
          productId: PRODUCT_A_ID,
        },
      });
    });
  });

  const getStorageAs = (uid?: string) => {
    return uid
      ? testEnv.authenticatedContext(uid, { email: `${uid}@example.com` }).storage()
      : testEnv.unauthenticatedContext().storage();
  };

  // =========================================================================
  // 1. Permitted Uploads & Formats
  // =========================================================================
  it('1. Artisan A can upload a valid JPEG to their own path', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_jpeg.jpg`);
    await assertSucceeds(
      uploadBytes(photoRef, validJpegBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('2. Artisan A can upload a valid PNG to their own path', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_png.png`);
    await assertSucceeds(
      uploadBytes(photoRef, validPngBytes, {
        contentType: 'image/png',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('3. Artisan A can upload a valid WebP to their own path', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_webp.webp`);
    await assertSucceeds(
      uploadBytes(photoRef, validWebpBytes, {
        contentType: 'image/webp',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  // =========================================================================
  // 2. Cross-User Isolation & Completion Gate
  // =========================================================================
  it('4. Artisan A cannot upload to Artisan B’s path', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_B_UID}/products/${PRODUCT_B_ID}/originals/photo_hack.jpg`);
    await assertFails(
      uploadBytes(photoRef, validJpegBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_B_UID, productId: PRODUCT_B_ID },
      })
    );
  });

  it('5. Artisan B cannot read Artisan A’s original photograph', async () => {
    const storage = getStorageAs(ARTISAN_B_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_01.jpg`);
    await assertFails(getBytes(photoRef));
  });

  // Explicit completion-gate named test
  it('artisan B cannot download artisan A original photograph', async () => {
    const storage = getStorageAs(ARTISAN_B_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_01.jpg`);
    await assertFails(getBytes(photoRef));
  });

  it('6. Artisan B cannot update Artisan A’s photograph', async () => {
    const storage = getStorageAs(ARTISAN_B_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_01.jpg`);
    await assertFails(
      uploadBytes(photoRef, validJpegBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('7. Artisan B cannot delete Artisan A’s photograph', async () => {
    const storage = getStorageAs(ARTISAN_B_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_01.jpg`);
    await assertFails(deleteObject(photoRef));
  });

  it('8. Unauthenticated users cannot upload originals', async () => {
    const storage = getStorageAs();
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/unauth.jpg`);
    await assertFails(
      uploadBytes(photoRef, validJpegBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('9. Unauthenticated users cannot download originals', async () => {
    const storage = getStorageAs();
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_01.jpg`);
    await assertFails(getBytes(photoRef));
  });

  // =========================================================================
  // 3. Payload & File Format Restrictions
  // =========================================================================
  it('10. Empty uploads are rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/empty.jpg`);
    await assertFails(
      uploadBytes(photoRef, emptyBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('11. Files over 10 MiB are rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/huge.jpg`);
    const hugeBytes = new Uint8Array(10.5 * 1024 * 1024);
    await assertFails(
      uploadBytes(photoRef, hugeBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('12. SVG is rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/image.svg`);
    const svgBytes = new TextEncoder().encode('<svg><circle r="10"/></svg>');
    await assertFails(
      uploadBytes(photoRef, svgBytes, {
        contentType: 'image/svg+xml',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('13. GIF is rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/anim.gif`);
    const gifBytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    await assertFails(
      uploadBytes(photoRef, gifBytes, {
        contentType: 'image/gif',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('14. PDF is rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/doc.pdf`);
    const pdfBytes = new TextEncoder().encode('%PDF-1.4');
    await assertFails(
      uploadBytes(photoRef, pdfBytes, {
        contentType: 'application/pdf',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('15. HTML is rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/page.html`);
    const htmlBytes = new TextEncoder().encode('<html><body>Test</body></html>');
    await assertFails(
      uploadBytes(photoRef, htmlBytes, {
        contentType: 'text/html',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('16. Executable content types are rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/app.exe`);
    const exeBytes = new Uint8Array([0x4d, 0x5a]);
    await assertFails(
      uploadBytes(photoRef, exeBytes, {
        contentType: 'application/octet-stream',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('17. Missing content type is rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/no_type.jpg`);
    await assertFails(
      uploadBytes(photoRef, validJpegBytes, {
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('18. Invalid ownership metadata is rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_bad_owner.jpg`);
    await assertFails(
      uploadBytes(photoRef, validJpegBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_B_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('19. Invalid product metadata is rejected', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_bad_prod.jpg`);
    await assertFails(
      uploadBytes(photoRef, validJpegBytes, {
        contentType: 'image/jpeg',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: 'wrong_prod_id' },
      })
    );
  });

  it('20. Unknown Storage paths are denied', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const rootRef = ref(storage, 'public_uploads/photo.jpg');
    await assertFails(
      uploadBytes(rootRef, validJpegBytes, {
        contentType: 'image/jpeg',
      })
    );
  });

  it('21. The owner can delete their own photograph', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/originals/photo_01.jpg`);
    await assertSucceeds(deleteObject(photoRef));
  });

  // =========================================================================
  // 4. Phase 9 Display Copy Storage Rules & Isolation
  // =========================================================================
  it('22. Artisan A can upload a processed display copy to /display/ path', async () => {
    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/display/photo_display.webp`);
    await assertSucceeds(
      uploadBytes(photoRef, validWebpBytes, {
        contentType: 'image/webp',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('23. Artisan B cannot read Artisan A’s display photograph', async () => {
    const storage = getStorageAs(ARTISAN_B_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/display/photo_display.webp`);
    await assertFails(getBytes(photoRef));
  });

  it('24. Artisan B cannot upload to Artisan A’s display path', async () => {
    const storage = getStorageAs(ARTISAN_B_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/display/hacked_display.webp`);
    await assertFails(
      uploadBytes(photoRef, validWebpBytes, {
        contentType: 'image/webp',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      })
    );
  });

  it('25. Artisan A can delete their own display photograph', async () => {
    // First seed display photo
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const s = context.storage();
      const pRef = ref(s, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/display/photo_del.webp`);
      await uploadBytes(pRef, validWebpBytes, {
        contentType: 'image/webp',
        customMetadata: { ownerId: ARTISAN_A_UID, productId: PRODUCT_A_ID },
      });
    });

    const storage = getStorageAs(ARTISAN_A_UID);
    const photoRef = ref(storage, `users/${ARTISAN_A_UID}/products/${PRODUCT_A_ID}/display/photo_del.webp`);
    await assertSucceeds(deleteObject(photoRef));
  });
});
