/// <reference types="@cloudflare/workers-types" />
import { GoogleGenAI, Type } from '@google/genai';

interface Env {
  GEMINI_API_KEY: string;
}

type ProductType = 'auto' | 'home';
type RenewalDocumentRole = 'prior' | 'renewal' | 'supporting';

interface RenewalDocument {
  role?: RenewalDocumentRole;
  label?: string;
  fileName?: string;
  base64Data: string;
  mimeType: string;
}

interface RequestBody {
  base64Data?: string;
  mimeType?: string;
  fileName?: string;
  documents?: RenewalDocument[];
  instructions?: string;
  productType?: ProductType;
}

const carrierIds = [
  'progressive',
  'nationwide',
  'national_general',
  'travelers',
  'alamance',
  'ncgrange',
  'foremost',
  'hagerty',
  'ncjua',
  'dairyland',
  'steadily',
];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const moneyField = { type: Type.NUMBER, nullable: true };

const coverageChangeSchema = {
  type: Type.OBJECT,
  properties: {
    label: { type: Type.STRING },
    previous: { type: Type.STRING, nullable: true },
    renewal: { type: Type.STRING, nullable: true },
    note: { type: Type.STRING },
  },
};

const vehicleSchema = {
  type: Type.OBJECT,
  properties: {
    year: { type: Type.NUMBER, nullable: true },
    make: { type: Type.STRING },
    model: { type: Type.STRING },
    vinLast8: { type: Type.STRING },
    premium: moneyField,
    compDeductible: { type: Type.STRING, nullable: true },
    collisionDeductible: { type: Type.STRING, nullable: true },
    rental: { type: Type.STRING, nullable: true },
    roadside: { type: Type.STRING, nullable: true },
    note: { type: Type.STRING },
  },
};

const homeCoverageSchema = {
  type: Type.OBJECT,
  properties: {
    coverageA: moneyField,
    coverageB: moneyField,
    coverageC: moneyField,
    coverageD: { type: Type.STRING, nullable: true },
    coverageE: moneyField,
    coverageF: moneyField,
    allPerilDeductible: { type: Type.STRING, nullable: true },
    windHailDeductible: { type: Type.STRING, nullable: true },
  },
};

const renewalSchema = {
  type: Type.OBJECT,
  properties: {
    productType: { type: Type.STRING, enum: ['auto', 'home'] },
    clientFirstName: { type: Type.STRING },
    clientFullName: { type: Type.STRING },
    carrierId: { type: Type.STRING, enum: carrierIds },
    carrierName: { type: Type.STRING },
    policyNumber: { type: Type.STRING },
    policyType: { type: Type.STRING },
    renewalEffectiveDate: { type: Type.STRING },
    renewalExpirationDate: { type: Type.STRING },
    expiringPremium: moneyField,
    renewalPremium: moneyField,
    premiumDifference: moneyField,
    premiumDifferencePercent: moneyField,
    monthlyEstimate: moneyField,
    termMonths: moneyField,
    paymentDueDate: { type: Type.STRING, nullable: true },
    billingPlan: { type: Type.STRING, nullable: true },
    renewalStatus: { type: Type.STRING, enum: ['good_to_renew', 'review_recommended', 'reshop_recommended'] },
    recommendationHeadline: { type: Type.STRING },
    recommendationText: { type: Type.STRING },
    premiumExplanation: { type: Type.ARRAY, items: { type: Type.STRING } },
    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
    coverageChanges: { type: Type.ARRAY, items: coverageChangeSchema },
    drivers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          note: { type: Type.STRING },
        },
      },
    },
    vehicles: { type: Type.ARRAY, items: vehicleSchema },
    propertyAddress: { type: Type.STRING, nullable: true },
    homeCoverages: homeCoverageSchema,
    endorsements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          amount: { type: Type.STRING, nullable: true },
          note: { type: Type.STRING },
        },
      },
    },
    mortgagee: { type: Type.STRING, nullable: true },
    underwritingNotes: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
};

const buildPrompt = (productType: ProductType, instructions = '', documentContext = '') => `
You extract a customer-friendly insurance RENEWAL REVIEW card from insurance declarations pages, renewal declarations pages, renewal offers, carrier renewal packets, or renewal quotes for Bill Layne Insurance Agency.

Return only JSON matching the schema.

Line of business to extract: ${productType}
User notes: ${instructions || 'None'}
Uploaded document labels:
${documentContext || '- A single renewal document was provided.'}

Purpose:
- This is not a quote card and not an insurance ID card.
- This is a customer renewal review card that explains what renews, what changed, and whether the agency should review or re-shop.
- If both PRIOR / expiring term and RENEWAL documents are provided, compare them directly and use the PRIOR document for expiring/current values and the RENEWAL document for renewal values.
- If only one document is provided, extract what is visible and mark unknown comparison items as needs review instead of inventing.

Carrier id rules:
- Progressive => progressive
- Nationwide => nationwide
- National General => national_general
- Travelers => travelers
- Alamance Farmers => alamance
- NC Grange Mutual / North Carolina Grange Mutual => ncgrange
- Foremost => foremost
- Hagerty => hagerty
- NCJUA / NC Joint Underwriting Association => ncjua
- Dairyland => dairyland
- Steadily / Fortegra => steadily

Money and date rules:
- Money fields are plain numbers only: 1247.20, not "$1,247.20".
- Dates are YYYY-MM-DD when visible. If the renewal expiration date is not printed, estimate 12 months for home and 6 or 12 months for auto based on the visible term.
- If a prior term document is provided, use its total policy premium as expiringPremium when visible.
- If expiring/current premium is not shown, set expiringPremium to null. Do not invent.
- If premiumDifference can be calculated from expiringPremium and renewalPremium, calculate it.
- premiumDifferencePercent is (renewal - expiring) / expiring * 100 when expiringPremium is visible, otherwise null.
- termMonths should be 12 for home. For auto, use the visible renewal term when shown; usually 6 or 12 months.
- monthlyEstimate should be renewalPremium / 12 for home and renewalPremium / termMonths for auto when termMonths is visible; otherwise use renewalPremium / 6 for auto and renewalPremium / 12 for home.

Recommendation rules:
- renewalStatus = good_to_renew when premium is flat/small increase and no major coverage concern is visible.
- renewalStatus = review_recommended when coverage, drivers, vehicles, deductible, mortgagee, forms, roof, or underwriting items should be checked.
- renewalStatus = reshop_recommended when premium increase is roughly 15%+ or the packet shows a large coverage reduction, nonrenewal risk, underwriting concern, or user notes ask to explain a large increase.
- recommendationHeadline should be short and customer-facing.
- recommendationText should sound like Bill Layne Insurance: calm, helpful, not scary, and clear that the agency can review before renewal.

Premium explanation rules:
- premiumExplanation should be 3 to 5 short bullets.
- Explain premium differences cautiously. Use "Possible reasons" unless the document clearly states the reason.
- Good explanation topics: carrier rate filing, vehicle age/changes, driver/rating changes, claims, deductible/coverage changes, home reconstruction cost, roof/year built, inflation guard, protection class, underwriting updates, discounts added/removed, fees/surcharges.
- Never blame the customer. Never say a reason is definite unless shown.

Coverage changes:
- Include only changes visible in the document or strongly implied by comparing prior/current vs renewal pages.
- If there are no visible changes, include one row saying "No obvious coverage change found" with note "Review the declarations page before renewal."
- When both documents are supplied, compare premiums, policy form/type, limits, deductibles, drivers, vehicles, endorsements, discounts, mortgagee/lienholder, addresses, and named insured details when visible.

AUTO instructions:
- productType must be "auto".
- Extract drivers with simple notes such as "Listed driver", "Rated driver", "Excluded", or "Needs review".
- Extract vehicles with year, make, model, VIN last 8 only, comp/collision deductibles, rental, roadside, vehicle premium when visible.
- actionItems should include review drivers, vehicles, lienholders, deductibles, and payment plan.

HOME instructions:
- productType must be "home".
- Extract policy type/form such as HO-3, HO-4, DP-2, DP-3, MH, Renters, Condo if shown.
- Extract propertyAddress, home coverage A-F, deductibles, endorsements, mortgagee, roof or underwriting notes.
- For Coverage D, use a string because renewal forms may show "20%" or "Included".
- actionItems should include review dwelling limit, roof/year built, deductibles, mortgagee/lender, and coverage endorsements.

Defaults:
- clientFirstName should be the first word of clientFullName.
- If customer name is missing, use "Customer" and note that the name needs review.
- If carrier is missing, infer only when obvious from logo/text; otherwise use nationwide and carrierName "Carrier needs review".
- policyNumber may be "Needs review" if not visible.
`;

const documentRoleLabel = (role?: RenewalDocumentRole) => {
  if (role === 'prior') return 'Prior / expiring term declarations';
  if (role === 'renewal') return 'Renewal declarations';
  return 'Supporting renewal document';
};

const normalizeDocuments = (body: RequestBody): RenewalDocument[] => {
  const documents = Array.isArray(body.documents) ? body.documents : [];
  const normalized = documents
    .filter((document) => document?.base64Data && document?.mimeType)
    .map((document) => ({
      ...document,
      role: document.role || 'supporting',
      label: document.label || documentRoleLabel(document.role),
    }));

  if (!normalized.length && body.base64Data && body.mimeType) {
    normalized.push({
      role: 'renewal',
      label: documentRoleLabel('renewal'),
      fileName: body.fileName,
      mimeType: body.mimeType,
      base64Data: body.base64Data,
    });
  }

  return normalized;
};

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

  const { instructions, productType } = body ?? ({} as RequestBody);
  const normalizedDocuments = normalizeDocuments(body ?? ({} as RequestBody));

  if (productType !== 'auto' && productType !== 'home') {
    return jsonResponse({ error: 'Missing or invalid required field: productType.' }, 400);
  }

  if (!normalizedDocuments.length) {
    return jsonResponse({ error: 'Choose at least one declaration document to parse.' }, 400);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const documentContext = normalizedDocuments
      .map((document, index) => `- Document ${index + 1}: ${document.label || documentRoleLabel(document.role)}${document.fileName ? `; file: ${document.fileName}` : ''}`)
      .join('\n');
    const documentParts = normalizedDocuments.flatMap((document, index) => [
      { text: `Document ${index + 1} label: ${document.label || documentRoleLabel(document.role)}. Treat role "${document.role || 'supporting'}" accordingly.` },
      { inlineData: { mimeType: document.mimeType, data: document.base64Data } },
    ]);

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { text: buildPrompt(productType, instructions, documentContext) },
          ...documentParts,
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: renewalSchema,
      },
    });

    const text = response.text;
    if (!text) return jsonResponse({ error: 'No response from Gemini.' }, 502);

    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Gemini.';
    return jsonResponse({ error: message }, 502);
  }
};
