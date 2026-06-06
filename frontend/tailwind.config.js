/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#4F46E5', // Indigo 600
          dark: '#4338CA', // Indigo 700
          light: '#EEF2FF', // Indigo 50
        },
        mint: {
          DEFAULT: '#8B5CF6', // Violet 500
          light: '#DDD6FE', // Violet 200
          dark: '#7C3AED', // Violet 600
        },
        charcoal: '#0F172A', // Slate 900
        'soft-gray': '#F8FAFC', // Slate 50
        surface: '#ffffff',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.08', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-sm': ['3rem', { lineHeight: '1.12', letterSpacing: '-0.025em', fontWeight: '700' }],
        'heading': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'heading-sm': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.015em', fontWeight: '700' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65', fontWeight: '400' }],
        'body': ['0.9375rem', { lineHeight: '1.6', fontWeight: '400' }],
        'caption': ['0.8125rem', { lineHeight: '1.5', fontWeight: '500' }],
        'micro': ['0.6875rem', { lineHeight: '1.4', fontWeight: '600' }],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(79, 70, 229, 0.1)',
        'card-hover': '0 10px 25px -5px rgba(79, 70, 229, 0.15), 0 8px 10px -6px rgba(79, 70, 229, 0.1)',
        'elevated': '0 12px 40px rgba(79, 70, 229, 0.12)',
        'brand': '0 4px 14px 0 rgba(79, 70, 229, 0.3)',
        'brand-lg': '0 0 20px rgba(79, 70, 229, 0.5)',
        'soft': '0 4px 20px -2px rgba(79, 70, 229, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
}
