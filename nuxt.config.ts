export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@nuxt/icon',
    '@nuxt/image',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@vite-pwa/nuxt',
  ],

  ui: {
    icons: ['heroicons', 'lucide'],
  },

  colorMode: {
    preference: 'system',
    fallback: 'light',
    classSuffix: '',
  },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    auth0Domain: process.env.NUXT_AUTH0_DOMAIN,
    auth0ClientId: process.env.NUXT_AUTH0_CLIENT_ID,
    auth0ClientSecret: process.env.NUXT_AUTH0_CLIENT_SECRET,
    stripeSecretKey: process.env.NUXT_STRIPE_SECRET_KEY,
    stripeWebhookSecret: process.env.NUXT_STRIPE_WEBHOOK_SECRET,
    openaiApiKey: process.env.NUXT_OPENAI_API_KEY,
    public: {
      appName: 'Bibanna',
      stripePublishableKey: process.env.NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    },
  },

  app: {
    head: {
      title: 'Bibanna - Bibliography & Annotation Management',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Manage your bibliographies, annotations, and research sources with ease.' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      ],
    },
  },

  experimental: {
    payloadExtraction: true,
    treeshakeClientOnly: true,
  },

  image: {
    quality: 80,
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
    },
  },

  routeRules: {
    '/': { prerender: true },
    '/app/**': { ssr: false },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Bibanna',
      short_name: 'Bibanna',
      description: 'Bibliography & Annotation Management',
      theme_color: '#4F46E5',
      background_color: '#ffffff',
      display: 'standalone',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
  },

  nitro: {
    preset: 'node-server',
    experimental: {
      openAPI: true,
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  compatibilityDate: '2024-01-29',
})
