/** Stripe refuses to open inside iframes (e.g. the preview): open it outside. */
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
