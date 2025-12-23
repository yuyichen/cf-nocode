<template>
  <div id="app" class="min-h-screen flex flex-col font-sans">
    <header class="bg-indigo-600 text-white p-4 shadow-lg flex justify-between items-center">
      <h1 class="text-xl font-bold tracking-tight">Cloudflare No-Code Platform</h1>
      <nav class="space-x-4">
        <router-link to="/builder" class="hover:underline">Builder</router-link>
        <router-link to="/runtime" class="hover:underline">Preview</router-link>
      </nav>
    </header>
    <main class="flex-1 flex overflow-hidden">
      <aside class="w-64 bg-gray-50 border-r p-4 hidden md:block">
        <ul>
          <li class="mb-2"><a href="#" class="text-gray-700 hover:text-indigo-600 font-medium">Dashboard</a></li>
          <li class="mb-2"><a href="#" class="text-gray-700 hover:text-indigo-600 font-medium">Data Models</a></li>
        </ul>
      </aside>
      <section class="flex-1 overflow-auto p-6" id="subapp-container">
        <router-view v-if="$route.path === '/'" />
        <!-- qiankun sub-apps will be mounted here -->
      </section>
    </main>
  </div>
</template>

<script setup>
// Main shell logic
</script>

<style>
/* virtual:uno.css is imported in main.ts */
</style>
