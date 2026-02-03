# Streaming AI Responses

Torrify supports live streaming responses for faster, more interactive chat. When enabled and supported by the selected provider, AI messages appear token-by-token with a stop button.

## How It Works

- The UI creates a placeholder assistant message.
- The LLM service streams partial text chunks into that message.
- A **Stop** button appears while streaming to cancel the response.
- When streaming finishes (or is stopped), code extraction runs on the final message.

## User Experience

1. Open the app and enable AI in Settings.
2. Send a message in the chat panel.
3. Watch the response stream in real time.
4. Click **Stop** to abort if needed.

## Provider Support

Streaming is implemented for:

- **Gemini** (via `sendMessageStream`)
- **OpenRouter** (via Server-Sent Events)

If a provider or model does not support streaming, Torrify falls back to non-streaming responses.

## Files Involved

- `src/services/llm/types.ts` (streaming types)
- `src/services/llm/GeminiService.ts` (streaming implementation)
- `src/services/llm/OpenRouterService.ts` (streaming implementation)
- `src/components/ChatPanel.tsx` (UI + streaming state)

## Notes

- Streaming is opt-in per provider/model capability.
- The stop button cancels the current stream and marks the response as stopped.

