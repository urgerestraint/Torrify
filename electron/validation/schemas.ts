import { z } from 'zod'

// Size limits
export const MAX_CODE_SIZE = 1024 * 1024 // 1MB
export const MAX_PATH_LENGTH = 1024 // 1KB
export const MAX_SETTINGS_SIZE = 10 * 1024 // 10KB

// Core schemas
export const CodeSchema = z.string().max(MAX_CODE_SIZE)

export const CADBackendSchema = z.enum(['openscad', 'build123d'])

export const LLMProviderSchema = z.enum([
  'gemini',
  'openai',
  'anthropic',
  'custom',
  'openrouter',
  'ollama',
  'gateway'
])

export const SettingsSchema = z.object({
  cadBackend: CADBackendSchema,
  openscadPath: z.string().max(512),
  build123dPythonPath: z.string().max(512),
  llm: z.object({
    provider: LLMProviderSchema,
    model: z.string().max(100),
    apiKey: z.string().max(500),
    enabled: z.boolean(),
    customEndpoint: z.string().max(512).optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().min(1).max(100000).optional(),
    gatewayBaseUrl: z.string().max(512).optional(),
    gatewayLicenseKey: z.string().max(500).optional()
  }),
  recentFiles: z
    .array(
      z.object({
        filePath: z.string().max(MAX_PATH_LENGTH),
        lastOpened: z.string()
      })
    )
    .max(10)
    .optional()
    .default([]),
  hasSeenDemo: z.boolean().optional()
})

export const FilePathSchema = z.string().max(MAX_PATH_LENGTH)

export const GatewayRequestSchema = z.object({
  licenseKey: z.string().max(500).optional(),
  body: z.unknown().optional()
})

export const WindowTitleSchema = z.string().max(256)
