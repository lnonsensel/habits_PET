/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        garden: {
          parchment: '#F5F0E8',
          cream:     '#FFFDF7',
          forest:    '#2D6A4F',
          sage:      '#52B788',
          leaf:      '#95C4A0',
          bark:      '#1A1A14',
          soil:      '#6B5B4E',
          clay:      '#C1440E',
          mist:      '#D4E6D9',
          border:    '#D6C9B6',
          amber:     '#C49A3C',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Lato', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        paper:       '2px 4px 14px rgba(45,106,79,0.10), 0 1px 3px rgba(26,26,20,0.06)',
        'paper-md':  '3px 6px 20px rgba(45,106,79,0.13), 0 2px 5px rgba(26,26,20,0.08)',
        'paper-lg':  '6px 10px 32px rgba(45,106,79,0.15), 0 3px 8px rgba(26,26,20,0.10)',
        'inner-sm':  'inset 0 1px 3px rgba(26,26,20,0.08)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        leafSway: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)' },
        },
        sprout: {
          '0%':   { transform: 'scaleY(0)', transformOrigin: 'bottom' },
          '100%': { transform: 'scaleY(1)', transformOrigin: 'bottom' },
        },
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease-out both',
        'fade-up-1':  'fadeUp 0.5s 0.1s ease-out both',
        'fade-up-2':  'fadeUp 0.5s 0.2s ease-out both',
        'fade-up-3':  'fadeUp 0.5s 0.3s ease-out both',
        'fade-in':    'fadeIn 0.4s ease-out both',
        'leaf-sway':  'leafSway 4s ease-in-out infinite',
        'sprout':     'sprout 0.6s ease-out both',
      },
    },
  },
  plugins: [],
}
