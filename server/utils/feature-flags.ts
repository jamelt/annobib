const FLAG_PREFIX = 'FEATURE_FLAG_'

const DEFAULT_FLAGS: Record<string, boolean> = {
  'research-companion': true,
  'voice-input': true,
  'veritas-score': true,
  'mindmap-visualization': true,
  'excel-export': true,
  'pdf-export': true,
  'ai-metadata-extraction': true,
  'whisper-transcription': true,
  'custom-citation-styles': true,
  'project-sharing': true,
  'multimodal-embeddings': false,
  'auto-context-generation': false,
  'ai-annotation-generation': false,
  'topic-clustering': false,
  'camera-capture': false,
  'offline-mode': false,
}

function envKeyForFlag(flagName: string): string {
  return `${FLAG_PREFIX}${flagName.toUpperCase().replace(/-/g, '_')}`
}

export function isFeatureEnabled(featureName: string): boolean {
  const envKey = envKeyForFlag(featureName)
  const envValue = process.env[envKey]

  if (envValue !== undefined) {
    return envValue === 'true' || envValue === '1'
  }

  return DEFAULT_FLAGS[featureName] ?? false
}

export function getAllFeatureFlags(): Record<string, boolean> {
  const flags: Record<string, boolean> = {}

  for (const flagName of Object.keys(DEFAULT_FLAGS)) {
    flags[flagName] = isFeatureEnabled(flagName)
  }

  return flags
}

export function requireFeature(featureName: string): void {
  if (!isFeatureEnabled(featureName)) {
    throw createError({
      statusCode: 403,
      message: `Feature '${featureName}' is not available`,
    })
  }
}
