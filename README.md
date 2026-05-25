# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).

## UI checklist realtime page

The converted checklist page is available at `/ui-checklist`.

Realtime progress sync uses Supabase:

1. Run `supabase-checklist.sql` in the Supabase SQL editor.
2. Copy `.env.example` to `.env` and fill in:

```text
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3. Deploy the Vite static build. Everyone who opens the same `/ui-checklist` URL will share the same checklist progress.
