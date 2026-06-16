export interface CarrierInfo {
  id: string;
  displayName: string;
  legalName: string;
  logoUrl: string | null;
  textPillMain?: string;
  textPillSub?: string;
  claimsPhone: string;
  portalUrl: string;
  isSurplusLines: boolean;
  type: 'standard' | 'specialty' | 'surplus';
}

export const CARRIERS = {
  progressive: {
    id: 'progressive',
    displayName: 'Progressive',
    legalName: 'Progressive Southeastern Insurance Company',
    logoUrl: 'https://i.imgur.com/7N1vfo0.png',
    claimsPhone: '1-800-274-4499',
    portalUrl: 'https://www.progressive.com/logindashboard',
    isSurplusLines: false,
    type: 'standard',
  },
  nationwide: {
    id: 'nationwide',
    displayName: 'Nationwide',
    legalName: 'Nationwide Mutual Insurance Company',
    logoUrl: 'https://i.imgur.com/Mv5V7tV.png',
    claimsPhone: '1-800-421-3535',
    portalUrl: 'https://www.nationwide.com/personal/manage-account',
    isSurplusLines: false,
    type: 'standard',
  },
  national_general: {
    id: 'national_general',
    displayName: 'National General',
    legalName: 'National General Insurance Company',
    logoUrl: 'https://i.imgur.com/HF8oPAF.png',
    claimsPhone: '1-800-468-3466',
    portalUrl: 'https://myagentportal.nationalgeneral.com',
    isSurplusLines: false,
    type: 'standard',
  },
  travelers: {
    id: 'travelers',
    displayName: 'Travelers',
    legalName: 'Travelers Indemnity Company',
    logoUrl: 'https://i.imgur.com/m6wsO1p.png',
    claimsPhone: '1-800-252-4633',
    portalUrl: 'https://www.travelers.com/account',
    isSurplusLines: false,
    type: 'standard',
  },
  alamance: {
    id: 'alamance',
    displayName: 'Alamance Farmers',
    legalName: 'Alamance Farmers Mutual Insurance Company',
    logoUrl: 'https://i.imgur.com/S8BVnvs.png',
    claimsPhone: '(336) 226-7872',
    portalUrl: 'https://www.alamancefarmers.com',
    isSurplusLines: false,
    type: 'standard',
  },
  ncgrange: {
    id: 'ncgrange',
    displayName: 'NC Grange Mutual',
    legalName: 'North Carolina Grange Mutual Insurance Company',
    logoUrl: 'https://i.imgur.com/Fesnkng.png',
    claimsPhone: '1-800-682-6079',
    portalUrl: 'https://www.ncgrange.com/policyholders',
    isSurplusLines: false,
    type: 'standard',
  },
  foremost: {
    id: 'foremost',
    displayName: 'Foremost',
    legalName: 'Foremost Insurance Group',
    logoUrl: 'https://i.imgur.com/rHIo4r5.jpg',
    claimsPhone: '1-800-527-3907',
    portalUrl: 'https://www.foremost.com/customer-service',
    isSurplusLines: false,
    type: 'specialty',
  },
  hagerty: {
    id: 'hagerty',
    displayName: 'Hagerty',
    legalName: 'Hagerty Insurance Agency, LLC',
    logoUrl: 'https://i.imgur.com/0UyINHi.png',
    claimsPhone: '1-800-922-4050',
    portalUrl: 'https://www.hagerty.com/apps/customer/login',
    isSurplusLines: false,
    type: 'specialty',
  },
  ncjua: {
    id: 'ncjua',
    displayName: 'NCJUA',
    legalName: 'North Carolina Joint Underwriting Association',
    logoUrl: 'https://i.imgur.com/oSJj6ZW.png',
    claimsPhone: '1-800-662-7048',
    portalUrl: 'https://www.ncjua-iua.org',
    isSurplusLines: false,
    type: 'specialty',
  },
  dairyland: {
    id: 'dairyland',
    displayName: 'Dairyland',
    legalName: 'Dairyland Insurance Company',
    logoUrl: 'https://i.imgur.com/1VkIvxv.png',
    claimsPhone: '1-800-334-0090',
    portalUrl: 'https://www.dairylandauto.com/my-account',
    isSurplusLines: false,
    type: 'specialty',
  },
  steadily: {
    id: 'steadily',
    displayName: 'Steadily',
    legalName: 'Fortegra Specialty Insurance Company',
    logoUrl: 'https://i.imgur.com/xzB0zD5.png',
    claimsPhone: '1-888-966-1611',
    portalUrl: 'https://www.steadily.com',
    isSurplusLines: true,
    type: 'surplus',
  },
  american_zurich: {
    id: 'american_zurich',
    displayName: 'American Zurich',
    legalName: 'American Zurich Insurance Company',
    logoUrl: null,
    textPillMain: 'AMERICAN ZURICH',
    textPillSub: 'Insurance Company',
    claimsPhone: '1-800-382-2150',
    portalUrl: '',
    isSurplusLines: false,
    type: 'specialty',
  },
} satisfies Record<string, CarrierInfo>;

export type CarrierId = keyof typeof CARRIERS;
