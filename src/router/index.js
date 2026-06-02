import { createRouter, createWebHashHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../views/index.vue'),
  },
  {
    path: '/ui-checklist',
    component: () => import('../components/uiChecklist/UiChecklist.vue'),
  },
  {
    path: '/accountbook',
    component: () => import('../components/AccountBook.vue'),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
