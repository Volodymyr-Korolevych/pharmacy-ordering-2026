import type { Config } from 'tailwindcss'

export default <Partial<Config>>{
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './app.vue',
    './plugins/**/*.{js,ts}',
    './composables/**/*.{js,ts}',
    './stores/**/*.{js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        primary: "#111827", // темно-графітовий
        accent: "#3B82F6",  // синій (Tailwind blue-500)
        muted: "#6B7280",   // grey-500
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: []
}
