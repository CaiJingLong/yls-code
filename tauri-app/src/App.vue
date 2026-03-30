<template>
  <div class="app-shell">
    <aside class="shell-sidebar" data-testid="shell-nav" aria-label="Primary">
      <div class="shell-brand">
        <p class="shell-kicker">YLS</p>
        <h1 class="shell-title" data-testid="app-title">YLS Desktop Workbench</h1>
      </div>
      <nav class="shell-menu">
        <a class="shell-link is-active" href="#" @click.prevent>Overview</a>
        <a class="shell-link" href="#" @click.prevent>Logs</a>
        <a class="shell-link" href="#" @click.prevent>Analytics</a>
        <a class="shell-link" href="#" @click.prevent>Keys</a>
      </nav>
    </aside>

    <main class="shell-main">
      <section class="hero-card">
        <p class="hero-eyebrow">Desktop rebuild in progress</p>
        <h2>Local-first YLS usage workbench</h2>
        <p>
          The archived VS Code plugin has moved to
          <code>vscode-plugin/</code>. This shell is the new Tauri desktop app.
        </p>
      </section>
    </main>
  </div>
</template>
