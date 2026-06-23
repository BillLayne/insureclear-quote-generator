/// <reference types="@cloudflare/workers-types" />
import { GoogleGenAI, Type } from '@google/genai';

interface Env {
  GEMINI_API_KEY: string;
}

type QuoteType = 'auto' | 'home' | 'motorcycle' | 'renters' | 'dwelling';

interface RequestBody {
  base64Data: string;
  mimeType: string;
  instructions: string;
  quoteType: QuoteType;
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
  'american_zurich',
];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const discountSchema = {
  type: Type.OBJECT,
  properties: {
    emoji: { type: Type.STRING },
    label: { type: Type.STRING },
  },
};

const foldCardSchema = {
  type: Type.OBJECT,
  nullable: true,
  properties: {
    companyName: { type: Type.STRING, nullable: true },
    customerAddress: { type: Type.STRING, nullable: true },
    priorCarrier: { type: Type.STRING, nullable: true },
    setupCharge: { type: Type.NUMBER, nullable: true },
    paymentSchedule: { type: Type.STRING, nullable: true },
    coverageAlert: { type: Type.STRING, nullable: true },
    qrLink: { type: Type.STRING, nullable: true },
    productStrip: { type: Type.STRING, nullable: true },
    agentImageUrl: { type: Type.STRING, nullable: true },
  },
};

const autoSchema = {
  type: Type.OBJECT,
  properties: {
    templateType: { type: Type.STRING, enum: ['auto'] },
    clientFirstName: { type: Type.STRING },
    clientFullName: { type: Type.STRING },
    clientEmail: { type: Type.STRING },
    heroImageUrl: { type: Type.STRING, nullable: true },
    foldCard: foldCardSchema,
    carrierId: { type: Type.STRING, enum: carrierIds },
    carriersShoppedNames: { type: Type.ARRAY, items: { type: Type.STRING } },
    quoteNumber: { type: Type.STRING },
    effectiveDate: { type: Type.STRING },
    expiryDate: { type: Type.STRING },
    quoteDate: { type: Type.STRING },
    termMonths: { type: Type.NUMBER },
    totalPremium: { type: Type.NUMBER },
    paymentOptions: {
      type: Type.OBJECT,
      properties: {
        eft: {
          type: Type.OBJECT,
          properties: {
            downPayment: { type: Type.NUMBER },
            recurringAmount: { type: Type.NUMBER },
            recurringCount: { type: Type.NUMBER },
          },
        },
        paidInFull: {
          type: Type.OBJECT,
          properties: {
            total: { type: Type.NUMBER },
            savings: { type: Type.NUMBER },
          },
        },
      },
    },
    vehicles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          year: { type: Type.NUMBER },
          make: { type: Type.STRING },
          model: { type: Type.STRING },
          vinLast8: { type: Type.STRING },
          coverageType: { type: Type.STRING, enum: ['liability_only', 'full_coverage'] },
          garagingZip: { type: Type.STRING },
          vehiclePremium: { type: Type.NUMBER },
          isPrimary: { type: Type.BOOLEAN },
          coverages: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                emoji: { type: Type.STRING },
                name: { type: Type.STRING },
                limitOrDeductible: { type: Type.STRING },
                premium: { type: Type.NUMBER, nullable: true },
                status: { type: Type.STRING, enum: ['included', 'rejected', 'not_applicable'] },
              },
            },
          },
        },
      },
    },
    drivers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          age: { type: Type.NUMBER },
          yearsLicensed: { type: Type.NUMBER },
          relationship: { type: Type.STRING, enum: ['insured', 'spouse', 'child', 'excluded'] },
          isTeen: { type: Type.BOOLEAN },
        },
      },
    },
    coverages: {
      type: Type.OBJECT,
      properties: {
        bodilyInjuryLimit: { type: Type.STRING },
        propertyDamageLimit: { type: Type.STRING },
        collisionDeductible: { type: Type.NUMBER, nullable: true },
        comprehensiveDeductible: { type: Type.NUMBER, nullable: true },
        uninsuredMotoristLimit: { type: Type.STRING },
        underinsuredMotoristLimit: { type: Type.STRING, nullable: true },
        medicalPayments: { type: Type.NUMBER, nullable: true },
        rentalReimbursement: { type: Type.STRING, nullable: true },
        towing: { type: Type.STRING, nullable: true },
        customEquipment: { type: Type.NUMBER, nullable: true },
      },
    },
    discounts: { type: Type.ARRAY, items: discountSchema },
    showInfographic: { type: Type.BOOLEAN },
    hasTeenDriver: { type: Type.BOOLEAN },
    hasExcludedDriver: { type: Type.BOOLEAN },
  },
};

const homeSchema = {
  type: Type.OBJECT,
  properties: {
    templateType: { type: Type.STRING, enum: ['home'] },
    clientFirstName: { type: Type.STRING },
    clientFullName: { type: Type.STRING },
    clientEmail: { type: Type.STRING },
    heroImageUrl: { type: Type.STRING, nullable: true },
    foldCard: foldCardSchema,
    carrierId: { type: Type.STRING, enum: carrierIds },
    carriersShoppedNames: { type: Type.ARRAY, items: { type: Type.STRING } },
    quoteNumber: { type: Type.STRING },
    effectiveDate: { type: Type.STRING },
    expiryDate: { type: Type.STRING },
    quoteDate: { type: Type.STRING },
    policyType: { type: Type.STRING, enum: ['HO3', 'DP1', 'DP2', 'DP3'] },
    annualPremium: { type: Type.NUMBER },
    basePremium: { type: Type.NUMBER },
    fees: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          isFee: { type: Type.BOOLEAN },
        },
      },
    },
    propertyAddress: { type: Type.STRING },
    yearBuilt: { type: Type.NUMBER },
    squareFeet: { type: Type.NUMBER, nullable: true },
    constructionType: { type: Type.STRING, nullable: true },
    roofYear: { type: Type.NUMBER, nullable: true },
    roofMaterial: { type: Type.STRING, nullable: true },
    protectionClass: { type: Type.STRING, nullable: true },
    fireDistance: { type: Type.STRING, nullable: true },
    hasMonitoredAlarm: { type: Type.BOOLEAN, nullable: true },
    coverages: {
      type: Type.OBJECT,
      properties: {
        coverageA: { type: Type.NUMBER },
        coverageB: { type: Type.NUMBER },
        coverageC: { type: Type.NUMBER },
        coverageD: { type: Type.STRING },
        coverageE: { type: Type.NUMBER },
        coverageF: { type: Type.NUMBER },
      },
    },
    allPerilDeductible: { type: Type.NUMBER },
    windHailDeductible: { type: Type.NUMBER, nullable: true },
    endorsements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          name: { type: Type.STRING },
          subLabel: { type: Type.STRING },
          amount: { type: Type.STRING },
        },
      },
    },
    discounts: { type: Type.ARRAY, items: discountSchema },
    dwellingLossSettlement: { type: Type.STRING, enum: ['Replacement Cost', 'Actual Cash Value'] },
    personalPropertyLossSettlement: { type: Type.STRING, enum: ['Replacement Cost', 'Actual Cash Value'] },
    roofWarning: { type: Type.BOOLEAN },
    hasSurplusLines: { type: Type.BOOLEAN },
    hasBindingContingency: { type: Type.BOOLEAN },
  },
};

const motorcycleSchema = {
  type: Type.OBJECT,
  properties: {
    templateType: { type: Type.STRING, enum: ['motorcycle'] },
    clientFirstName: { type: Type.STRING },
    clientFullName: { type: Type.STRING },
    clientEmail: { type: Type.STRING },
    heroImageUrl: { type: Type.STRING, nullable: true },
    carrierId: { type: Type.STRING, enum: carrierIds },
    carrierLegalEntity: { type: Type.STRING },
    carriersShoppedNames: { type: Type.ARRAY, items: { type: Type.STRING } },
    quoteNumber: { type: Type.STRING },
    quoteDate: { type: Type.STRING },
    effectiveDate: { type: Type.STRING },
    expiryDate: { type: Type.STRING },
    annualPremium: { type: Type.NUMBER },
    showMonthlyHero: { type: Type.BOOLEAN },
    downPayment: { type: Type.NUMBER, nullable: true },
    recurringPayment: { type: Type.NUMBER, nullable: true },
    installmentCount: { type: Type.NUMBER, nullable: true },
    pifTotal: { type: Type.NUMBER, nullable: true },
    pifSavings: { type: Type.NUMBER, nullable: true },
    layupAvailable: { type: Type.BOOLEAN },
    layupSavings: { type: Type.NUMBER, nullable: true },
    layupMonths: { type: Type.STRING, nullable: true },
    bike: {
      type: Type.OBJECT,
      properties: {
        year: { type: Type.NUMBER },
        make: { type: Type.STRING },
        model: { type: Type.STRING },
        trim: { type: Type.STRING, nullable: true },
        vin: { type: Type.STRING },
        engine: { type: Type.STRING },
        bikeType: { type: Type.STRING, enum: ['Cruiser', 'Sport', 'Sport-Touring', 'Touring', 'Standard', 'Adventure', 'Dual-Sport', 'Dirt', 'Scooter', 'Trike', 'Custom', 'Vintage'] },
        mileage: { type: Type.NUMBER, nullable: true },
        garagingZip: { type: Type.STRING },
        storageType: { type: Type.STRING, nullable: true },
        purchasePrice: { type: Type.NUMBER, nullable: true },
        agreedValue: { type: Type.NUMBER, nullable: true },
        lienholderName: { type: Type.STRING, nullable: true },
        aftermarketModifications: { type: Type.ARRAY, items: { type: Type.STRING } },
        photoUrl: { type: Type.STRING, nullable: true },
      },
    },
    riders: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          age: { type: Type.NUMBER },
          relationship: { type: Type.STRING, enum: ['insured', 'spouse', 'co_rider', 'other', 'excluded'] },
          yearsRiding: { type: Type.NUMBER },
          classMYear: { type: Type.NUMBER, nullable: true },
          msfYear: { type: Type.NUMBER, nullable: true },
        },
      },
    },
    coverages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          name: { type: Type.STRING },
          subLabel: { type: Type.STRING },
          limit: { type: Type.STRING },
          annualPremium: { type: Type.NUMBER, nullable: true },
          status: { type: Type.STRING, enum: ['included', 'optional', 'credit', 'not_included'] },
        },
      },
    },
    discounts: { type: Type.ARRAY, items: discountSchema },
    hasActionRequired: { type: Type.BOOLEAN },
    actionRequiredReason: { type: Type.STRING, nullable: true },
    hasSurplusLines: { type: Type.BOOLEAN },
  },
};

const rentersSchema = {
  type: Type.OBJECT,
  properties: {
    templateType: { type: Type.STRING, enum: ['renters'] },
    clientFirstName: { type: Type.STRING },
    clientFullName: { type: Type.STRING },
    clientEmail: { type: Type.STRING },
    heroImageUrl: { type: Type.STRING, nullable: true },
    carrierId: { type: Type.STRING, enum: carrierIds },
    carrierLegalEntity: { type: Type.STRING },
    carriersShoppedNames: { type: Type.ARRAY, items: { type: Type.STRING } },
    quoteNumber: { type: Type.STRING },
    quoteDate: { type: Type.STRING },
    effectiveDate: { type: Type.STRING },
    expiryDate: { type: Type.STRING },
    annualPremium: { type: Type.NUMBER },
    showMonthlyHero: { type: Type.BOOLEAN },
    downPayment: { type: Type.NUMBER, nullable: true },
    recurringPayment: { type: Type.NUMBER, nullable: true },
    installmentCount: { type: Type.NUMBER, nullable: true },
    pifTotal: { type: Type.NUMBER, nullable: true },
    pifSavings: { type: Type.NUMBER, nullable: true },
    bundleSavings: { type: Type.NUMBER, nullable: true },
    bundledWithAuto: { type: Type.BOOLEAN },
    renterProfile: { type: Type.STRING, enum: ['first_time', 'experienced', 'condo', 'single_family', 'roommate', 'short_term', 'mobile_home', 'bundled_auto'] },
    unit: {
      type: Type.OBJECT,
      properties: {
        streetAddress: { type: Type.STRING },
        city: { type: Type.STRING },
        state: { type: Type.STRING },
        zip: { type: Type.STRING },
        unitType: { type: Type.STRING, enum: ['apartment', 'condo', 'townhome', 'single_family', 'mobile_home', 'short_term'] },
        leaseStartDate: { type: Type.STRING, nullable: true },
        occupants: { type: Type.NUMBER, nullable: true },
        priorRentersInsurance: { type: Type.BOOLEAN, nullable: true },
        gatedCommunity: { type: Type.BOOLEAN, nullable: true },
        fireSprinklers: { type: Type.BOOLEAN, nullable: true },
        monitoredAlarm: { type: Type.BOOLEAN, nullable: true },
      },
    },
    insureds: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          age: { type: Type.NUMBER },
          relationship: { type: Type.STRING, enum: ['named_insured', 'spouse', 'domestic_partner', 'family_member', 'co_insured'] },
        },
      },
    },
    coverages: {
      type: Type.OBJECT,
      properties: {
        coverageC: { type: Type.NUMBER },
        coverageCSettlement: { type: Type.STRING, enum: ['Replacement Cost', 'Actual Cash Value'] },
        coverageD: { type: Type.STRING },
        coverageDPercentage: { type: Type.NUMBER, nullable: true },
        coverageE: { type: Type.NUMBER },
        coverageF: { type: Type.NUMBER },
        deductible: { type: Type.NUMBER },
      },
    },
    endorsements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          name: { type: Type.STRING },
          subLabel: { type: Type.STRING },
          limit: { type: Type.STRING },
          annualPremium: { type: Type.NUMBER, nullable: true },
          status: { type: Type.STRING, enum: ['included', 'optional'] },
        },
      },
    },
    discounts: { type: Type.ARRAY, items: discountSchema },
    landlordRequiresCoi: { type: Type.BOOLEAN },
    landlordName: { type: Type.STRING, nullable: true },
    landlordAddress: { type: Type.STRING, nullable: true },
    unrelatedRoommateNote: { type: Type.STRING, nullable: true },
    pets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING },
          breed: { type: Type.STRING, nullable: true },
          count: { type: Type.NUMBER },
        },
      },
    },
    animalLiabilityLimit: { type: Type.STRING, nullable: true },
  },
};

const dwellingSchema = {
  type: Type.OBJECT,
  properties: {
    templateType: { type: Type.STRING, enum: ['dwelling'] },
    clientFirstName: { type: Type.STRING },
    clientFullName: { type: Type.STRING },
    clientEmail: { type: Type.STRING },
    heroImageUrl: { type: Type.STRING, nullable: true },
    carrierId: { type: Type.STRING, enum: carrierIds },
    carrierLegalEntity: { type: Type.STRING },
    carriersShoppedNames: { type: Type.ARRAY, items: { type: Type.STRING } },
    quoteNumber: { type: Type.STRING },
    quoteDate: { type: Type.STRING },
    effectiveDate: { type: Type.STRING },
    expiryDate: { type: Type.STRING },
    formCode: { type: Type.STRING, enum: ['DP-1', 'DP-2', 'DP-3', 'DP-0003'] },
    annualPremium: { type: Type.NUMBER },
    basePremium: { type: Type.NUMBER, nullable: true },
    surplusTax: { type: Type.NUMBER, nullable: true },
    policyFee: { type: Type.NUMBER, nullable: true },
    isSurplusLines: { type: Type.BOOLEAN },
    surplusCarrierLegalEntity: { type: Type.STRING, nullable: true },
    surplusTaxRate: { type: Type.NUMBER, nullable: true },
    surplusPlacementReason: { type: Type.STRING, nullable: true },
    showMonthlyHero: { type: Type.BOOLEAN },
    property: {
      type: Type.OBJECT,
      properties: {
        streetAddress: { type: Type.STRING },
        city: { type: Type.STRING },
        state: { type: Type.STRING },
        zip: { type: Type.STRING },
        yearBuilt: { type: Type.NUMBER },
        constructionType: { type: Type.STRING, nullable: true },
        roofType: { type: Type.STRING, nullable: true },
        roofAge: { type: Type.NUMBER, nullable: true },
        squareFeet: { type: Type.NUMBER, nullable: true },
        bedrooms: { type: Type.NUMBER, nullable: true },
        bathrooms: { type: Type.NUMBER, nullable: true },
        numberOfUnits: { type: Type.NUMBER },
        foundationType: { type: Type.STRING, nullable: true },
        hvacType: { type: Type.STRING, nullable: true },
        hvacAge: { type: Type.NUMBER, nullable: true },
        electricalAmps: { type: Type.NUMBER, nullable: true },
        panelType: { type: Type.STRING, nullable: true },
        plumbingType: { type: Type.STRING, nullable: true },
        protectionClass: { type: Type.STRING, nullable: true },
        hydrantDistance: { type: Type.STRING, nullable: true },
      },
    },
    rental: {
      type: Type.OBJECT,
      properties: {
        useType: { type: Type.STRING, enum: ['LTR', 'STR', 'Vacation', 'Inherited', 'Between Tenants', 'Vacant', 'House Hack', 'Owner-Financed', 'Multi-Unit'] },
        leaseType: { type: Type.STRING, enum: ['12-month', 'Month-to-month', 'Short-term/Airbnb', 'Vacant', 'Owner-use mix'] },
        currentStatus: { type: Type.STRING, enum: ['Tenant Occupied', 'Between Tenants', 'Vacant', 'Vacant for Renovation', 'Owner-Occupied Portion'] },
        monthlyRent: { type: Type.NUMBER },
        vacancyDurationDays: { type: Type.NUMBER, nullable: true },
        propertyManagerName: { type: Type.STRING, nullable: true },
        propertyManagerPhone: { type: Type.STRING, nullable: true },
        petsAllowed: { type: Type.BOOLEAN, nullable: true },
      },
    },
    owners: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          relationship: { type: Type.STRING, enum: ['Property Owner', 'Co-Owner', 'LLC', 'Trust', 'Estate'] },
          badge: { type: Type.STRING, enum: ['OWNER', 'CO-OWNER', 'LLC', 'TRUST', 'ESTATE'] },
        },
      },
    },
    mortgagee: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        lenderName: { type: Type.STRING },
        loanNumber: { type: Type.STRING, nullable: true },
      },
    },
    coverages: {
      type: Type.OBJECT,
      properties: {
        coverageA: { type: Type.NUMBER },
        coverageASettlement: { type: Type.STRING, enum: ['Replacement Cost', 'Actual Cash Value'] },
        coverageB: { type: Type.NUMBER },
        coverageBSettlement: { type: Type.STRING, enum: ['Replacement Cost', 'Actual Cash Value'] },
        coverageC: { type: Type.NUMBER },
        coverageCSettlement: { type: Type.STRING, enum: ['Replacement Cost', 'Actual Cash Value'] },
        coverageD: { type: Type.NUMBER },
        coverageE: { type: Type.NUMBER },
        liability: { type: Type.NUMBER },
        medicalPayments: { type: Type.NUMBER },
        deductible: { type: Type.NUMBER },
        windHailDeductible: { type: Type.STRING },
      },
    },
    endorsements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          name: { type: Type.STRING },
          subLabel: { type: Type.STRING },
          limit: { type: Type.STRING },
          annualPremium: { type: Type.NUMBER, nullable: true },
          status: { type: Type.STRING, enum: ['included', 'optional'] },
        },
      },
    },
    discounts: { type: Type.ARRAY, items: discountSchema },
    showEducationCard: { type: Type.BOOLEAN },
    propertyPhotoUrl: { type: Type.STRING, nullable: true },
  },
};

const buildPrompt = (quoteType: QuoteType, instructions: string) => `
You extract structured data from insurance carrier quote PDFs for Bill Layne Insurance Agency.
Return only JSON matching the provided schema. Extract only what the document actually shows — never invent coverages, drivers, vehicles, or discounts that are not present.

Template type: ${quoteType}
User notes: ${instructions || 'None'}

FORMATTING RULES (apply to every line of business):
- Money fields are plain numbers: 669.24, not "$669.24" or "669,24". Never include a dollar sign or thousands commas.
- Dates are YYYY-MM-DD. If the expiration / term-end date is not printed, estimate it from the effective date plus the term (auto: termMonths; home, dwelling, renters, motorcycle: 12 months).
- Liability and UM/UIM split limits (the *Limit string* fields) use thousands shorthand "per-person/per-accident": write 50/100 for $50,000/$100,000, or 100/300 for $100,000/$300,000. The single property-damage limit string uses the plain number in thousands: 50 means $50,000. Do NOT spell out full dollar amounts inside limit strings.
- Deductibles and dollar-amount fields that are plain numbers (medicalPayments, comprehensiveDeductible, collisionDeductible) are the actual dollar value: medicalPayments 1000 means $1,000; a 500 deductible is 500.
- Discounts must be ACTUAL discounts shown on the quote. Never pad the list with generic agency or service phrases (no "Independent Agency Review", "Coverage Review", "Local Service", etc.). Use short labels such as Multi-Car, Multi-Policy, Homeowner, Paperless, Paid in Full, Continuous Insurance, Advance Quote, Good Driver, Safety Course. Each discount is { "emoji": "", "label": "..." } and emoji may be blank. If none are shown, return an empty array.
- VIN fields: provide the last 8 characters of the VIN (or the last 4 if only those are visible). Never output a full 17-character VIN.

Carrier id rules:
- Progressive => progressive
- Nationwide => nationwide
- National General => national_general
- Travelers => travelers
- Alamance Farmers => alamance
- NC Grange Mutual => ncgrange
- Foremost => foremost
- Hagerty => hagerty
- NCJUA => ncjua
- Dairyland => dairyland
- Steadily/Fortegra => steadily
- American Zurich => american_zurich

Defaults:
- clientEmail may be blank if not visible.
- heroImageUrl should be blank unless the user notes include a usable image link — either a direct https image URL ending in .jpg, .jpeg, .png, .webp, or .gif, or a single-image Imgur share link such as https://imgur.com/AbCdEfG. Never use an Imgur album or gallery link (anything containing /a/ or /gallery/).
- carriersShoppedNames should include the chosen carrier first. If other shopped carriers are not visible, include reasonable agency defaults for that line of business.
- quoteNumber should use the visible quote number; if missing, build a short quote id from carrier and quote date.
- foldCard is optional and is used only for print brochure output. Fill only values that are visible in the PDF or strongly implied by the selected payment plan. Use customerAddress for the visible insured mailing address or property address. Use priorCarrier only when prior insurance is shown. setupCharge is a visible policy/setup/down-payment fee if separate from premium. paymentSchedule is a short billing plan such as "$173.22 down, then 5 payments of $102.18". coverageAlert is a one-sentence staff review note about important deductibles, exclusions, inspection/binding requirements, liability-only vehicles, or missing items. qrLink should be blank unless user notes include a specific customer URL. productStrip and agentImageUrl should be blank unless user notes include them.

AUTO instructions:
- templateType must be "auto".
- Extract total policy premium and term months. If term is unclear, use 6.
- EFT monthly payment: down payment, recurring amount, recurring count. If absent, estimate recurringAmount as totalPremium / termMonths and recurringCount as termMonths.
- Paid-in-full total and savings. If no discount, set total to totalPremium and savings to 0.
- Vehicles: include year, make, model, VIN last 8, garaging ZIP, vehicle premium if visible.
- coverageType is full_coverage if comprehensive or collision appears for that vehicle; otherwise liability_only.
- For EACH vehicle, extract itemized vehicle-specific coverages into vehicle.coverages.
- Include liability/UM coverages that apply to that vehicle, plus comprehensive/collision/rental/towing/roadside if shown.
- If a vehicle is liability only, include Comprehensive and Collision as status "rejected" with limitOrDeductible "Not included" when the quote makes that clear.
- Use short names such as Liability, Comprehensive, Collision, Rental Reimbursement, Towing, Medical Payments, Uninsured Motorist.
- Use premium only when a vehicle-level premium per coverage is visible; otherwise omit or null.
- Drivers: identify relationship and age if visible. isTeen is true when age < 21.
- Coverage limits: BI, PD, UM, UIM, Med Pay, comp/collision deductibles, rental, towing.
- Discounts should be objects with emoji and label.

HOME instructions:
- templateType must be "home".
- Extract policy type as HO3, DP1, DP2, or DP3.
- Extract annualPremium, basePremium, and fees.
- Coverages A, B, C, D, E, F are required. Coverage D may be "Included" if no dollar limit is shown.
- TIV is NOT a schema field; the app computes A+B+C.
- Extract all-peril deductible and wind/hail deductible if separate.
- Endorsements should include name, subLabel, amount, and emoji.
- Set hasSurplusLines true for Steadily/Fortegra/surplus lines.
- Set hasBindingContingency true if photos, inspection, or underwriting approval are required before binding.

MOTORCYCLE instructions:
- templateType must be "motorcycle".
- Extract annualPremium as the main premium. If the quote emphasizes an installment plan, set showMonthlyHero true; otherwise false.
- Extract downPayment, recurringPayment, installmentCount, pifTotal, and pifSavings when shown.
- Carrier legal entity matters: Progressive motorcycle is usually Progressive Casualty Insurance Company, Dairyland is Dairyland Insurance Company, Foremost is Foremost Insurance Company Grand Rapids, Michigan, National General is usually Integon Indemnity Corporation in NC.
- Bike fields are required: year, make, model, VIN, engine cc/ci, bikeType, garagingZip. Never call VIN "HIN".
- bikeType must be one of Cruiser, Sport, Sport-Touring, Touring, Standard, Adventure, Dual-Sport, Dirt, Scooter, Trike, Custom, Vintage.
- Capture riders with yearsRiding, Class M year, and MSF year when visible. Years riding is not the same as auto years licensed.
- Coverage rows must include both official coverage name and plain-English subLabel.
- Always include Custom Parts & Equipment (CPE) with the specific limit. If absent, use limit "Confirm selected limit" and status "optional".
- Use these exact plain-English subLabels when possible: Bodily Injury Liability = "Pays for injuries you cause to others. Required by NC."; Property Damage Liability = "Pays for damage you cause to other vehicles or property."; Comprehensive = "Theft, fire, vandalism, falling objects, weather."; Collision = "Crash damage to your bike - at-fault or otherwise."; Custom Parts & Equipment = "Aftermarket parts: chrome, exhaust, seats, paint, audio, saddlebags."
- Set layupAvailable true if layup/storage credit is shown or recommended; include layupSavings and layupMonths when visible.
- Do not invent a bike photo URL. Leave bike.photoUrl blank unless a direct usable image URL appears in user notes.

RENTERS instructions:
- templateType must be "renters".
- Renters is HO-4. Do not extract or invent Coverage A or Coverage B.
- Coverage C Personal Property is the hero coverage; extract it first and set coverages.coverageC.
- Extract annualPremium as the main premium. If the quote emphasizes a monthly installment, set showMonthlyHero true; otherwise false.
- Extract downPayment, recurringPayment, installmentCount, pifTotal, and pifSavings when shown. Only set pifSavings above 0 when a real savings is shown.
- If bundled with auto is shown, set bundledWithAuto true and bundleSavings to the combined annual savings when visible.
- Carrier legal entity matters: Travelers renters is usually The Travelers Indemnity Company; Progressive renters is usually Progressive Northwestern Insurance Company; Nationwide renters is usually Nationwide Mutual Fire Insurance Company; National General renters is usually Integon Indemnity Corporation; Foremost is Foremost Insurance Company Grand Rapids, Michigan.
- Unit fields are required: streetAddress, city, state, zip, and unitType. Unit type must be apartment, condo, townhome, single_family, mobile_home, or short_term.
- Renter profile should be first_time unless the PDF/user notes clearly show experienced renter, condo, single family, roommate, short term, mobile home, or bundled auto.
- Coverage rows: coverageC, coverageD, coverageE, coverageF, deductible. coverageCSettlement must be Replacement Cost or Actual Cash Value.
- Endorsements should only include endorsements actually on the quote, such as Identity Fraud, Water Backup, Scheduled Personal Property, Loss Assessment, Equipment Breakdown, or Animal Liability.
- If the landlord or apartment complex requires proof, set landlordRequiresCoi true and include landlordName/address when visible.
- If unrelated roommates are mentioned but not insured, include unrelatedRoommateNote.

DWELLING FIRE / RENTAL PROPERTY instructions:
- templateType must be "dwelling".
- This is for DP-1, DP-2, DP-3, and DP-0003 rental dwelling policies. Do not use the HO-3 homeowners schema.
- Identify formCode exactly as DP-1, DP-2, DP-3, or DP-0003. Steadily often uses DP-0003.
- Extract annualPremium as total annual premium including surplus lines tax and policy fees when applicable.
- Set isSurplusLines true for Steadily/Fortegra or any non-admitted/surplus placement. For Steadily, surplusCarrierLegalEntity is Fortegra Specialty Insurance Company.
- Extract surplusTax, policyFee, surplusTaxRate, and surplusPlacementReason when visible. Do not calculate surplus tax if not shown; leave values null.
- Property fields: full address, year built, construction, roof type/age, square feet, bedrooms/baths, units, foundation, HVAC, electrical, plumbing, protection class as the numeric fire protection class when visible, and fire station or hydrant distance when visible.
- Rental fields: useType, leaseType, currentStatus, monthlyRent, vacancy duration, property manager, pets allowed. Use LTR for standard long-term rentals and STR for Airbnb/VRBO.
- Coverage C is landlord personal property only. It does NOT cover tenant belongings.
- Coverage D is Fair Rental Value / Loss of Rents. It is the landlord's lost rental income, not tenant Loss of Use.
- Extract Coverage A, B, C, D, E, liability, med pay, all-other-perils deductible, and wind/hail deductible. Wind/Hail must be a separate string because it may be a percentage.
- Set coverage settlements to Replacement Cost or Actual Cash Value based on the quote; if unclear, use Replacement Cost for A/B on DP-3 and Actual Cash Value for C.
- Include only endorsements shown on the quote, such as Water Backup, Mold/Fungi, Ordinance or Law, Vacancy, Animal Liability, Equipment Breakdown, Service Line, or Short-Term Rental.
- showEducationCard should be true for first-time landlords, STR, vacant, inherited, or unusual use. It can be false for experienced standard LTR landlords.
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

  const { base64Data, mimeType, instructions, quoteType } = body ?? ({} as RequestBody);
  if (!base64Data || !mimeType || !quoteType) {
    return jsonResponse({ error: 'Missing required fields: base64Data, mimeType, quoteType.' }, 400);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: buildPrompt(quoteType, instructions) },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: quoteType === 'auto' ? autoSchema : quoteType === 'home' ? homeSchema : quoteType === 'motorcycle' ? motorcycleSchema : quoteType === 'renters' ? rentersSchema : dwellingSchema,
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
