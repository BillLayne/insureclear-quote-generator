import type { QuoteData, QuoteTemplateType } from '../types/quote';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export async function parseInsuranceQuote(
  file: File,
  instructions: string,
  quoteType: QuoteTemplateType,
): Promise<QuoteData> {
  const base64Data = await fileToBase64(file);

  const response = await fetch('/api/parse-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64Data,
      mimeType: file.type || 'application/pdf',
      instructions,
      quoteType,
    }),
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const err = await response.json();
      if (err && typeof err.error === 'string') message = err.error;
    } catch {
      // Keep the default message.
    }
    throw new Error(message);
  }

  return (await response.json()) as QuoteData;
}
