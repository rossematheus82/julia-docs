import {
  LEGAL_EFFECTIVE_DATE,
  LEGAL_PRIVACY_VERSION,
  LEGAL_TERMS_VERSION,
  PRIVACY_SECTIONS,
  TERMS_SECTIONS,
} from '@/lib/legal-content'

export function buildLegalAcceptanceSnapshot() {
  return {
    terms: {
      version: LEGAL_TERMS_VERSION,
      effective_date: LEGAL_EFFECTIVE_DATE,
      sections: TERMS_SECTIONS,
    },
    privacy: {
      version: LEGAL_PRIVACY_VERSION,
      effective_date: LEGAL_EFFECTIVE_DATE,
      sections: PRIVACY_SECTIONS,
    },
  }
}
