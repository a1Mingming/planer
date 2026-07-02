import { defineConfig } from 'umi';

export default defineConfig({
  routes: [
    { path: '/', redirect: '/plans/month' },
    { path: '/plans/year/:year', component: '@/pages/plans/year' },
    { path: '/plans/year', component: '@/pages/plans/year' },
    { path: '/plans/month/:month', component: '@/pages/plans/month' },
    { path: '/plans/month', component: '@/pages/plans/month' },
    { path: '/plans/day/:date', component: '@/pages/plans/day' },
    { path: '/plans/search', component: '@/pages/plans/search' },
  ],
  npmClient: 'pnpm',
  esbuildMinifyIIFE: true,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:3001',
      changeOrigin: true,
    },
  },
});
