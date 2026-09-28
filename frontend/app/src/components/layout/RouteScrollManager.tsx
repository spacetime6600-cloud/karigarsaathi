import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const ROUTE_TITLES: Record<string, string> = {
  '/': 'KarigarSaathi | Living Craft Heritage & Provenance',
  '/about': 'KarigarSaathi | About Us & Artisan Mission',
  '/marketplace': 'KarigarSaathi | Marketplace & Direct Artisan Crafts',
  '/reviews': 'KarigarSaathi | Buyer Reviews & Craft Testimonials',
  '/language': 'KarigarSaathi | Choose Language',
  '/login': 'KarigarSaathi | Artisan & Coordinator Sign In',
  '/sign-in': 'KarigarSaathi | Artisan & Coordinator Sign In',
  '/artisan/dashboard': 'KarigarSaathi | Artisan Workspace & Sales',
  '/artisan/inventory': 'KarigarSaathi | Inventory & Craft Catalogue',
  '/artisan/enquiries': 'KarigarSaathi | Buyer Enquiries & Inbox',
  '/coordinator': 'KarigarSaathi | Field Coordinator Portal',
  '/coordinator/artisans': 'KarigarSaathi | Assigned Artisans Directory',
  '/coordinator/reviews': 'KarigarSaathi | Product Review Pipeline',
  '/coordinator/enquiries': 'KarigarSaathi | Buyer Enquiry Assistance',
  '/coordinator/sales': 'KarigarSaathi | Sales Performance & Exports',
  '/coordinator/settings': 'KarigarSaathi | Coordinator Workspace Settings',
  '/coordinator/incomplete': 'KarigarSaathi | Incomplete Drafts Assistance',
  '/coordinator/exports': 'KarigarSaathi | Batch Marketplace Exports',
  '/dev/states': 'KarigarSaathi | State Recovery Harness',
};

// In-memory scroll position map keyed by location key and pathname
const scrollPositionCache = new Map<string, { x: number; y: number }>();

export const RouteScrollManager: React.FC = () => {
  const location = useLocation();
  const navigationType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'
  const { pathname, search, hash, key } = location;

  const prevPathnameRef = useRef<string>(pathname);
  const prevKeyRef = useRef<string>(key);

  // Set browser scroll restoration to manual so the app controls restoration without jitter
  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      try {
        window.history.scrollRestoration = 'manual';
      } catch {
        // Safe fallback
      }
    }
  }, []);

  // Continuously record scroll position for the active page before navigation occurs
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentKey = prevKeyRef.current || 'default';
        const currentPath = prevPathnameRef.current;
        const pos = { x: window.scrollX, y: window.scrollY };
        scrollPositionCache.set(currentKey, pos);
        scrollPositionCache.set(currentPath, pos);
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    // 1. Update document title
    let matchedTitle = ROUTE_TITLES[pathname];

    if (!matchedTitle) {
      if (pathname.startsWith('/marketplace/products/')) {
        matchedTitle = 'KarigarSaathi | Handcrafted Piece Details';
      } else if (pathname.startsWith('/artisan/products/new/')) {
        matchedTitle = 'KarigarSaathi | Add New Product Listing';
      } else if (pathname.startsWith('/artisan/enquiries/') || pathname.startsWith('/enquiries/')) {
        matchedTitle = 'KarigarSaathi | Buyer Enquiry Thread';
      } else if (pathname.startsWith('/passport/') || pathname.startsWith('/p/')) {
        matchedTitle = 'KarigarSaathi | Verified Digital Craft Passport';
      } else if (pathname.startsWith('/coordinator/artisans/')) {
        matchedTitle = 'KarigarSaathi | Assigned Artisan Profile';
      } else if (pathname.startsWith('/coordinator/enquiries/')) {
        matchedTitle = 'KarigarSaathi | Coordinator Enquiry Review';
      } else {
        matchedTitle = 'KarigarSaathi | Artisan Digitisation Platform';
      }
    }

    document.title = matchedTitle;

    // 2. Hash anchor navigation (e.g. #how-it-works, #features, #craft-map)
    if (hash) {
      const targetId = hash.replace(/^#/, '');
      const timer = setTimeout(() => {
        const targetElement =
          document.getElementById(targetId) ||
          (targetId === 'craft-map' ? document.getElementById('craft-map-section') : null);
        if (targetElement && typeof targetElement.scrollIntoView === 'function') {
          try {
            const prefersReducedMotion =
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            targetElement.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
            });
          } catch {
            // Safe fallback
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    }

    const isSamePageInteraction = pathname === prevPathnameRef.current;

    // 3. Tab, query parameter, or in-page modal change: DO NOT reset scroll
    if (isSamePageInteraction) {
      // User clicked a tab (?tab=...), changed a query param, or interacted with an in-page control
      // Maintain scroll position unchanged
      prevKeyRef.current = key;
      return;
    }

    // 4. Back/Forward Navigation ('POP'): Restore previous scroll position where practical
    if (navigationType === 'POP') {
      const savedPos = scrollPositionCache.get(key) || scrollPositionCache.get(pathname);
      if (savedPos && typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({
            top: savedPos.y,
            left: savedPos.x,
            behavior: 'instant',
          });
        } catch {
          // Safe fallback for test environments
        }
      }
    } else {
      // 5. Normal Forward Navigation ('PUSH'): Scroll to top
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } catch {
          // Safe fallback for test environments
        }
      }
    }

    // 6. Move accessibility focus to main content without forced scrolling
    const mainContent = document.getElementById('main-content');
    if (mainContent && typeof mainContent.focus === 'function') {
      try {
        mainContent.focus({ preventScroll: true });
      } catch {
        // Safe fallback
      }
    }

    prevPathnameRef.current = pathname;
    prevKeyRef.current = key;
  }, [pathname, search, hash, key, navigationType]);

  return null;
};
