export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load — Lockcopy</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap"
    />
    <style>
      :root {
        --paper: oklch(0.982 0.005 85);
        --card: oklch(0.997 0.002 85);
        --ink: oklch(0.2 0.018 260);
        --ink-soft: oklch(0.3 0.03 260);
        --muted: oklch(0.5 0.014 260);
        --primary: oklch(0.24 0.035 260);
        --primary-foreground: oklch(0.985 0.004 85);
        --border: oklch(0.9 0.008 85);
        --seal: oklch(0.52 0.085 155);
        --grid-line: oklch(0.2 0.018 260 / 5%);
      }
      * { box-sizing: border-box; }
      body {
        font-family: "Plus Jakarta Sans", system-ui, -apple-system, sans-serif;
        background: var(--paper);
        background-image: linear-gradient(var(--grid-line) 1px, transparent 1px),
          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
        background-size: 48px 48px;
        color: var(--ink);
        display: grid;
        place-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 1.5rem;
        -webkit-font-smoothing: antialiased;
        font-feature-settings: "ss01", "cv11";
      }
      .card {
        max-width: 28rem;
        width: 100%;
        text-align: center;
        padding: 2.25rem 2rem 2rem;
        background: var(--card);
        border-radius: 0.5rem;
        box-shadow: 0 0 0 1px oklch(0.2 0.018 260 / 6%), 0 2px 4px oklch(0.2 0.018 260 / 4%),
          0 24px 48px -24px oklch(0.2 0.018 260 / 22%);
      }
      .mark { display: inline-flex; }
      .mark svg { width: 2.25rem; height: 2.25rem; }
      .eyebrow {
        font-family: "JetBrains Mono", ui-monospace, monospace;
        font-size: 0.7rem;
        font-weight: 500;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--muted);
        margin: 1rem 0 0;
      }
      h1 {
        font-size: 1.35rem;
        font-weight: 700;
        letter-spacing: -0.035em;
        color: var(--ink);
        margin: 0.5rem 0 0;
      }
      p { font-size: 0.9rem; line-height: 1.55; color: var(--muted); margin: 0.5rem 0 1.75rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button {
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 500;
        cursor: pointer;
        text-decoration: none;
        border: 1px solid transparent;
        transition: background-color 0.15s ease, border-color 0.15s ease;
      }
      .primary {
        background: var(--primary);
        color: var(--primary-foreground);
        box-shadow: inset 0 1px 0 oklch(1 0 0 / 14%), 0 1px 2px oklch(0.2 0.018 260 / 25%);
      }
      .primary:hover { background: oklch(0.3 0.035 260); }
      .secondary { background: var(--card); color: var(--ink-soft); border-color: var(--border); }
      .secondary:hover { background: oklch(0.955 0.007 85); }
      a:focus-visible, button:focus-visible { outline: 2px solid oklch(0.55 0.07 258); outline-offset: 2px; }
      @media (prefers-reduced-motion: reduce) { a, button { transition: none; } }
    </style>
  </head>
  <body>
    <div class="card">
      <span class="mark">
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="8" fill="oklch(0.24 0.035 260)" />
          <path d="M10 7v18h12" fill="none" stroke="oklch(0.985 0.004 85)" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M15 15v-2.5a3.5 3.5 0 0 1 7 0V15" fill="none" stroke="oklch(0.985 0.004 85)" stroke-width="2.4" stroke-linecap="round" />
          <circle cx="18.5" cy="19.5" r="2" fill="oklch(0.52 0.085 155)" />
        </svg>
      </span>
      <p class="eyebrow">Lockcopy</p>
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
