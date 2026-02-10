import * as path from 'path'
import * as os from 'os'

export const SETTINGS_DIR = path.join(os.homedir(), '.torrify')
export const SETTINGS_FILE = path.join(SETTINGS_DIR, 'settings.json')
export const LEGACY_SETTINGS_DIR = path.join(os.homedir(), '.opencursor')
export const LEGACY_SETTINGS_FILE = path.join(LEGACY_SETTINGS_DIR, 'settings.json')

export const TEMP_DIR = path.join(os.tmpdir(), 'torrify')

export const GATEWAY_BASE_URL = process.env.GATEWAY_URL || 'https://the-gatekeeper-production.up.railway.app'

export const OPENSCAD_RENDER_CONFIG = {
  colorscheme: 'Tomorrow Night',
  camera: '0,0,0,50,0,25,500',
  imgsize: '800,600',
  projection: 'ortho' as const
}

export const OPENSCAD_TIMEOUT_MS = 30000
export const MAX_OUTPUT_FILE_SIZE = 250 * 1024 * 1024 // 250MB (covers complex/SVG-derived STLs; 1GB would strain memory when base64-decoded)
export const MAX_PROCESS_BUFFER_SIZE = 1 * 1024 * 1024 // 1MB for stderr/stdout
export const MAX_PROJECT_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const MAX_RECENT_FILES = 10
export const MAX_SCAD_FILE_SIZE = 250 * 1024 * 1024 // 250MB
export const FETCH_TIMEOUT_MS = 30000
export const TEMP_FILE_MAX_AGE_MS = 60 * 60 * 1000 // 1 hour
export const MAX_CONTEXT_FILE_SIZE = 1024 * 1024 // 1MB
