import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

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
  '/coordinator/incomplete': 'KarigarSaathi | Incomplete Drafts Assistance',
  '/coordinator/exports': 'KarigarSaathi | Batch Marketplace Exports',
  '/dev/states': 'KarigarSaathi | State Recovery Harness',
};

export const RouteScrollManager: React.FC = () => {
  const { pathname, search, hash } = useLocation();
  const prevPathnameRef = useRef<string>('');

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
      } else {
        matchedTitle = 'KarigarSaathi | Artisan Digitisation Platform';
      }
    }

    document.title = matchedTitle;

    // 2. Handle scroll restoration & hash anchor navigation
    if (hash) {
      // Allow slight tick for element mounting
      const targetId = hash.replace(/^#/, '');
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(targetId) || 
          (targetId === 'craft-map' ? document.getElementById('craft-map-section') : null);
        if (targetElement && typeof targetElement.scrollIntoView === 'function') {
          try {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          } catch {
            // Safe fallback for environments lacking smooth scroll
          }
        }
      }, 50);
      return () => clearTimeout(timer);
    } else if (pathname !== prevPathnameRef.current) {
      // Only scroll to top if pathname changed (do not scroll on filter query update)
      if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        } catch {
          // Safe fallback
        }
      }

      // Move accessibility focus to main content
      const mainContent = document.getElementById('main-content');
      if (mainContent && typeof mainContent.focus === 'function') {
        mainContent.focus({ preventScroll: true });
      }
    }

    prevPathnameRef.current = pathname;
  }, [pathname, search, hash]);

  return null;
};
