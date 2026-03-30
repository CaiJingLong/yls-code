<template>
  <aside class="sidebar" data-testid="shell-nav">
    <div class="brand">
      <p class="brand-kicker">YLS</p>
      <h1 class="brand-title" data-testid="app-title">YLS Desktop Workbench</h1>
      <p class="brand-subtitle">Local-first usage control center</p>
    </div>

    <nav class="sidebar-nav">
      <RouterLink class="sidebar-link" to="/overview">Overview</RouterLink>
      <RouterLink class="sidebar-link" to="/logs">Logs</RouterLink>
      <RouterLink class="sidebar-link" to="/analytics">Analytics</RouterLink>
      <RouterLink class="sidebar-link" to="/keys">Keys</RouterLink>
    </nav>

    <p class="sidebar-meta">
      Archived VS Code plugin code stays under <code>vscode-plugin/</code>.
    </p>
  </aside>
</template>
