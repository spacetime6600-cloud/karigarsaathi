---
name: KarigarSaathi Phase 5
colors:
  surface: '#f7f9ff'
  surface-dim: '#d1dbe9'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#edf4ff'
  surface-container: '#e4effd'
  surface-container-high: '#dfe9f7'
  surface-container-highest: '#d9e3f1'
  on-surface: '#121c26'
  on-surface-variant: '#43474d'
  inverse-surface: '#27313c'
  inverse-on-surface: '#e8f2ff'
  outline: '#74777e'
  outline-variant: '#c3c6ce'
  surface-tint: '#47607e'
  primary: '#001d36'
  on-primary: '#ffffff'
  primary-container: '#17324d'
  on-primary-container: '#819aba'
  inverse-primary: '#afc9ea'
  secondary: '#a13f1c'
  on-secondary: '#ffffff'
  secondary-container: '#fd835b'
  on-secondary-container: '#701f00'
  tertiary: '#2a1800'
  on-tertiary: '#ffffff'
  tertiary-container: '#462b00'
  on-tertiary-container: '#cc8c28'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e4ff'
  primary-fixed-dim: '#afc9ea'
  on-primary-fixed: '#001d36'
  on-primary-fixed-variant: '#2f4865'
  secondary-fixed: '#ffdbd0'
  secondary-fixed-dim: '#ffb59d'
  on-secondary-fixed: '#390b00'
  on-secondary-fixed-variant: '#812805'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#ffb955'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f7f9ff'
  on-background: '#121c26'
  surface-variant: '#d9e3f1'
typography:
  display-lg:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 28px
  title-md:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-lg:
    fontFamily: Noto Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Noto Sans
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  margin-desktop: 48px
  touch-target-min: 48px
---

## Brand & Style

The design system is built to serve Indian artisans as a reliable digital companion. The personality is **grounded, respectful, and clear**, bridging the gap between traditional craftsmanship and modern utility. It evokes a sense of **trust and warmth** through a palette inspired by natural pigments and earth tones.

The visual style is a **Modern-Tactile** hybrid. It avoids the coldness of pure minimalism by using soft, warm surfaces and subtle craft-inspired motifs, while maintaining the functional clarity of a systematic UI. Every interface decision prioritizes cognitive ease and physical accessibility for users who may be navigating digital tools in varying environmental conditions (low light, outdoor glare).

- **Tone**: Empathetic and professional.
- **Visual Motif**: Subtle geometric or woven patterns (inspired by Ikat or Jamdani) are used sparingly in headers or as low-contrast background watermarks to provide cultural resonance without distracting from the task.

## Colors

This design system utilizes a high-contrast, earth-toned palette to ensure legibility and brand distinction.

- **Primary (Deep Indigo)**: Used for headers, navigation, and structural elements to provide a stable, authoritative frame.
- **Primary Action (Terracotta)**: Reserved exclusively for the most important interactive element on a screen to drive clear decision-making.
- **Highlight (Restrained Marigold)**: Used for active states, badges, or focusing attention on specific progress indicators.
- **Success & Error**: Carefully selected to meet AA accessibility standards against both the warm off-white background and white surfaces.
- **Neutral/Surface**: The background uses a warm off-white to reduce eye strain (compared to pure white), while white is used for card surfaces to create a clear "raised" hierarchy.

## Typography

The design system uses **Noto Sans** for its exceptional multi-script support, ensuring a consistent experience across English, Hindi, Odia, Bengali, and Telugu. 

- **Accessibility**: All text is designed to support 200% scaling. Avoid using "Fixed" height containers for text blocks.
- **Hierarchy**: Use `display-lg` sparingly for welcome screens or major milestones. `headline-lg` serves as the primary page header.
- **Readability**: Body text uses a slightly increased line-height to assist in reading across different scripts which may have taller glyphs or descenders.
- **Color**: Primary text uses Charcoal (#17212B); secondary text uses Slate (#52606D) for metadata and captions.

## Layout & Spacing

This design system is based on a **8px soft grid** to maintain mathematical harmony and ease of hand-off.

- **Layout Model**: A fluid grid is used for mobile and tablet, moving to a max-width centered container (1200px) for desktop to prevent line lengths from becoming unreadable.
- **Margins & Gutters**: 16px side margins on mobile devices. Gutters between cards or list items should default to 16px.
- **Touch Targets**: Every interactive element—buttons, icons, checkboxes—must maintain a minimum tap area of 48x48px, even if the visual asset is smaller.
- **Reflow**: On mobile, content should stack vertically. Primary actions should be pinned to the bottom of the viewport in a "fixed footer" or remain high in the visual hierarchy (top 1/3 of the screen).

## Elevation & Depth

Visual hierarchy is established through **Tonal Layering** and soft, natural shadows. 

- **Level 0 (Background)**: Warm off-white (#FFF9EF). Used for the base of the application.
- **Level 1 (Cards/Panels)**: White (#FFFFFF). These surfaces use a very soft, diffused shadow (Blur: 8px, Y: 2px, Opacity: 6% Primary Color) to appear slightly lifted.
- **Level 2 (Active Elements/Modals)**: Pale sand (#F3E8D5) or White with a more pronounced shadow (Blur: 16px, Y: 4px, Opacity: 10% Primary Color).
- **Focus States**: A mandatory 2px solid border using the Highlight (Marigold) color with an additional 2px offset ensures high visibility for keyboard and switch-access navigation.

## Shapes

The shape language is friendly and approachable, avoiding sharp corners that feel aggressive or overly corporate.

- **Controls & Small Elements**: Buttons, input fields, and chips use a **12px radius** (`rounded-md`).
- **Major Panels**: Main content cards and bottom sheets use a **16px radius** (`rounded-lg`).
- **Icons**: Icons should follow a "Rounded Line" style with a 2px stroke weight and rounded terminal ends to match the UI's softness.

## Components

### Buttons
- **Primary Action**: Terracotta background with White text. Bold weight. Used only once per screen.
- **Secondary**: Deep Indigo outline (2px) with Indigo text.
- **Tertiary**: Clear background with Deep Indigo text and an underline or icon.

### Input Fields
- **Style**: White background, 12px radius, 1.5px Slate border. 
- **Active State**: Border changes to Deep Indigo (2px).
- **Labels**: Always visible above the field; do not rely on placeholder text for critical information.

### Chips & Badges
- Used for status (e.g., "In Progress," "Completed").
- Must include both a colored dot/icon and text to communicate status effectively for users with color vision deficiencies.

### Lists & Cards
- **Cards**: 16px padding minimum. Use White surfaces against the Off-white background to create separation.
- **Lists**: Interactive list items must have a clear chevron icon or "trailing" element to indicate they are tappable.

### Feedback & Indicators
- **Success/Error**: Use a combination of background tint (light version of the color) and high-contrast icons to signal state changes.
- **Loading**: Use a themed spinner incorporating the Marigold highlight color.