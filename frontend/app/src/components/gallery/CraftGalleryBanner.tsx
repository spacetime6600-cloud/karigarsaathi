import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

// Craft Images from local assets
import potteryImg from '@/assets/marketplace/craft-category-pottery.jpg';
import textilesImg from '@/assets/marketplace/craft-category-textiles.jpg';
import woodcraftImg from '@/assets/marketplace/craft-category-woodcraft.jpg';
import caneImg from '@/assets/marketplace/craft-category-cane.jpg';
import metalworkImg from '@/assets/marketplace/craft-category-metalwork.jpg';
import paintingImg from '@/assets/marketplace/craft-category-painting.jpg';
import loomImg from '@/assets/marketplace/craft-story-loom.jpg';
import madhubaniImg from '@/assets/craft-regions/bihar-madhubani-hero.jpg';

export interface CraftGalleryItem {
  id: string;
  title: string;
  craftType: string;
  image: string;
  alt: string;
  focalPosition?: string;
}

const CRAFT_GALLERY_ITEMS: CraftGalleryItem[] = [
  {
    id: 'pottery',
    title: 'Terracotta Pottery',
    craftType: 'Clay & Terracotta Clusters',
    image: potteryImg,
    alt: 'Master artisan hand-shaping raw clay on a traditional potter’s wheel',
    focalPosition: 'center',
  },
  {
    id: 'textiles',
    title: 'Handloom Silk Weaving',
    craftType: 'Mulberry & Tussar Silk Weaving',
    image: textilesImg,
    alt: 'Traditional handloom weaver interlacing pure dyed silk threads with wooden shuttle',
    focalPosition: 'center',
  },
  {
    id: 'woodcraft',
    title: 'Sheesham Wood Carving',
    craftType: 'Intricate Carved Woodcraft',
    image: woodcraftImg,
    alt: 'Artisan hand-carving detailed floral motifs into seasoned sheesham timber',
    focalPosition: 'center',
  },
  {
    id: 'cane',
    title: 'Cane & Bamboo Basketry',
    craftType: 'Natural Fiber Handcraft',
    image: caneImg,
    alt: 'Handwoven natural cane and bamboo basketry crafted by indigenous artisans',
    focalPosition: 'center',
  },
  {
    id: 'metalwork',
    title: 'Dhokra & Bell Metalwork',
    craftType: 'Lost-Wax Heritage Casting',
    image: metalworkImg,
    alt: 'Traditional lost-wax brass and bell metal casting with textured figurines',
    focalPosition: 'center',
  },
  {
    id: 'painting',
    title: 'Traditional Folk Painting',
    craftType: 'Natural Mineral Pigments',
    image: paintingImg,
    alt: 'Artisan applying natural pigment brushwork to handmade folklore canvas',
    focalPosition: 'center',
  },
  {
    id: 'loom',
    title: 'Heritage Loom Weaving',
    craftType: 'Handloom Heritage',
    image: loomImg,
    alt: 'Detailed view of an active wooden handloom structure with vibrant woven warp and weft',
    focalPosition: 'center',
  },
  {
    id: 'madhubani',
    title: 'Mithila Madhubani Art',
    craftType: 'Bihar Craft Heritage',
    image: madhubaniImg,
    alt: 'Intricate traditional Madhubani hand-painted mural with sacred geometric nature motifs',
    focalPosition: 'center',
  },
];

const AUTOPLAY_INTERVAL = 4500; // 4.5 seconds per slide
const TRANSITION_DURATION = 750; // 750ms smooth transition

export const CraftGalleryBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isOffscreen, setIsOffscreen] = useState(false);
  const [isDocumentHidden, setIsDocumentHidden] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(3); // 3 desktop, 2 tablet, 1 mobile

  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const totalItems = CRAFT_GALLERY_ITEMS.length;

  // Cloned buffer tail to guarantee seamless infinite wrapping without reverse rewind
  const extendedItems = useMemo(() => {
    return [...CRAFT_GALLERY_ITEMS, ...CRAFT_GALLERY_ITEMS.slice(0, 4)];
  }, []);

  // Update visible items count based on responsive breakpoint
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setVisibleCount(1);
      } else if (width < 1024) {
        setVisibleCount(2);
      } else {
        setVisibleCount(3);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect prefers-reduced-motion
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    try {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      if (mediaQuery.matches) {
        setIsPlaying(false);
      }

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
        if (e.matches) {
          setIsPlaying(false);
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
    } catch {
      // Fallback in environments without full matchMedia
    }
  }, []);

  // IntersectionObserver to pause when offscreen
  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;

    try {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsOffscreen(!entry.isIntersecting);
        },
        { threshold: 0.15 }
      );

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    } catch {
      // Safe fallback if IntersectionObserver is not implemented
    }
  }, []);

  // Page visibility change handler
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const handleVisibilityChange = () => {
      setIsDocumentHidden(document.visibilityState === 'hidden');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!isTransitioning) setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [isTransitioning]);

  const handlePrev = useCallback(() => {
    if (currentIndex === 0) {
      // Seamless wrap backward to totalItems - 1
      setIsTransitioning(false);
      setCurrentIndex(totalItems);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setCurrentIndex(totalItems - 1);
        });
      });
    } else {
      if (!isTransitioning) setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex, isTransitioning, totalItems]);

  // Seamless jump from clone tail back to index 0 after transition completes
  useEffect(() => {
    if (currentIndex >= totalItems) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setCurrentIndex(0);
      }, TRANSITION_DURATION);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, totalItems]);

  // Autoplay ticker
  useEffect(() => {
    const canAutoplay =
      isPlaying &&
      !isHovered &&
      !isFocused &&
      !isOffscreen &&
      !isDocumentHidden &&
      !prefersReducedMotion;

    if (!canAutoplay) return;

    const interval = setInterval(() => {
      handleNext();
    }, AUTOPLAY_INTERVAL);

    return () => clearInterval(interval);
  }, [
    isPlaying,
    isHovered,
    isFocused,
    isOffscreen,
    isDocumentHidden,
    prefersReducedMotion,
    handleNext,
  ]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setIsPlaying(false);
      handleNext();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setIsPlaying(false);
      handlePrev();
    }
  };

  // Touch swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current !== null && touchEndXRef.current !== null) {
      const diffX = touchStartXRef.current - touchEndXRef.current;
      const minSwipeDistance = 45;

      if (diffX > minSwipeDistance) {
        // Swiped left -> Next
        setIsPlaying(false);
        handleNext();
      } else if (diffX < -minSwipeDistance) {
        // Swiped right -> Prev
        setIsPlaying(false);
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };


  return (
    <section
      ref={containerRef}
      aria-label="Artisan craft traditions photographic exhibition"
      aria-roledescription="carousel"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative rounded-3xl overflow-hidden border border-[#001D36]/10 shadow-xs bg-[#001D36] select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB955] h-60 sm:h-72 lg:h-84 w-full group"
    >
      {/* Sliding Seamless Multi-Item Track (Zero Gaps) */}
      <div
        className="flex h-full w-full"
        style={{
          transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
          transition:
            isTransitioning && !prefersReducedMotion
              ? `transform ${TRANSITION_DURATION}ms cubic-bezier(0.25, 1, 0.5, 1)`
              : 'none',
        }}
      >
        {extendedItems.map((item, index) => {
          const isClone = index >= totalItems;
          const isCurrentlyVisible =
            index >= currentIndex && index < currentIndex + visibleCount;

          return (
            <div
              key={`${item.id}-${index}`}
              aria-hidden={!isCurrentlyVisible || isClone}
              className="relative h-full shrink-0 overflow-hidden bg-[#001424]"
              style={{
                width: `${100 / visibleCount}%`,
              }}
            >
              {/* Craft Photograph */}
              <img
                src={item.image}
                alt={item.alt}
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
                className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-700 group-hover:scale-[1.02]"
                style={{ objectPosition: item.focalPosition || 'center' }}
              />

              {/* Bottom Legibility Gradient */}
              <div
                className="absolute inset-x-0 bottom-0 h-28 pointer-events-none"
                style={{
                  background:
                    'linear-gradient(180deg, rgba(0, 29, 54, 0) 0%, rgba(0, 29, 54, 0.35) 45%, rgba(0, 29, 54, 0.85) 100%)',
                }}
              />

              {/* Tiny Bottom-Left Caption */}
              <div className="absolute bottom-3 sm:bottom-4 left-3.5 sm:left-5 right-3.5 pointer-events-none flex flex-col text-white">
                <span className="text-xs sm:text-sm lg:text-base font-bold tracking-tight text-white drop-shadow-sm truncate font-sans">
                  {item.title}
                </span>
                <span className="text-[11px] sm:text-xs text-white/80 font-medium drop-shadow-xs truncate mt-0.5">
                  {item.craftType}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
