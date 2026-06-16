interface AudioReviewOptions {
  id: string;
  eyebrow: string;
  heading: string;
  script: string;
  audioDataUrl: string;
  mimeType?: string;
}

const escapeHtml = (value: string | number | undefined | null) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export interface GeneratedAudioReview {
  audioDataUrl: string;
  script: string;
  mimeType?: string;
}

export const renderAudioReviewBlock = ({ id, eyebrow, heading, script, audioDataUrl, mimeType = 'audio/mpeg' }: AudioReviewOptions) => {
  const safeId = id.replace(/[^a-z0-9_-]/gi, '');
  const transcriptId = `${safeId}-transcript`;

  return `<section aria-labelledby="${safeId}-heading" style="max-width:1120px;margin:24px auto 0 auto;padding:0 16px;">
    <div style="background:#ffffff;border:1px solid #d8e2ef;border-radius:24px;box-shadow:0 18px 45px rgba(15,23,42,0.08);padding:20px;display:grid;grid-template-columns:minmax(0,1fr);gap:16px;">
      <div style="display:flex;gap:14px;align-items:flex-start;">
        <div aria-hidden="true" style="width:48px;height:48px;border-radius:16px;background:#0f172a;color:#ffffff;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto;">&#9835;</div>
        <div style="min-width:0;">
          <div style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase;color:#0284c7;">${escapeHtml(eyebrow)}</div>
          <h2 id="${safeId}-heading" style="margin:3px 0 4px 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:22px;line-height:1.2;font-weight:900;color:#0f172a;">${escapeHtml(heading)}</h2>
          <p style="margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.55;color:#334155;">A friendly plain-English walkthrough of the coverages and payment choices on this page.</p>
        </div>
      </div>
      <div>
        <audio controls preload="metadata" style="display:block;width:100%;max-width:720px;">
          <source src="${escapeHtml(audioDataUrl)}" type="${escapeHtml(mimeType)}" />
          Your browser does not support audio playback.
        </audio>
      </div>
      <details style="border-top:1px solid #e2e8f0;padding-top:12px;">
        <summary style="font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:13px;font-weight:900;color:#0f172a;cursor:pointer;">Read the short script</summary>
        <p id="${transcriptId}" style="margin:10px 0 0 0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;font-size:14px;line-height:1.65;color:#334155;">${escapeHtml(script)}</p>
      </details>
    </div>
  </section>`;
};
