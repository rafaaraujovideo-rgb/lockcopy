/** Stripe recusa abrir dentro de iframes (ex.: pré-visualização): abre fora. */
export function goExternal(url: string) {
  if (window.top !== window.self) {
    // Sem "noopener" no 3.º argumento: com ele, window.open devolve sempre null.
    const w = window.open(url, "_blank");
    if (w) {
      w.opener = null;
      return;
    }
  }
  window.location.assign(url);
}
