<template>
  <div class="rounded-2xl border bg-white p-5 shadow-sm">
    <h1 class="text-xl font-bold">Адмін • Аптеки (фіксований перелік)</h1>
    <p class="mt-1 text-sm text-gray-600">10 аптек з фіксованими кодами. CRUD не використовується.</p>

    <div class="mt-4 grid gap-3">
      <div v-for="p in PHARMACIES" :key="p.code" class="rounded-xl border p-3">
        <div class="text-sm font-semibold">{{ p.code }} — {{ p.name }}</div>
        <div class="text-xs text-gray-500">{{ p.address }} • {{ p.phone }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PHARMACIES } from '~/data/pharmacies'

await requireRole('admin')
</script>
