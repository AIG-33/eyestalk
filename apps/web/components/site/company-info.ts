/**
 * Single source of truth for legal/company info shown across the public site
 * and inside Privacy Policy / Terms of Service pages.
 *
 * Operating entity: SAMPLIFY FZCO — a Free Zone Company licensed by Dubai
 * Silicon Oasis Authority (DSOA), United Arab Emirates.
 */
export const COMPANY = {
  // Public brand
  brand: 'EyesTalk',
  domain: 'eyestalk.app',
  url: 'https://eyestalk.app',
  tagline: 'From a glance to a conversation',

  // Operating entity (UAE Free Zone Company)
  legalName: 'SAMPLIFY FZCO',
  legalNameFull: 'SAMPLIFY FZCO',
  legalNameRu: 'SAMPLIFY FZCO',

  // UAE registration identifiers
  licenseNumber: '10142',
  licenseAuthority: 'Dubai Silicon Oasis Authority (DSOA)',
  licenseAuthorityRu: 'Dubai Silicon Oasis Authority (DSOA)',
  taxNumber: '104045419900003', // UAE Federal Tax Authority TRN
  dunsNumber: '850103731',

  // Postal address
  address:
    'Building A2, Office 101, Dubai Digital Park, Dubai Silicon Oasis, Dubai, United Arab Emirates',
  addressRu:
    'Building A2, Office 101, Dubai Digital Park, Dubai Silicon Oasis, Дубай, Объединённые Арабские Эмираты',
  addressShort: 'Dubai Silicon Oasis, Dubai, UAE',

  // Contacts
  email: 'admin@eyestalk.app',
  legalEmail: 'admin@eyestalk.app',

  // Governing law / jurisdiction
  governingLaw: 'United Arab Emirates',
  governingLawRu: 'Объединённые Арабские Эмираты',
  governingLawCourtsCity: 'Dubai',
  governingLawCourtsCityRu: 'Дубай',

  // Document versions / dates
  privacyVersion: '1.0',
  privacyEffectiveDate: 'April 25, 2026',
  privacyEffectiveDateRu: '25 апреля 2026 г.',
  termsVersion: '1.0',
  termsEffectiveDate: 'April 25, 2026',
  termsEffectiveDateRu: '25 апреля 2026 г.',
} as const;
