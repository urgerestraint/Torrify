const DEFAULT_BASE_URL = 'https://the-gatekeeper-production.up.railway.app'
const DEFAULT_MODEL = 'openai/gpt-4o-mini'

function readArg(name) {
  const prefix = `--${name}=`
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith(prefix)) {
      return arg.slice(prefix.length)
    }
  }
  return undefined
}

function resolveEndpoint() {
  const explicitEndpoint = readArg('endpoint') || process.env.GATEWAY_ENDPOINT
  if (explicitEndpoint) {
    return explicitEndpoint.replace(/\/$/, '')
  }
  const baseUrl = readArg('base-url') || process.env.GATEWAY_BASE_URL || DEFAULT_BASE_URL
  return `${baseUrl.replace(/\/$/, '')}/api/chat`
}

const licenseKey = readArg('key') || process.env.GATEWAY_LICENSE_KEY || process.env.GATEWAY_TEST_LICENSE_KEY
const model = readArg('model') || process.env.GATEWAY_MODEL || DEFAULT_MODEL
const message = readArg('message') || 'Say "gateway ok" and nothing else.'

if (!licenseKey || !licenseKey.trim()) {
  console.error('Missing license key. Provide --key=... or set GATEWAY_LICENSE_KEY.')
  process.exit(1)
}

const endpoint = resolveEndpoint()

console.log(`Gateway endpoint: ${endpoint}`)
console.log(`Model: ${model}`)

const payload = {
  model,
  messages: [
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'user', content: message }
  ],
  stream: false,
  temperature: 0.2,
  max_tokens: 64
}

try {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-License-Key': licenseKey.trim()
    },
    body: JSON.stringify(payload)
  })

  const responseText = await response.text()
  if (!response.ok) {
    console.error(`Gateway response: ${response.status} ${response.statusText}`)
    console.error(responseText || '(no response body)')
    process.exit(1)
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch (parseError) {
    console.error('Gateway returned non-JSON response.')
    console.error(responseText)
    process.exit(1)
  }

  const content = data?.choices?.[0]?.message?.content
  console.log('Gateway response content:')
  console.log(content ?? '(missing content)')
  console.log('Usage:', data?.usage ?? {})
} catch (error) {
  console.error('Gateway request failed:', error?.message ?? error)
  process.exit(1)
}
