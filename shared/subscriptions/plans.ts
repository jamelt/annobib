export interface PlanLimits {
  entries: number
  projects: number
  collaboratorsPerProject: number
  customCitationStyles: number
  metadataEnrichmentPerMonth: number
  aiAnnotationsPerMonth: number
  voiceMinutesPerMonth: number
  excelPresets: number
  customColumns: number
}

export interface PlanPricing {
  monthly: number
  yearly: number
}

export interface PlanUI {
  color: string
  badgeColor: string
  chartClass: string
  textClass: string
  highlighted: boolean
  cta: string
}

export interface PlanStripeConfig {
  productName: string
  productDescription: string
}

export interface SubscriptionPlan {
  id: string
  name: string
  shortName: string
  description: string
  sortOrder: number
  pricing: PlanPricing | null
  limits: PlanLimits
  features: string[]
  featureHighlights: string[]
  limitations: string[]
  ui: PlanUI
  stripe: PlanStripeConfig | null
}

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    shortName: 'Free',
    description: 'Perfect for getting started',
    sortOrder: 0,
    pricing: null,
    limits: {
      entries: 50,
      projects: 3,
      collaboratorsPerProject: 0,
      customCitationStyles: 0,
      metadataEnrichmentPerMonth: 10,
      aiAnnotationsPerMonth: 0,
      voiceMinutesPerMonth: 0,
      excelPresets: 1,
      customColumns: 0,
    },
    features: ['bibtex-export', 'basic-search', 'voice-input'],
    featureHighlights: [
      '50 entries',
      '3 projects',
      'BibTeX export',
      'Basic search',
      '10 metadata enrichments/month',
    ],
    limitations: [
      'No PDF/Excel export',
      'No custom citation styles',
      'No collaboration',
      'No AI features',
    ],
    ui: {
      color: 'neutral',
      badgeColor: 'neutral',
      chartClass: 'bg-gray-500',
      textClass: 'text-gray-500 dark:text-gray-400',
      highlighted: false,
      cta: 'Get Started',
    },
    stripe: null,
  },
  light: {
    id: 'light',
    name: 'Light',
    shortName: 'Light',
    description: 'For active researchers',
    sortOrder: 100,
    pricing: { monthly: 900, yearly: 9000 },
    limits: {
      entries: 500,
      projects: 15,
      collaboratorsPerProject: 3,
      customCitationStyles: 3,
      metadataEnrichmentPerMonth: 100,
      aiAnnotationsPerMonth: 5,
      voiceMinutesPerMonth: 10,
      excelPresets: 5,
      customColumns: 3,
    },
    features: [
      'bibtex-export',
      'basic-search',
      'voice-input',
      'pdf-export',
      'docx-export',
      'excel-export',
      'custom-citation-styles',
      'collaboration',
      'ai-annotations',
      'mind-maps',
      'whisper-voice',
    ],
    featureHighlights: [
      '500 entries',
      '15 projects',
      'PDF, Excel, BibTeX export',
      '3 custom citation styles',
      '100 metadata enrichments/month',
      '3 collaborators per project',
      'Basic mind maps',
      '5 AI annotations/month',
      '10 min voice transcription/month',
    ],
    limitations: [],
    ui: {
      color: 'blue',
      badgeColor: 'info',
      chartClass: 'bg-blue-500',
      textClass: 'text-blue-500 dark:text-blue-400',
      highlighted: true,
      cta: 'Start Free Trial',
    },
    stripe: {
      productName: 'Bibanna Light',
      productDescription: 'For active researchers - 500 entries, 15 projects, PDF export',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    shortName: 'Pro',
    description: 'For power users',
    sortOrder: 200,
    pricing: { monthly: 1900, yearly: 19000 },
    limits: {
      entries: Infinity,
      projects: Infinity,
      collaboratorsPerProject: Infinity,
      customCitationStyles: Infinity,
      metadataEnrichmentPerMonth: Infinity,
      aiAnnotationsPerMonth: 50,
      voiceMinutesPerMonth: 60,
      excelPresets: Infinity,
      customColumns: Infinity,
    },
    features: [
      'bibtex-export',
      'basic-search',
      'voice-input',
      'pdf-export',
      'docx-export',
      'excel-export',
      'custom-citation-styles',
      'collaboration',
      'ai-annotations',
      'mind-maps',
      'whisper-voice',
      'semantic-search',
      'ai-context',
      'research-companion',
      'full-mind-maps',
      'veritas-score',
      'multimodal-ai',
    ],
    featureHighlights: [
      'Unlimited entries',
      'Unlimited projects',
      'All export formats',
      'Unlimited citation styles',
      'Unlimited metadata enrichment',
      'Unlimited collaborators',
      'Full mind maps with graph queries',
      'Semantic search',
      'Veritas Score credibility ratings',
      '50 AI annotations/month',
      '60 min voice transcription/month',
      'Research Companion AI assistant',
      'Multimodal AI (images/PDFs)',
      'Priority support',
    ],
    limitations: [],
    ui: {
      color: 'primary',
      badgeColor: 'warning',
      chartClass: 'bg-amber-500',
      textClass: 'text-amber-500 dark:text-amber-400',
      highlighted: false,
      cta: 'Start Free Trial',
    },
    stripe: {
      productName: 'Bibanna Pro',
      productDescription: 'For power users - Unlimited entries, AI features, Research Companion',
    },
  },
} as const satisfies Record<string, SubscriptionPlan>

export type SubscriptionTier = keyof typeof SUBSCRIPTION_PLANS
