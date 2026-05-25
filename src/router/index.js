import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    component: () => import('../components/environmentSetup/EnvironmentSetup.vue'),
  },
  {
    path: '/ui-checklist',
    component: () => import('../components/uiChecklist/UiChecklist.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
