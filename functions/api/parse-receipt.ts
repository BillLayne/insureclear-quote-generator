/// <reference types="@cloudflare/workers-types" />
import { GoogleGenAI, Type } from '@google/genai';

interface Env {
  GEMINI_API_KEY: string;
}

interface RequestBody {
  text: string;
  instructions: string;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const receiptSchema = {
  type: Type.OBJECT,
  properties: {
    documentType: { type: Type.STRING, enum: ['receipt'] },
    receiptStyle: { type: Type.STRING, enum: ['default'] },
    clientFirstName: { type: Type.STRING },
    clientLastName: { type: Type.STRING },
    carrierName: { type: Type.STRING },
    carrierLegal: { type: Type.STRING },
    policyNumber: { type: Type.STRING },
    policyType: { type: Type.STRING },
    coverageStart: { type: Type.STRING },
    coverageEnd: { type: Type.STRING },
    paymentAmount: { type: Type.NUMBER },
    paymentDate: { type: Type.STRING },
    paymentTime: { type: Type.STRING },
    paymentMethod: { type: Type.STRING },
    confirmationNumber: { type: Type.STRING },
    transactionId: { type: Type.STRING },
  },
};

const buildPrompt = (instructions: string) => `
You extract structured PAYMENT RECEIPT data for Bill Layne Insurance Agency from pasted text
(a carrier payment-confirmation screen, billing portal, email, or details typed by the agent).
Return only JSON matching the schema. Extract only what the text actually shows. If a field is not
present, return an empty string for it (or 0 for paymentAmount) — never invent values.

User notes: ${instructions || 'None'}

FIELD RULES:
- documentType must be "receipt"; receiptStyle must be "default".
- clientFirstName / clientLastName: the customer / policyholder name.
- carrierName: the short carrier name (e.g. Progressive, Nationwide, National General, Travelers, NC Grange, Foremost, Dairyland, Alamance Farmers).
- carrierLegal: the carrier's legal underwriting entity when known. Examples: Progressive personal auto = Progressive Casualty Insurance Company; Nationwide = Nationwide Mutual Insurance Company; National General = Integon National Insurance Company; Travelers = The Travelers Indemnity Company; Dairyland = Dairyland Insurance Company; Foremost = Foremost Insurance Company Grand Rapids, Michigan; NC Grange = Grange Mutual Casualty Company. If you cannot determine it, repeat carrierName.
- policyNumber: the full policy number exactly as shown.
- policyType: the line of business in plain words, e.g. "NC Personal Auto", "Homeowners", "Dwelling Fire", "Motorcycle".
- coverageStart / coverageEnd: the policy term dates, human-readable like "June 16, 2026". Leave blank if not shown.
- paymentAmount: the amount paid as a plain number, e.g. 154.69 — never include a dollar sign or commas.
- paymentDate: the payment date, human-readable like "June 16, 2026".
- paymentTime: the time if shown, e.g. "2:14 PM ET". Blank if not shown.
- paymentMethod: how they paid, e.g. "Visa credit card ending in 4242", "Mastercard ending in 1881", "Bank draft (EFT)".
- confirmationNumber: the carrier or payment confirmation / authorization number.
- transactionId: any separate transaction or reference id if shown; otherwise blank.
`;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'Server is missing GEMINI_API_KEY. Set it as a Cloudflare Pages secret or in .dev.vars.' }, 500);
  }

  let body: RequestBody;
  try {
    body = await context.request.json<RequestBody>();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  const { text, instructions } = body ?? ({} as RequestBody);
  if (!text || !text.trim()) {
    return jsonResponse({ error: 'Paste the receipt / payment details first (text is required).' }, 400);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [{ text: `${buildPrompt(instructions)}\n\nRECEIPT / PAYMENT SOURCE TEXT:\n${text}` }],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: receiptSchema,
      },
    });

    const out = response.text;
    if (!out) return jsonResponse({ error: 'No response from Gemini.' }, 502);

    return new Response(out, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Gemini.';
    return jsonResponse({ error: message }, 502);
  }
};
