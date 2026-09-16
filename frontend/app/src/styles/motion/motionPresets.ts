/**
 * KarigarSaathi — Centralized Motion System & Animation Presets
 * Authoritative motion tokens, cubic-bezier easings, duration constants,
 * and class helpers for calm, subtle, and accessible UI transitions.
 */

export const MOTION_TOKENS = {
  // Durations in milliseconds
  duration: {
    instant: 0,
    interaction: 150,
    popover: 180,
    dialog: 200,
    page: 220,
    step: 220,
    reveal: 320,
  },
  // Canonical Cubic-Bezier Easings
  easing: {
    standard: 'cubic-bezier(0.22, 1, 0.36, 1)', // Smooth ease-out with gentle deceleration
    exit: 'cubic-bezier(0.4, 0, 1, 1)',
    springSubtle: 'cubic-bezier(0.16, 1, 0.3, 1)',
  },
  // Spatial Displacement (Pixels)
  displacement: {
    subtleY: 8,  // 8px vertical route / section entrance
    subtleX: 10, // 10px horizontal step direction
    cardLift: -2, // -2px hover lift for interactive cards
  },
} as const;

export const MOTION_CLASSES = {
  // Page level route transitions
  pageEnter: 'page-transition-enter motion-reduce:animate-none',
  
  // Directional step transitions
  stepForward: 'step-forward-enter motion-reduce:animate-none',
  stepBackward: 'step-backward-enter motion-reduce:animate-none',
  
  // Interactive Controls
  button: 'transition-all duration-150 ease-out active:scale-[0.985] motion-reduce:transform-none motion-reduce:transition-none select-none',
  cardInteractive: 'transition-all duration-180 ease-out hover:-translate-y-0.5 active:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none cursor-pointer',
  
  // Overlay & Menus
  popover: 'motion-popover-enter motion-reduce:animate-none origin-top-right',
  dialog: 'motion-dialog-enter motion-reduce:animate-none',
  dialogBackdrop: 'motion-fade-enter motion-reduce:animate-none',
  
  // Media Fade In
  fadeIn: 'motion-fade-enter motion-reduce:animate-none',
} as const;
