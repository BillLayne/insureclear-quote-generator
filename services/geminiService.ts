import { InsuranceData, QuoteType } from '../types';

const fileToBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export const parseInsuranceQuote = async (
  file: File,
  instructions: string,
  quoteType: QuoteType,
): Promise<InsuranceData> => {
  const base64Data = await fileToBase64(file);

  const response = await fetch('/api/parse-quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64Data,
      mimeType: file.type,
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
      // response had no JSON body — keep the default message
    }
    throw new Error(message);
  }

  return (await response.json()) as InsuranceData;
};
