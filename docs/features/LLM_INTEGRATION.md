# AI Integration

Torrify features a flexible AI system that integrates Large Language Models (LLMs) to assist with coding and design.

## Supported Providers

### 1. Google Gemini (BYOK)
*   **Best For**: Fast, free/cheap usage.
*   **Requirement**: Google AI Studio API Key.
*   **Model**: Defaults to `gemini-3-flash`.

### 2. OpenRouter (BYOK)
*   **Best For**: Accessing many models (GPT-4, Claude 3, Llama 3).
*   **Requirement**: OpenRouter API Key.

### 3. Ollama (Local)
*   **Best For**: Privacy, offline use, no API costs.
*   **Requirement**: [Ollama](https://ollama.com/) running locally.
*   **Default Endpoint**: `http://127.0.0.1:11434`.

### 4. PRO (Managed)
*   **Best For**: Convenience.
*   **Requirement**: Torrify PRO License Key.

## Configuration

1.  Open **Settings** (⚙️) > **AI Configuration**.
2.  **Enable AI Assistant**: Toggle ON.
3.  **Access Mode**:
    *   **PRO**: Enter your License Key.
    *   **BYOK**: Select a Provider (Gemini/OpenRouter/Ollama) and enter your API Key.
4.  **Model**: Select or type the model name.
5.  **Save**.

## Features

### Context Awareness
The AI automatically receives:
*   **Current Code**: The content of your active editor tab.
*   **Chat History**: Previous messages in the conversation.
*   **Knowledge Base**: API documentation for the active CAD backend (OpenSCAD/build123d).

### Streaming
Responses stream in real-time. You can stop a generation at any time using the **Stop** button.

### Image Import
Attach images to your chat (paperclip icon) to ask for help modeling from reference photos.

## Troubleshooting

*   **"API key not configured"**: Check Settings > AI Configuration.
*   **"Failed to connect"**: Verify your internet connection or local Ollama server status.
*   **Generic/Wrong Code**: Try being more specific or ask the AI to "check the knowledge base" if it's using outdated syntax.
