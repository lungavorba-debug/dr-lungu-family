/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        triage: {
          green: '#22c55e',
          yellow: '#eab308',
          orange: '#f97316',
          red: '#ef4444',
        },
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          accent: 'var(--brand-accent)',
          surface: 'var(--brand-surface)',
          login: 'var(--brand-primary)',
        },
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
      boxShadow: {
        medical: '0 1px 3px 0 rgb(0 61 91 / 0.08), 0 1px 2px -1px rgb(0 61 91 / 0.08)',
      },
    },
  },
  plugins: [],
};
