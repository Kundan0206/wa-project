import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f5f5',
        'canvas-soft': '#fafafa',
        'canvas-deep': '#0c0a09',
        surface: {
          card: '#ffffff',
          strong: '#f0efed',
          dark: '#0c0a09',
          'dark-elevated': '#1c1917'
        },
        hairline: '#e7e5e4',
        'hairline-soft': '#f0efed',
        'hairline-strong': '#d6d3d1',
        ink: '#0c0a09',
        body: '#4e4e4e',
        'body-strong': '#292524',
        muted: '#777169',
        'muted-soft': '#a8a29e',
        primary: {
          DEFAULT: '#292524',
          active: '#0c0a09'
        },
        on: {
          primary: '#ffffff',
          dark: '#ffffff',
          'dark-soft': '#a8a29e'
        },
        gradient: {
          mint: '#a7e5d3',
          peach: '#f4c5a8',
          lavender: '#c8b8e0',
          sky: '#a8c8e8',
          rose: '#e8b8c4'
        },
        success: '#16a34a',
        error: '#dc2626'
      },
      fontFamily: {
        display: ['EB Garamond', 'Times New Roman', 'serif'],
        body: ['Inter', 'sans-serif']
      },
      fontSize: {
        'display-mega': ['64px', { lineHeight: '1.05', letterSpacing: '-1.92px', fontWeight: '300' }],
        'display-xl': ['48px', { lineHeight: '1.08', letterSpacing: '-0.96px', fontWeight: '300' }],
        'display-lg': ['36px', { lineHeight: '1.17', letterSpacing: '-0.36px', fontWeight: '300' }],
        'display-md': ['32px', { lineHeight: '1.13', letterSpacing: '-0.32px', fontWeight: '300' }],
        'display-sm': ['24px', { lineHeight: '1.2', letterSpacing: '0', fontWeight: '300' }],
        'title-md': ['20px', { lineHeight: '1.35', letterSpacing: '0', fontWeight: '500' }],
        'title-sm': ['18px', { lineHeight: '1.44', letterSpacing: '0.18px', fontWeight: '500' }],
        'body-md': ['16px', { lineHeight: '1.5', letterSpacing: '0.16px', fontWeight: '400' }],
        'body-strong': ['16px', { lineHeight: '1.5', letterSpacing: '0.16px', fontWeight: '500' }],
        'body-sm': ['15px', { lineHeight: '1.47', letterSpacing: '0.15px', fontWeight: '400' }],
        caption: ['14px', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        'caption-uppercase': ['12px', { lineHeight: '1.4', letterSpacing: '0.96px', fontWeight: '600' }],
        button: ['15px', { lineHeight: '1', letterSpacing: '0', fontWeight: '500' }],
        'nav-link': ['15px', { lineHeight: '1.4', letterSpacing: '0', fontWeight: '500' }]
      },
      spacing: {
        'xxs': '4px',
        'xs': '8px',
        'sm': '12px',
        'base': '16px',
        'md': '20px',
        'lg': '24px',
        'xl': '32px',
        'xxl': '48px',
        'section': '32px'
      },
      borderRadius: {
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        xxl: '24px',
        pill: '9999px',
        full: '9999px'
      },
      boxShadow: {
        'soft': '0 4px 16px rgba(0, 0, 0, 0.04)'
      },
      maxWidth: {
        content: '1600px'
      }
    }
  },
  plugins: []
};

export default config;