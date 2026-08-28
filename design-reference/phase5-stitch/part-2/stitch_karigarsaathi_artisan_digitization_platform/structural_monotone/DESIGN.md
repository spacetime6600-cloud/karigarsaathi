---
name: Structural Monotone
colors:
  surface: '#f6f9ff'
  surface-dim: '#d6dae0'
  surface-bright: '#f6f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f4fa'
  surface-container: '#eaeef4'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#dfe3e9'
  on-surface: '#171c20'
  on-surface-variant: '#45464c'
  inverse-surface: '#2c3136'
  inverse-on-surface: '#edf1f7'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#575e70'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#141b2b'
  on-primary-container: '#7d8497'
  inverse-primary: '#c0c6db'
  secondary: '#555f6d'
  on-secondary: '#ffffff'
  secondary-container: '#d6e0f1'
  on-secondary-container: '#596372'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#261906'
  on-tertiary-container: '#968065'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce2f7'
  primary-fixed-dim: '#c0c6db'
  on-primary-fixed: '#141b2b'
  on-primary-fixed-variant: '#404758'
  secondary-fixed: '#d9e3f4'
  secondary-fixed-dim: '#bdc7d8'
  on-secondary-fixed: '#121c28'
  on-secondary-fixed-variant: '#3e4755'
  tertiary-fixed: '#f9debf'
  tertiary-fixed-dim: '#dcc2a4'
  on-tertiary-fixed: '#261906'
  on-tertiary-fixed-variant: '#55442d'
  background: '#f6f9ff'
  on-background: '#171c20'
  surface-variant: '#dfe3e9'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 30px
  body-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  label-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  status-label:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
  touch-target-min: 48px
---

## Brand & Style

The design system is a utility-first, high-contrast framework built for clarity and functional directness. It adopts a **Minimalist-Brutalist** hybrid aesthetic, stripping away all decorative elements to focus entirely on information hierarchy and task completion. 

The visual language is "Wireframe-plus"—it looks like a blueprint but functions with the robustness of a production system. By using a strictly grayscale palette, the UI removes cognitive load associated with color-coding, relying instead on weight, scale, and clear iconography to guide the user. The interface is designed to feel honest, sturdy, and accessible.

## Colors

This design system uses a strict grayscale palette to enforce hierarchy. There are no semantic colors (red/green/yellow); all statuses and states must be communicated via text labels, icons, or high-contrast weight changes.

- **Background:** Always `#FFFFFF` to ensure maximum contrast for text.
- **Surface/Low Contrast:** `#F3F4F6` for disabled states, secondary backgrounds, or subtle grouping.
- **Mid-Tone:** `#D1D5DB` for borders, dividers, and inactive icons.
- **Secondary Text/UI:** `#4B5563` for supporting information and captions.
- **Primary/High Contrast:** `#111827` for all primary text, active states, and dominant actions.

## Typography

The typography uses **Inter** for its exceptional legibility and neutral tone. To accommodate a wide range of users, the base body size starts at **18px**. 

Hierarchy is established through extreme weight variance. All interactive elements use bold or semi-bold weights to distinguish them from static content. For mobile devices, large headlines scale down slightly to ensure they do not break layout boundaries, but remain the dominant focal point.

## Layout & Spacing

The layout philosophy follows a **Restrained Fluid Grid**. On desktop, the interface uses a 12-column grid with generous margins to prevent the UI from feeling "dense." On mobile, it collapses into a single-column stack.

- **Vertical Rhythm:** A strict 8px baseline grid is used. Spacing between sections should be 48px or 64px to maintain an "unrefined" but organized feel.
- **Side Navigation:** On desktop, the navigation is a fixed-width (280px) sidebar with minimal ornamentation.
- **Header:** Contains the logo, global search, and a prominent language selector.
- **Constraint:** Dashboards are prohibited. Data should be presented in linear, scrollable lists or step-by-step wizards.

## Elevation & Depth

This design system avoids shadows and blurs entirely. Depth is communicated through **Tonal Layering** and **High-Contrast Outlines**.

- **Level 0 (Background):** White (#FFFFFF).
- **Level 1 (Containers):** Light Gray (#F3F4F6) with a 2px solid border (#111827).
- **Interactive Depth:** Instead of "lifting" a card with a shadow, use a thick 4px black border on hover or focus to simulate physical presence.
- **Separation:** Horizontal rules (2px solid #D1D5DB) are used to separate list items and logical sections.

## Shapes

The shape language is strictly **Sharp (0px)**. All containers, buttons, and input fields must have square corners. This reinforces the "structural" and "wireframe" aesthetic, emphasizing the professional and utility-driven nature of the application. High-contrast 2px or 3px borders are the primary method for defining shape boundaries.

## Components

### Buttons & Actions
- **Primary Button:** Solid Black (#111827) background, White (#FFFFFF) text. Min-height: 56px.
- **Secondary Button:** White background, 2px Solid Black border. Min-height: 56px.
- **Focus State:** 4px high-contrast dashed outline with 4px offset.
- **Rule:** Only one Primary Button is allowed per viewport.

### Form Inputs
- **Fields:** 2px Solid Black border, 18px text. Labels are always visible above the field in Bold.
- **Icons:** Must accompany labels for critical fields (e.g., Phone, Date).

### Status Indicators
- **Text-Only:** Statuses must be written out in full (e.g., "SAVED ON THIS DEVICE", "PENDING SYNC").
- **Styling:** Use the `status-label` typography style, wrapped in a 1px border box.

### Lists & Cards
- **Structure:** Cards are not used for grouping. Instead, use full-width list items separated by 2px horizontal lines to maximize horizontal space for text.
- **Vertical Wrapping:** Buttons and text must wrap vertically on small screens; never truncate text.