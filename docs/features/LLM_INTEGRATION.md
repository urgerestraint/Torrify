# LLM Integration Guide - Torrify

## Overview

Torrify now features a **flexible, multi-provider AI system** that integrates Large Language Models directly into the chat interface. The architecture is designed to support multiple LLM providers with easy extensibility.

## Features Implemented

### ✅ Current Capabilities

1. **Google Gemini Integration** (Fully Implemented)
   - Real AI-powered chat assistance
   - Context-aware responses (includes current code)
   - Conversation history tracking
   - Error handling and user feedback

2. **Multi-Provider Architecture**
   - Extensible design for multiple providers
   - Provider-specific configuration
   - Easy to add new providers

3. **Settings UI**
   - Provider selection dropdown
   - Model configuration
   - API key management (password-masked)
   - Enable/disable toggle
   - Temperature and token limits

4. **Context Awareness**
   - AI sees current code in editor
   - Maintains conversation history
   - Backend-aware system prompts

5. **Streaming Responses**
   - Live streaming with stop control
   - Fallback to non-streaming when unsupported

6. **Knowledge Base Context**
   - OpenSCAD/build123d API context injection

## Access Modes: PRO vs Free (BYOK/BYOM)

- **PRO (managed):** Uses the managed LLM gateway with a **license key**. You enter only your license key in Settings; the gateway URL is fixed and not shown. The app sends requests to the gateway, which proxies to OpenRouter and enforces licensing. Curated model list.
- **Free (BYOK/BYOM):** All other options—Gemini, OpenRouter (your own key), Ollama, etc. You bring your own API key or use local models.

Select **Access Mode** in Settings → AI Configuration: **PRO** for gateway + license key, **BYOK** to choose a provider and (where needed) enter your own API key.

## Supported Providers

### ✅ PRO (Gateway + License Key)
- **Status:** Fully functional
- **Credentials:** Gateway base URL + license key (stored in Settings)
- **Features:** Managed LLM via gateway; curated model list; streaming
- **Header:** Requests use `X-License-Key`; gateway proxies to OpenRouter

#### Configuring PRO

1. Open Settings (gear icon) → AI Configuration
2. Select **PRO** under Access Mode
3. Enter your **PRO License Key**
4. Choose model from the curated list
5. Click Save

### ✅ OpenRouter (BYOK)
- **Status:** Fully functional (BYOK only)
- **API Key:** Set `OPENROUTER_API_KEY` in your environment
- **Features:** Same curated model list; direct OpenRouter API

### ✅ Google Gemini (BYOK - Bring Your Own Key)
- **Status:** Fully functional
- **Models:** gemini-2.0-flash-exp, gemini-pro, etc.
- **API Key:** Required (get at https://makersuite.google.com/app/apikey)
- **Best For:** Users who want to use their own API key, free tier usage

### 🚧 OpenAI (Placeholder)
- **Status:** Architecture ready, not implemented
- **Models:** gpt-4-turbo-preview, gpt-3.5-turbo
- **API Key:** Required (get at https://platform.openai.com/api-keys)
- **Implementation:** Add to `src/services/llm/OpenAIService.ts`

### 🚧 Anthropic (Placeholder)
- **Status:** Architecture ready, not implemented
- **Models:** claude-3-5-sonnet-20241022, claude-3-opus
- **API Key:** Required (get at https://console.anthropic.com/)
- **Implementation:** Add to `src/services/llm/AnthropicService.ts`

### ✅ Ollama (Local)
- **Status:** Fully functional
- **Use Cases:** Local model hosting
- **API Key:** Not required

### 🚧 Custom (Placeholder)
- **Status:** Architecture ready, not implemented
- **Use Cases:** Custom endpoints or other local providers
- **Implementation:** Add to `src/services/llm/CustomService.ts`

## Architecture

### Service Layer

```
src/services/llm/
├── types.ts              # Shared interfaces
├── index.ts              # Factory pattern
├── GeminiService.ts      # Google Gemini implementation
├── OpenRouterService.ts  # OpenRouter implementation (BYOK)
├── GatewayService.ts     # Gateway implementation (PRO)
├── OllamaService.ts      # Ollama implementation (local)
├── OpenAIService.ts      # (TODO) OpenAI implementation
├── AnthropicService.ts   # (TODO) Anthropic implementation
└── CustomService.ts      # (TODO) Custom endpoints
```

### Interface Design

All LLM services implement the `LLMService` interface:

```typescript
interface LLMService {
  sendMessage(messages: LLMMessage[], currentCode?: string, cadBackend?: CADBackend, apiContext?: string): Promise<LLMResponse>
  streamMessage?(messages: LLMMessage[], onChunk: StreamCallback, currentCode?: string, cadBackend?: CADBackend, apiContext?: string): Promise<StreamController>
  supportsStreaming(): boolean
  getProviderName(): string
}
```

This ensures:
- Consistent API across providers
- Easy swapping between providers
- Type safety
- Testability

### Factory Pattern

The `createLLMService()` function instantiates the correct provider:

```typescript
const service = createLLMService(config)
const response = await service.sendMessage(messages, currentCode)
```

## Configuration

### Settings Structure

```json
{
  "openscadPath": "C:\\Program Files\\OpenSCAD (Nightly)\\openscad.exe",
  "llm": {
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "apiKey": "YOUR_API_KEY_HERE",
    "enabled": true,
    "temperature": 0.7,
    "maxTokens": 2048,
  "gatewayLicenseKey": ""
  }
}
```

- **PRO:** `provider` is `gateway`; use `gatewayLicenseKey` only (gateway URL is fixed in the app and not exposed).
- **BYOK OpenRouter:** `provider` is `openrouter`; set `OPENROUTER_API_KEY` in the environment (not in settings).

### Default Configuration

```typescript
{
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  apiKey: '',
  enabled: false,
  temperature: 0.7,
  maxTokens: 2048,
  gatewayLicenseKey: ''
}
```

### Settings Location

```
Windows: C:\Users\<username>\.torrify\settings.json
```

## Usage

### For Users

1. **Open Settings**
   - Click gear icon (⚙️) in top-right
   - Navigate to "AI Configuration" tab

2. **Configure Provider**
   - Choose **Access Mode:** PRO (gateway + license key) or BYOK (your own provider)
   - **PRO:** Enter PRO license key; choose model from curated list
   - **BYOK:** Select provider from dropdown (Gemini, OpenRouter, Ollama, etc.); enter API key if required; choose model
   - Adjust temperature/tokens if desired

3. **Enable AI**
   - Toggle "Enable AI Assistant" switch
   - Click "Save"

4. **Use Chat**
   - Type questions in chat panel
   - AI has context of your current code
   - Get OpenSCAD-specific help

### Example Interactions

**Code Generation:**
```
User: "Create a sphere with radius 15"
AI: "Here's the code: sphere(r=15, $fn=100);"
```

**Debugging:**
```
User: "Why isn't this rendering?"
AI: [Analyzes your current code and explains the issue]
```

**Learning:**
```
User: "What does $fn do?"
AI: "$fn controls the number of facets in curved surfaces..."
```

## System Prompt

The AI is configured with this system prompt:

```
You are an expert OpenSCAD assistant built into Torrify IDE.
You help users learn OpenSCAD, debug code, generate models, and explain concepts.
Be concise but helpful. Provide code examples when relevant.

Current code in editor:
```openscad
[user's current code]
```
```

This ensures:
- OpenSCAD expertise
- Code context awareness
- Helpful, focused responses

## Adding New Providers

### Step-by-Step Guide

#### 1. Install SDK

```bash
npm install <provider-sdk>
```

Example for OpenAI:
```bash
npm install openai
```

#### 2. Create Service Class

Create `src/services/llm/OpenAIService.ts`:

```typescript
import OpenAI from 'openai'
import type { LLMService, LLMMessage, LLMResponse, LLMConfig } from './types'

export class OpenAIService implements LLMService {
  private client: OpenAI
  private config: LLMConfig

  constructor(config: LLMConfig) {
    this.config = config
    this.client = new OpenAI({ apiKey: config.apiKey })
  }

  async sendMessage(messages: LLMMessage[], currentCode?: string): Promise<LLMResponse> {
    // Build system prompt with code context
    const systemMessage = {
      role: 'system',
      content: `You are an expert OpenSCAD assistant...${
        currentCode ? `\n\nCurrent code:\n${currentCode}` : ''
      }`
    }

    // Call OpenAI API
    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [systemMessage, ...messages],
      temperature: this.config.temperature || 0.7,
      max_tokens: this.config.maxTokens || 2048,
    })

    return {
      content: response.choices[0].message.content || '',
      model: this.config.model,
      usage: {
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        totalTokens: response.usage?.total_tokens || 0,
      }
    }
  }

  supportsStreaming(): boolean {
    return true
  }

  getProviderName(): string {
    return 'OpenAI'
  }
}
```

#### 3. Register in Factory

Edit `src/services/llm/index.ts`:

```typescript
import { OpenAIService } from './OpenAIService'

export function createLLMService(config: LLMConfig): LLMService {
  switch (config.provider) {
    case 'openai':
      return new OpenAIService(config)
    // ... other cases
  }
}
```

#### 4. Update Default Models

```typescript
export const DEFAULT_MODELS: Record<string, string> = {
  openai: 'gpt-4-turbo-preview',
  // ... others
}
```

#### 5. Test

Update test mocks if needed, then run:
```bash
npm test
```

Done! The new provider is now available in the settings dropdown.

## API Key Security

### Current Implementation

- ✅ API keys stored in local settings file
- ✅ Password-masked input field
- ✅ Not committed to git (in .gitignore)
- ⚠️ Stored in plain text (acceptable for local desktop app)

### Recommendations for Production

- Add encryption for API keys at rest
- Use system keychain/credential manager
- Support environment variables
- Add key validation before saving

## Error Handling

### User-Facing Errors

The system provides clear error messages:

1. **No API Key**
   ```
   Error: API key not configured. Please add it in Settings.
   ```

2. **AI Disabled**
   ```
   Error: AI is disabled. Enable it in Settings.
   ```

3. **API Error**
   ```
   Error: Gemini API error: [specific error message]
   ```

4. **Network Error**
   ```
   Error: Failed to connect to AI service
   ```

All errors appear in chat as red-bordered messages.

### Developer Errors

Logged to console with full stack traces for debugging.

## Testing

### Test Coverage

- ✅ Settings modal AI tab
- ✅ LLM config loading/saving
- ✅ Provider switching
- ✅ Chat panel with LLM (mocked)
- ✅ Error handling

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

### Mocking Strategy

Tests use mocked LLM responses to avoid:
- Real API calls during tests
- API key requirements
- Network dependencies
- Rate limiting

## Performance

### Response Times

- **Gemini Flash:** ~1-3 seconds
- **Gemini Pro:** ~2-5 seconds
- **Local Models:** Varies by hardware

### Context Size

Current implementation:
- Includes full editor code in context
- Maintains conversation history
- ~2000 tokens average per request

## Limitations

### Current Constraints

1. **Streaming Coverage** - Streaming is available for PRO (Gateway) and OpenRouter; other providers may respond non-streaming
2. **No Token Counting** - Gemini free tier doesn't provide counts
3. **No Rate Limiting** - User can send unlimited requests
4. **Basic Context** - Only sends current code, not project files

### Future Enhancements

- [ ] Expand streaming to additional providers
- [ ] Token usage tracking and display
- [ ] Rate limiting and queue management
- [ ] Multi-file context
- [ ] Code modification suggestions
- [ ] Inline code generation
- [ ] Error auto-fix

## Provider-Specific Notes

### Google Gemini

**Pros:**
- Fast (Flash model)
- Free tier available
- Good code understanding
- Long context window

**Cons:**
- Must alternate user/model messages
- No usage stats in free tier
- Requires Google account

**Best For:**
- Beginners (free tier)
- Quick iterations (Flash)
- Long conversations (context)

### OpenAI (When Implemented)

**Pros:**
- Highest quality responses (GPT-4)
- Excellent code generation
- Streaming support
- Full usage tracking

**Cons:**
- Expensive
- Requires payment
- Rate limits on free tier

**Best For:**
- Complex code generation
- Production use
- Users with existing OpenAI subscriptions

### Local Models (When Implemented)

**Pros:**
- No API costs
- Complete privacy
- No rate limits
- Works offline

**Cons:**
- Requires local installation
- Hardware requirements
- Slower than cloud
- May be less accurate

**Best For:**
- Privacy-conscious users
- Offline work
- Cost-sensitive users

## Troubleshooting

### Issue: "API key not configured"

**Solution:**
1. Open Settings (⚙️)
2. Go to "AI Configuration" tab
3. Enter your API key
4. Click "Save"

### Issue: "Failed to get AI response"

**Possible Causes:**
- Invalid API key
- Network connection issue
- Rate limit exceeded
- Provider service down

**Solution:**
1. Verify API key is correct
2. Check internet connection
3. Try again in a few moments
4. Check provider status page

### Issue: AI gives generic responses

**Solution:**
- Write more specific questions
- Include code context in your query
- Adjust temperature in settings (higher = more creative)

### Issue: Responses are cut off

**Solution:**
- Increase Max Tokens in settings
- Break questions into smaller parts
- Ask for summary first, then details

## Code Examples

### Using the LLM Service Directly

```typescript
import { createLLMService } from './services/llm'

const config = {
  provider: 'gemini',
  model: 'gemini-2.0-flash-exp',
  apiKey: 'your-api-key',
  enabled: true
}

const service = createLLMService(config)

const response = await service.sendMessage([
  { role: 'user', content: 'What is OpenSCAD?' }
], currentCode)

console.log(response.content)
```

### Adding Code Context

```typescript
const messages = [
  { role: 'user', content: 'Explain this code' }
]

// Current code is automatically included
const response = await service.sendMessage(messages, editorCode)
```

### Multi-Turn Conversation

```typescript
const history = [
  { role: 'user', content: 'Create a cube' },
  { role: 'assistant', content: 'cube([10, 10, 10]);' },
  { role: 'user', content: 'Make it bigger' }
]

const response = await service.sendMessage(history, currentCode)
```

## Future Development

### Phase 1: Streaming (Next Priority)
Implement streaming responses for better UX:
```typescript
async *streamMessage(messages, code): AsyncGenerator<string> {
  // Yield tokens as they arrive
  for await (const chunk of stream) {
    yield chunk.text()
  }
}
```

### Phase 2: OpenAI Implementation
Add OpenAI provider following the same pattern as Gemini.

### Phase 3: Local Models
Support Ollama, LM Studio, and other local model servers.

### Phase 4: Advanced Features
- Code modification suggestions
- Inline code generation (like Copilot)
- Multi-file context
- RAG integration for documentation

## Migration Guide

### From Mock to Real AI

No action required! The application automatically:
1. Loads your API key from settings
2. Creates appropriate LLM service
3. Sends real requests
4. Falls back to error messages if misconfigured

### Changing Providers

1. Open Settings → AI Configuration
2. Select new provider
3. Enter API key for that provider
4. Model field updates with provider default
5. Save and restart chat

## Security Notes

### API Key Storage

**Current:** Stored in plain text at `~/.torrify/settings.json`

**Risk Level:** Low (local desktop app, user's own machine)

**Mitigations:**
- File in user's home directory (not shared)
- Not committed to version control
- Password-masked in UI
- Could add encryption in future

### Code Privacy

**What's Sent:**
- Your questions
- Current editor code (when you send chat message)
- Conversation history

**Not Sent:**
- File paths
- System information
- Other project files

### Recommendations

- Don't share settings file
- Use API keys with spending limits
- Review what code you're sharing
- Consider local models for sensitive projects

## API Costs

### Google Gemini
- **Free Tier:** 15 requests/minute
- **Paid:** ~$0.00025 per 1K tokens (Flash)
- **Estimated Cost:** $0.01 - $0.10 per day typical use

### OpenAI (When Implemented)
- **GPT-4 Turbo:** ~$0.01 per 1K input tokens
- **GPT-3.5 Turbo:** ~$0.0005 per 1K tokens
- **Estimated Cost:** $0.50 - $5.00 per day typical use

### Local Models (When Implemented)
- **Cost:** $0 (one-time hardware investment)
- **Requirements:** ~8GB RAM minimum, GPU recommended

## Development Notes

### Why This Architecture?

**Factory Pattern:**
- Easy to add new providers
- Clean separation of concerns
- Type-safe provider switching
- Testable in isolation

**Interface-Based:**
- All providers have same API
- UI doesn't know about provider specifics
- Easy to swap implementations
- Mock-friendly for testing

### Dependencies

```json
{
  "@google/generative-ai": "^0.21.0"  // Gemini SDK
  // Future:
  // "openai": "^4.x.x"                // OpenAI SDK
  // "anthropic": "^0.x.x"             // Anthropic SDK
}
```

### File Structure

```
electron/main.ts        - Settings persistence, LLM config storage
electron/preload.ts     - IPC bridge for settings
src/services/llm/       - LLM service layer
  ├── types.ts          - Shared interfaces
  ├── index.ts          - Factory & defaults
  ├── GeminiService.ts  - Google Gemini
  └── (others to be added)
src/components/
  ├── ChatPanel.tsx     - Uses LLM service
  ├── SettingsModal.tsx - Configure LLM
```

## Testing

### Unit Tests

```bash
npm test
```

Coverage:
- ✅ Settings modal AI tab rendering
- ✅ Provider switching
- ✅ API key handling
- ✅ Enable/disable toggle
- ✅ Chat panel with LLM (mocked)

### Manual Testing

1. **Basic Chat:**
   - Open app
   - Type: "What is OpenSCAD?"
   - Verify AI responds with relevant info

2. **Code Context:**
   - Write some code in editor
   - Ask: "Explain this code"
   - Verify AI references your code

3. **Error Handling:**
   - Disable AI in settings
   - Try to chat
   - Verify error message appears

4. **Provider Switching:**
   - Change provider in settings
   - Verify model updates
   - Verify API key field clears (optional)

## Roadmap

### Immediate Next Steps
- [x] Gemini integration
- [x] Settings UI
- [x] Basic error handling
- [x] Streaming responses for OpenRouter and PRO
- [ ] Better error messages

### Short Term
- [ ] OpenAI provider
- [ ] Anthropic provider
- [ ] Token usage display
- [ ] Rate limiting

### Medium Term
- [ ] Local model support (Ollama)
- [ ] Multi-file context
- [ ] Code suggestions
- [ ] Auto-completion

### Long Term
- [ ] Inline code generation
- [ ] Voice input
- [ ] Multi-modal (image input for STL analysis)
- [ ] RAG for documentation

## Resources

### API Documentation
- **Gemini:** https://ai.google.dev/docs
- **OpenAI:** https://platform.openai.com/docs
- **Anthropic:** https://docs.anthropic.com/
- **Ollama:** https://github.com/ollama/ollama

### Getting API Keys
- **Gemini:** https://makersuite.google.com/app/apikey
- **OpenAI:** https://platform.openai.com/api-keys
- **Anthropic:** https://console.anthropic.com/

### Local Model Tools
- **Ollama:** https://ollama.ai/
- **LM Studio:** https://lmstudio.ai/
- **LocalAI:** https://localai.io/

## FAQ

**Q: Can I use multiple providers?**  
A: Not simultaneously, but you can switch between them in settings.

**Q: Is my API key safe?**  
A: It's stored locally on your machine. Don't share your settings file.

**Q: Can I use local models?**  
A: Not yet, but the architecture supports it. Custom provider coming soon.

**Q: Why is the response slow?**  
A: Cloud models take 1-5 seconds. Try Gemini Flash for faster responses.

**Q: Does it cost money?**  
A: Gemini has a free tier. OpenAI and Anthropic require payment.

**Q: Can I disable AI?**  
A: Yes! Toggle "Enable AI Assistant" in Settings → AI Configuration.

**Q: Will you add [provider]?**  
A: The architecture supports any provider. Submit a request or PR!

---

**Status:** ✅ Gemini + PRO (Gateway) + OpenRouter (BYOK) + Ollama  
**Version:** 0.9.2  
**Date:** January 2026  
**Next:** Additional providers (OpenAI/Anthropic) + syntax highlighting

