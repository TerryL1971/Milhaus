// src/lib/escape-html.ts
// Escapes text before it goes into an HTML email, so a listing title or
// a name someone typed can't inject markup. Shared by the emails added
// in the 2026-11-09 legal pass (withdrawal, order confirmation,
// takedown notice); older email files still carry their own copy.

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}

/** The cream-and-navy frame every Milhaus email uses. `body` is HTML. */
export function emailFrame(subtitle: string, body: string): string {
  return `
    <div style="background:#F0EDE4;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#FBFAF6;border-radius:8px;padding:32px;color:#22201B;font-size:14px;line-height:1.5;">
        <h1 style="margin:0 0 4px;font-size:22px;color:#101842;">Milhaus</h1>
        <p style="margin:0 0 24px;color:#2C345E;font-size:14px;">${escapeHtml(subtitle)}</p>
        ${body}
      </div>
    </div>`;
}
