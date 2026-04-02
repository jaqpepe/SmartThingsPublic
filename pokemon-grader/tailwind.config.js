/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#0a0a0f',
          light: '#12121a',
          mid: '#1a1a26',
          surface: '#22223a',
        },
        gold: {
          DEFAULT: '#c9a84c',
          light: '#e8c96d',
          dark: '#a07830',
        },
        platinum: '#e8e8e8',
        copper: '#b87333',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      backgroundImage: {
        'holographic': 'linear-gradient(135deg, #ff0080 0%, #ff8c00 20%, #40e0d0 40%, #7b2ff7 60%, #ff0080 80%, #ff8c00 100%)',
        'gold-gradient': 'linear-gradient(135deg, #c9a84c 0%, #f5d98a 50%, #a07830 100%)',
        'silver-gradient': 'linear-gradient(135deg, #9e9e9e 0%, #e8e8e8 50%, #757575 100%)',
        'bronze-gradient': 'linear-gradient(135deg, #b87333 0%, #e8a05a 50%, #8b5323 100%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E\")",
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'count-up': 'count-up 1s ease-out forwards',
        'fade-in-up': 'fade-in-up 0.5s ease-out forwards',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(201, 168, 76, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(201, 168, 76, 0.8), 0 0 80px rgba(201, 168, 76, 0.4)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
