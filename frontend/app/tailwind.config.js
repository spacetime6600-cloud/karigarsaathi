/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Phase 5 Authoritative Stitch Palette
        surface: '#F7F9FF',
        'surface-dim': '#D1DBE9',
        'surface-bright': '#F7F9FF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#EDF4FF',
        'surface-container': '#E4EFFD',
        'surface-container-high': '#DFE9F7',
        'surface-container-highest': '#D9E3F1',
        'surface-variant': '#D9E3F1',
        'on-surface': '#121C26',
        'on-surface-variant': '#43474D',
        'inverse-surface': '#27313C',
        'inverse-on-surface': '#E8F2FF',
        outline: '#74777E',
        'outline-variant': '#C3C6CE',
        'surface-tint': '#47607E',

        // Primary Brand (Deep Indigo)
        primary: '#001D36',
        'on-primary': '#FFFFFF',
        'primary-container': '#17324D',
        'on-primary-container': '#819ABA',
        'primary-fixed': '#D1E4FF',
        'primary-fixed-dim': '#AFC9EA',
        'on-primary-fixed': '#001D36',
        'on-primary-fixed-variant': '#2F4865',
        'inverse-primary': '#AFC9EA',

        // Primary Action (Terracotta)
        secondary: '#A13F1C',
        'secondary-hover': '#812805',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#FD835B',
        'on-secondary-container': '#701F00',
        'secondary-fixed': '#FFDBD0',
        'secondary-fixed-dim': '#FFB59D',
        'on-secondary-fixed': '#390B00',
        'on-secondary-fixed-variant': '#812805',
        terracotta: '#C65A35',
        'terracotta-hover': '#A64A2B',

        // Highlight & Focus (Marigold)
        tertiary: '#2A1800',
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#462B00',
        'on-tertiary-container': '#CC8C28',
        'tertiary-fixed': '#FFDDB5',
        'tertiary-fixed-dim': '#FFB955',
        'on-tertiary-fixed': '#2A1800',
        'on-tertiary-fixed-variant': '#633F00',
        marigold: '#FFB955',

        // Semantic Feedback
        success: '#2E7D32',
        'success-container': '#E8F5E9',
        'on-success-container': '#1B5E20',
        warning: '#E65100',
        'warning-container': '#FFF3E0',
        'on-warning-container': '#E65100',
        error: '#BA1A1A',
        'error-container': '#FFDAD6',
        'on-error': '#FFFFFF',
        'on-error-container': '#93000A',

        // Canvas & Base
        background: '#F7F9FF',
        'on-background': '#121C26',
        'off-white': '#FFF9EF',
        'app-bg': '#FFF9EF',
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px
        sm: '0.25rem',      // 4px
        md: '0.75rem',      // 12px controls / inputs / buttons
        lg: '1rem',         // 16px panels / cards / modals
        xl: '1.5rem',       // 24px major containers
        '2xl': '1rem',
        full: '9999px',
        btn: '12px',
        panel: '16px',
        input: '12px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        base: '8px',
        md: '16px',
        18: '4.5rem',
        lg: '24px',
        xl: '32px',
        'margin-mobile': '16px',
        'margin-desktop': '48px',
        'touch-target-min': '48px',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Noto Sans"', '"Noto Sans Devanagari"', '"Noto Sans Bengali"', '"Noto Sans Oriya"', '"Noto Sans Telugu"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', '"Noto Sans"', '"Noto Sans Devanagari"', '"Noto Sans Bengali"', '"Noto Sans Oriya"', '"Noto Sans Telugu"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-lg': ['14px', { lineHeight: '20px', letterSpacing: '0.01em', fontWeight: '600' }],
        'body-md': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'title-md': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '28px', fontWeight: '400' }],
        'headline-lg-mobile': ['20px', { lineHeight: '28px', fontWeight: '700' }],
        'headline-lg': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'display-lg': ['32px', { lineHeight: '40px', letterSpacing: '-0.02em', fontWeight: '700' }],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 29, 54, 0.06)',
        'soft-card': '0 2px 8px rgba(0, 29, 54, 0.06)',
        'lifted-card': '0 4px 16px rgba(0, 29, 54, 0.10)',
        action: '0 4px 12px rgba(198, 90, 53, 0.25)',
      },
    },
  },
  plugins: [],
};
