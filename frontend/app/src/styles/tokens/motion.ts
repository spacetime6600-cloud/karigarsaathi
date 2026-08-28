/**
 * KarigarSaathi Motion Tokens
 * Standardized durations and easing curves for high-performance,
 * accessible micro-interactions (transform + opacity only).
 */

export const MOTION_TOKENS = {
  duration: {
    /** Button hover, press, quick toggles (120–180ms) */
    interaction: '150ms',
    /** Dropdown menus, tooltips, popovers (160–220ms) */
    popover: '180ms',
    /** Modals, slide-out drawers, full overlays (180–260ms) */
    overlay: '220ms',
    /** Route content transitions (150–220ms) */
    route: '180ms',
    /** Below-the-fold public section reveals (250–400ms) */
    reveal: '320ms',
  },
  easing: {
    /** Standard smooth deceleration for entering elements */
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)',
    /** Subtle acceleration for exiting elements */
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
  },
  distance: {
    /** Subtle arrow slide on hover */
    arrowSlide: '3px',
    /** Subtle section entrance lift */
    sectionReveal: '12px',
    /** Dropdown slight scale origin */
    dropdownScale: '0.98',
  },
} as const;
