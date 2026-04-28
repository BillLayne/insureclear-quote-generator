/// <reference types="@cloudflare/workers-types" />
import { GoogleGenAI, Type } from '@google/genai';

interface Env {
  GEMINI_API_KEY: string;
}

type QuoteType = 'home' | 'home-hero' | 'auto' | 'other';

interface RequestBody {
  base64Data: string;
  mimeType: string;
  instructions: string;
  quoteType: QuoteType;
}

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const buildTypeSpecificPrompt = (quoteType: QuoteType): string => {
  if (quoteType === 'home' || quoteType === 'home-hero') {
    return `
      This is a HOME/PROPERTY insurance quote.
      - EXTRACT PROPERTY DETAILS: Year built, type, construction, acreage, fire protection class, occupancy.
      - EXTRACT COVERAGES: Dwelling (Cov A), Other Structures (Cov B), Personal Property (Cov C), Loss of Use (Cov D), Liability (Cov E), Med Pay (Cov F).
      - WIND/HAIL DEDUCTIBLE: This is critical. Look for a separate Wind/Hail deductible (e.g. 1%, 2%, or flat amount).
        In the 'deductible.description' field, describe BOTH the standard deductible AND the wind/hail deductible.
        Example description: "Standard 'All Other Perils' deductible. A 1% deductible ($4,290) applies to Windstorm/Hail damage."
      - GLOSSARY: Focus on terms like Replacement Cost, Dwelling, Deductible.
      - NOT COVERED: Standard HO-3 exclusions (Flood, Earth Movement, Wear & Tear).
    `;
  }
  if (quoteType === 'auto') {
    return `
      This is an AUTO/VEHICLE insurance quote.
      - EXTRACT VEHICLES: Year, Make, Model, VIN, Usage, Zip, Annual Premium per vehicle.
      - VEHICLE COVERAGES (CRITICAL): For EACH vehicle, extract a list of ALL specific coverages that apply to it.
        * YOU MUST INCLUDE: "Towing", "Labor", "Rental Reimbursement", "Transportation Expenses", "Emergency Road Service" as individual items in the 'coverages' array for that vehicle if they appear in the quote.
        * INCLUDE: Liability, Comprehensive (deductible/premium), Collision (deductible/premium).
        * If a coverage is "Not included" or "Rejected", do NOT include it in the list unless specifically useful to show as declined.
      - EXTRACT DRIVERS: Names, Age, Gender, Marital Status, Points/Status.
      - EXTRACT POLICY COVERAGES: General limits applicable to all (BI, PD, MedPay) - put these in the root 'coverages' array.
      - PAYMENT OPTIONS: Look for payment plans.
      - GLOSSARY: Focus on Collision, Comprehensive, Liability, Deductible, UM/UIM.
      - NOT COVERED: Standard Auto exclusions.
    `;
  }
  return `
    This is a GENERAL/OTHER insurance quote (e.g. Umbrella, Commercial, Event).
    - EXTRACT SUBJECT: What is being insured? (Business name, specific item, or event).
    - EXTRACT COVERAGES: General Liability, Aggregate Limits, Specific Item limits.
    - GLOSSARY: General insurance terms relevant to the policy.
    - NOT COVERED: Standard exclusions for this policy type.
  `;
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['home', 'auto', 'other', 'home-hero'] },
    customer: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        address: { type: Type.STRING },
        quoteDate: { type: Type.STRING },
        policyPeriod: { type: Type.STRING },
      },
    },
    carrier: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        subText: { type: Type.STRING },
      },
    },
    property: {
      type: Type.OBJECT,
      properties: {
        type: { type: Type.STRING },
        built: { type: Type.STRING },
        construction: { type: Type.STRING },
        acreage: { type: Type.STRING },
        fireProtection: { type: Type.STRING },
        occupancy: { type: Type.STRING },
      },
      nullable: true,
    },
    vehicles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.STRING },
          make: { type: Type.STRING },
          model: { type: Type.STRING },
          vin: { type: Type.STRING },
          usage: { type: Type.STRING },
          zip: { type: Type.STRING },
          annualPremium: { type: Type.STRING },
          coverages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                limit: { type: Type.STRING },
                deductible: { type: Type.STRING },
                premium: { type: Type.STRING },
                included: { type: Type.BOOLEAN },
                icon: { type: Type.STRING },
              },
            },
          },
        },
      },
      nullable: true,
    },
    drivers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          details: { type: Type.STRING },
          isRated: { type: Type.BOOLEAN },
        },
      },
      nullable: true,
    },
    subject: { type: Type.STRING, nullable: true },
    coverages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          amount: { type: Type.STRING },
          explanation: { type: Type.STRING },
          example: { type: Type.STRING },
          color: { type: Type.STRING, enum: ['blue', 'green', 'purple', 'amber', 'teal', 'rose'] },
          icon: { type: Type.STRING },
        },
      },
    },
    deductible: {
      type: Type.OBJECT,
      properties: {
        amount: { type: Type.STRING },
        description: { type: Type.STRING },
      },
    },
    extras: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          cost: { type: Type.STRING },
          isIncluded: { type: Type.BOOLEAN },
          icon: { type: Type.STRING },
        },
      },
    },
    premium: {
      type: Type.OBJECT,
      properties: {
        base: { type: Type.STRING },
        extrasCost: { type: Type.STRING },
        discountsAmount: { type: Type.STRING },
        totalAnnual: { type: Type.STRING },
        monthlyEstimate: { type: Type.STRING },
      },
    },
    paymentOptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          planName: { type: Type.STRING },
          downPayment: { type: Type.STRING },
          monthlyAmount: { type: Type.STRING },
          installments: { type: Type.STRING },
        },
      },
      nullable: true,
    },
    discounts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    agent: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING },
        address: { type: Type.STRING },
        phone: { type: Type.STRING },
        email: { type: Type.STRING },
        website: { type: Type.STRING },
        logoUrl: { type: Type.STRING, nullable: true },
      },
    },
    notCovered: { type: Type.STRING },
  },
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) {
    return jsonResponse(
      { error: 'Server is missing GEMINI_API_KEY. Set it as a Cloudflare Pages secret.' },
      500,
    );
  }

  let body: RequestBody;
  try {
    body = await context.request.json<RequestBody>();
  } catch {
    return jsonResponse({ error: 'Request body must be valid JSON.' }, 400);
  }

  const { base64Data, mimeType, instructions, quoteType } = body ?? ({} as RequestBody);
  if (!base64Data || !mimeType || !quoteType) {
    return jsonResponse(
      { error: 'Missing required fields: base64Data, mimeType, quoteType.' },
      400,
    );
  }

  const prompt = `
    You are an expert insurance marketing specialist.
    Your goal is to extract data from this insurance quote document and format it into a clean, JSON structure suitable for a consumer-friendly marketing template.

    QUOTE TYPE: ${quoteType.toUpperCase()}
    Specific Instructions from User: "${instructions ?? ''}"

    ${buildTypeSpecificPrompt(quoteType)}

    General Rules:
    1. Extract customer name, address, carrier, and dates.
    2. For Coverages (Policy Wide): Provide a SIMPLE explanation for a 5th grader and a REAL WORLD EXAMPLE. Assign a color (blue, green, purple, amber, teal, rose) and an emoji icon.
    3. For Extras/Endorsements: If included in premium, mark isIncluded: true.
    4. For Premium: Extract base, discounts, total. Calculate monthly if missing.
    5. Agent Info: Extract from document. If MISSING or UNCLEAR, use defaults:
       - Name: Bill Layne Insurance Agency
       - Email: Save@BillLayneInsurance.com
       - Phone: (336) 835-1993
       - Website: www.BillLayneInsurance.com
       - Logo: https://i.imgur.com/zCUkP2V.png
    6. Return ONLY valid JSON matching the schema provided.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return jsonResponse({ error: 'No response from AI.' }, 502);
    }

    return new Response(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error calling Gemini.';
    return jsonResponse({ error: message }, 502);
  }
};
