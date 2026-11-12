/** Only allow same-site relative redirects (blocks open-redirect via ?next=). */
export function safeNext(v: string | string[] | undefined): string {
  const s = Array.isArray(v) ? v[0] : v;
  return s && /^\/(?![/\\])[\w\-./?=&%]*$/.test(s) ? s : "/library";
}
