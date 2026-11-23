/** Stripe recusa abrir dentro de iframes (ex.: pré-visualização): abre fora. */
export function goExternal(url: string) {
  if (window.top !== window.self) {
    const w = window.open(url, "_blank", "noopener");
    if (w) return;
  }
  window.location.assign(url);
}
