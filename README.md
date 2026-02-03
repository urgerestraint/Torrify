# Torrify

[![Build](https://github.com/caseyhartnett/torrify/actions/workflows/build-installers.yml/badge.svg)](https://github.com/caseyhartnett/torrify/actions/workflows/build-installers.yml) [![codecov](https://codecov.io/gh/caseyhartnett/torrify/graph/badge.svg)](https://codecov.io/gh/caseyhartnett/torrify)

An AI-assisted IDE for 3D CAD modeling built with Electron, React, and TypeScript. Supports multiple CAD backends including OpenSCAD and build123d.

Website: https://torrify.org  
**Support:** [hello@torrify.org](mailto:hello@torrify.org) — for issues, complaints, suggestions, or feedback.

## 🚀 Features

- **Multi-Backend CAD Support**: Choose between OpenSCAD or build123d (Python)
- **3-Column Layout**: Chat interface, Monaco code editor, and live render preview
- **Monaco Editor**: Full-featured code editing with automatic language switching
- **Live Rendering**: Real-time CAD rendering with Ctrl+S shortcut
- **Interactive 3D Preview**: STL-based viewer with rotate/zoom/pan
- **AI Chat (Gemini + OpenRouter + Ollama)**: Real AI assistant with backend-aware prompts
- **Streaming AI Responses**: Live token streaming with a stop button
- **Knowledge Base Context**: Built-in OpenSCAD/build123d API context injection
- **Image Import**: Attach reference photos to chat for AI-assisted modeling (NEW!)
- **Send 3D Snapshot to AI**: One-click screenshot context for the model
- **Help Bot**: Built-in help chat grounded in project documentation
- **File Operations**: Open, save, and manage `.scad` and `.py` files directly
- **Project Save/Load**: Save chat + code + images + STL in a single `.torrify` file
- **Manual Export**: Export source code and `.stl` on demand
- **Native Menu Bar + Error Diagnosis**: Desktop menus + one-click AI error analysis
- **Dark Theme**: Modern VS Code-style dark UI
- **IPC Communication**: Secure bridge between renderer and main process
- **Auto-reload**: Hot module replacement in development mode

## 🔧 CAD Backends

| Backend | Language | File Extension | Requirements |
|---------|----------|----------------|--------------|
| **OpenSCAD** (default) | OpenSCAD DSL | `.scad` | OpenSCAD CLI |
| **build123d** | Python | `.py` | Python + build123d library |

To switch backends, open Settings (⚙️) → General → CAD Backend.

## 📋 Prerequisites

### For Using the Application (Installers)

- **OpenSCAD** (for OpenSCAD backend) ([Download](https://openscad.org/downloads.html))
- **Python 3.x + build123d** (for build123d backend) (`pip install build123d`)

### For Development

- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **OpenSCAD** (for OpenSCAD backend)
- **Python 3.x + build123d** (for build123d backend)

## 📦 Installation

### Option 1: Download Installer (Recommended)

**Windows**:
1. Download the latest `.exe` installer from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases)
2. Run the installer and follow the setup wizard
3. Choose installation directory (default: `C:\Program Files\Torrify`)
4. Launch Torrify from the Start Menu or Desktop shortcut

**macOS**:
1. Download the latest `.dmg` file from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases)
2. Open the DMG and drag Torrify to Applications
3. Launch from Applications folder
4. If you see a security warning, go to System Preferences → Security & Privacy and click "Open Anyway"

**Linux**:
1. Download the latest `.AppImage` from [GitHub Releases](https://github.com/caseyhartnett/torrify/releases)
2. Make it executable: `chmod +x Torrify-*.AppImage`
3. Run it: `./Torrify-*.AppImage`
4. Optional: Use AppImageLauncher to integrate with your desktop environment

### Option 2: Build from Source (Development)

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/caseyhartnett/torrify.git
cd torrify

# Install dependencies
npm install
```

## 🧭 Version Control

- Git repository initialized locally
- Private remote: `https://github.com/caseyhartnett/torrify`
- Default branch: `main`

## 🛠️ Development

### Command Line Options

- `--reset-settings` or `--wipe-settings`: Reset all settings to defaults (useful for testing)
  
  **Usage:**
  ```bash
  # In development
  npm run build:electron && electron . --reset-settings
  
  # Or after building
  electron . --reset-settings
  ```
  
  This will delete the settings file at `~/.torrify/settings.json` and restart with default settings.

### Run the application in development mode:

```bash
npm run electron:dev
```

This will:
- Start the Vite dev server on `http://localhost:5173`
- Launch Electron with the application
- Enable hot module replacement
- Open DevTools automatically

### Run tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Run only the Vite dev server (for browser testing):

```bash
npm run dev
```

## 🏗️ Building

Build the application for production:

```bash
# Build the application
npm run build

# Package into distributable (creates installer/executable)
npm run package

# Or build for specific platform (must be on that OS)
npm run package:win    # Windows NSIS installer (Windows only)
npm run package:mac    # macOS DMG (macOS only)
npm run package:linux  # Linux AppImage (Linux only)
```

### Platform-Specific Build Requirements

**Windows:**
- Requires **Developer Mode** enabled (Settings → Privacy & Security → For developers)
- Or run PowerShell as Administrator
- Reason: electron-builder needs to create symbolic links

**macOS:**
- Must build on macOS (cannot cross-compile)
- Uses native Apple tools

**Linux:**
- Must build on Linux (or WSL on Windows)
- Cannot build AppImages on Windows/macOS directly
- Uses Linux-specific tools (mksquashfs)

### Cross-Platform Building

To build for all platforms without having access to each OS:
- Use **GitHub Actions** CI/CD (see `.github/workflows/build-installers.yml`)
- Push to `main` branch triggers automatic builds for Windows, macOS, and Linux
- Download artifacts from GitHub Actions or Releases

### Build Output

The built files will be in:
- `dist/` - Renderer process (React app)
- `dist-electron/` - Main process and preload script
- `dist-installer/` - Packaged installers

For detailed build instructions, see [docs/developer/DEV_README.md](docs/developer/DEV_README.md).

## Project Structure

```
torrify/
├── electron/                # Electron main process
│   ├── cad/                 # CAD backend services
│   │   ├── Build123dService.ts
│   │   ├── OpenSCADService.ts
│   │   ├── index.ts
│   │   └── types.ts
│   ├── main.ts              # Main process (IPC, CAD integration)
│   └── preload.ts           # Preload script (context bridge)
├── src/                     # React frontend
│   ├── components/          # React components
│   │   ├── ChatPanel.tsx
│   │   ├── DemoDialog.tsx
│   │   ├── EditorPanel.tsx
│   │   ├── HelpBot.tsx
│   │   ├── PreviewPanel.tsx
│   │   ├── SettingsModal.tsx
│   │   ├── StlViewer.tsx
│   │   └── WelcomeModal.tsx
│   ├── services/
│   │   ├── cad/             # CAD service adapters + tests
│   │   └── llm/             # LLM services + tests
│   ├── App.tsx              # Main application
│   ├── main.tsx             # React entry point
│   └── index.css            # Global styles + Tailwind
├── resources/               # Bundled API context files
├── scripts/                 # Context generation scripts
├── index.html               # HTML template
├── vite.config.ts           # Vite + Electron configuration
└── package.json             # Dependencies and scripts
```

## Configuration

### OpenSCAD Path

Configure the OpenSCAD executable path in the app settings (⚙️ in the header).  
Settings are stored at `C:\Users\<username>\.torrify\settings.json`.

### AI API Key (Required for AI Features)

**Torrify uses a Bring Your Own Key (BYOK) model** - you must configure your own API key to use AI features.

1. Open Settings (⚙️ icon in header)
2. Go to the "AI Configuration" tab
3. Select your provider (Google Gemini, PRO/OpenRouter, or Ollama)
4. Enter your API key (BYOK providers) or set `OPENROUTER_API_KEY` for PRO
5. Enable "Enable AI Assistant" toggle
6. Click "Save"

**Note**: Ollama runs locally and does not require an API key.

**Getting API Keys**:
- **Google Gemini**: https://makersuite.google.com/app/apikey
- **OpenRouter (PRO)**: https://openrouter.ai/ (set `OPENROUTER_API_KEY`)

**Security**: API keys are stored locally in your settings file (`~/.torrify/settings.json`) and are never transmitted except to the selected AI provider's API.

## 🎯 Usage

### Three Core Methodologies

Torrify supports three primary workflows: **text-to-3D**, **image-to-3D**, and **3D file editing**.

#### 1. Text-to-3D (Chat Directly with AI)
The simplest way to get started. Just describe what you want to build.

```
You: "Create a box with rounded corners, 50mm x 30mm x 20mm"
AI: [Generates complete OpenSCAD/build123d code]
```

- Type your request in the Chat panel (left)
- AI generates code automatically applied to the editor
- Press `Ctrl+S` to render and see the 3D model

#### 2. 3D File Editor (Edit Existing Code)
Work directly with existing `.scad` or `.py` files, or save a full session as a `.torrify` project.

1. Open a file (`Ctrl+O`) or start a new one (`Ctrl+N`)
2. Edit your CAD code in the editor
3. Press `Ctrl+S` to render the 3D model
4. Optionally click **"Send to AI"** in the Preview panel
5. Describe changes: *"Add mounting holes in each corner"*

#### 3. Image-to-3D (Start from a Reference Image)
Have a photo of what you want to model? Attach it to your chat.

1. Click the **📎 paperclip button** in the Chat input area
2. Select one or more images (holes to cover, parts to replicate, dimension references)
3. Describe what you need: *"Create a cover plate for this hole. The ruler shows it's about 45mm wide."*
4. AI analyzes the image and generates appropriate CAD code

**Tip**: Include a ruler or known object in your photo for scale reference!

---

### Detailed Workflow

1. **Getting Started**:
   - **New File**: Start with a blank editor or click "New" (`Ctrl+N`)
   - **Open File**: Click "Open" (`Ctrl+O`) to open existing files
   - Window title shows current file or "Untitled"

2. **Code Editor** (Center Panel): 
   - Write code in the Monaco editor
   - Automatic language switching (OpenSCAD or Python based on backend)
   - Window title shows `*` when you have unsaved changes

3. **Render**: 
   - Click the **"Render"** button in the editor header
   - Or press **`Ctrl+S`** keyboard shortcut
   - Watch the rendering progress in the preview panel

4. **Preview** (Right Panel):
   - View the rendered STL in an interactive 3D viewer
   - Rotate, zoom, and pan the model
   - Click **"Refresh"** to re-render with current code
   - **"Send to AI"** - attach a 3D snapshot to your next message

5. **Chat** (Left Panel):
   - Type messages to interact with the AI assistant
   - **📎 Attach Images** - add reference photos to your message
   - The AI sees your current code, attached images, and conversation history
   - Generated code is automatically applied to the editor

6. **File Operations**:
   - **New File**: Create a new file (`Ctrl+N`)
   - **Open File**: Open existing `.scad` or `.py` files (`Ctrl+O`)
   - **Save**: Save current file (`Ctrl+S` when file is open)
   - **Save As**: Save file with new name (`Ctrl+Shift+S`)

7. **Project Management**:
   - **Save Project**: Stores chat + code + images + STL in a single `.torrify` file
   - **Load Project**: Restores complete project state including images
   - **Export SCAD/Python**: Writes source file on demand
   - **Export STL**: Writes `.stl` on demand (requires a render)

### Example OpenSCAD Code

Try these examples in the editor:

```openscad
// Simple cube
cube([10, 10, 10]);
```

```openscad
// Sphere
sphere(r=10, $fn=100);
```

```openscad
// Combined shapes
difference() {
    cube([20, 20, 20], center=true);
    sphere(r=12, $fn=50);
}
```

## ❓ FAQ

**What file types does Torrify use?**  
Torrify edits `.scad` (OpenSCAD) and `.py` (build123d) source files, and saves full sessions as `.torrify` project files.

**Can I switch between OpenSCAD and build123d?**  
Yes, but the code is not compatible between backends. Switch in Settings and translate or rewrite your model as needed.

**Does Torrify support image-to-3D?**  
Yes. Attach reference images in chat and describe what you want modeled.

**What is included in a `.torrify` project file?**  
Your code, chat history (including image attachments), and the last rendered STL.

**How do I update the AI knowledge base?**  
Use **Settings → Knowledge Base → Update from the cloud**, or regenerate bundled context files in the repo.

## 🧪 Testing

The project uses **Vitest** and **React Testing Library** for unit and integration tests across the renderer (components, hooks, services) and **electron** (validation, CAD services). CI runs the full suite with coverage and uploads to Codecov (see badge above).

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (recommended for development)
npm run test:watch

# Generate coverage report (terminal summary + coverage/ HTML)
npm run test:coverage
```

### Test Structure

Tests live under `electron/__tests__/`, `src/**/__tests__/`, and root `src/App.test.tsx`. Key areas:

- **electron**: pathValidator, projectValidation, validation schemas, OpenSCADService, Build123dService, cadFactory
- **src/components**: ChatPanel, EditorPanel, PreviewPanel, SettingsModal, StlViewer, WelcomeModal, HelpBot, DemoDialog, ErrorBoundary, ConfirmDialog, FileToolbar, ProjectToolbar
- **src/components/settings**: GeneralSettings, AISettings, KnowledgeSettings
- **src/hooks**: useFileOperations, useRecentFiles, useDemo, useMenuHandlers
- **src/services/cad**: cad adapter, backend-connectivity
- **src/services/llm**: GatewayService, GeminiService, OpenRouterService, OllamaService, utils, prompts, index, code-generation

For the full tree and coverage details, see [docs/developer/TESTING.md](docs/developer/TESTING.md).

### What's Tested

- ✅ Component rendering and user interactions (clicks, input)
- ✅ Hooks (file operations, recent files, demo, menu handlers)
- ✅ Settings panels (General, AI, Knowledge Base)
- ✅ LLM services (mocked providers; prompt/build coverage)
- ✅ Code-generation regression suite
- ✅ Electron validation (paths, project save/load, schemas) and CAD services (mocked spawn/fs)
- ✅ Error handling (ErrorBoundary, preview panel)

### Manual Testing Checklist

- [ ] Application launches without errors
- [ ] All three panels are visible
- [ ] Monaco editor loads and accepts input
- [ ] Ctrl+S triggers render
- [ ] Render button works
- [ ] Preview displays interactive 3D STL model
- [ ] Chat accepts messages and shows real AI responses
- [ ] Streaming responses render incrementally and stop works
- [ ] "Send to AI" button captures and sends 3D snapshot
- [ ] 📎 Attach button opens file picker for images
- [ ] Attached images appear as thumbnails before sending
- [ ] Images display in chat message bubbles after sending
- [ ] Project save/load works correctly (including images)
- [ ] Export Source/STL functions work
- [ ] OpenSCAD executable is found and runs
- [ ] Error messages display when OpenSCAD fails

## Tech Stack

- **Electron** - Desktop application framework
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS framework
- **Monaco Editor** - VS Code's code editor component

## 🐛 Troubleshooting

### OpenSCAD Not Found Error

If you see an error about OpenSCAD not being found:

1. Verify OpenSCAD is installed: `C:\Program Files\OpenSCAD\openscad.exe`
2. Open Settings (⚙️) and update the OpenSCAD path
3. Save and restart the application

### Port Already in Use

If port 5173 is already in use:

1. Change the port in `vite.config.ts`:
   ```typescript
   server: {
     port: 5174, // Use a different port
   }
   ```

### Electron Won't Start

1. Clear the cache: `npm run clean` (add this script if needed)
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Rebuild Electron: `npm run build`

### 3D Preview Is Blank

If the 3D preview shows nothing:
1. Click **Render** to generate the STL
2. Ensure no errors are shown in the preview panel
3. Try **Refresh**

### Tests Failing

1. Ensure all dependencies are installed: `npm install`
2. Check Node.js version: `node --version` (should be 18+)
3. Clear test cache: `npm test -- --clearCache`

## 🗺️ Roadmap

### Phase 1: MVP (Completed ✅)
- [x] 3-column layout
- [x] Monaco code editor
- [x] OpenSCAD rendering via CLI
- [x] Real AI chat interface (Google Gemini)
- [x] Interactive 3D STL preview
- [x] Project save/load functionality
- [x] Settings UI for OpenSCAD path and AI configuration
- [x] Export SCAD/STL functionality
- [x] Send 3D snapshot to AI
- [x] Basic testing infrastructure

### Phase 2: Core Features (Completed ✅)
- [x] Real LLM API integration (Google Gemini) ✅
- [x] Project save/load (JSON format) ✅
- [x] Manual export (SCAD/STL) ✅
- [x] File operations (open .scad/.py files directly) ✅
- [x] Recent files list ✅
- [x] Multi-backend CAD support (OpenSCAD + build123d) ✅
- [x] Image import for chat (attach reference photos) ✅
- [x] Streaming AI responses ✅
- [x] Knowledge base context (OpenSCAD/build123d API) ✅
- [x] Native menu bar + error diagnosis ✅
- [ ] Custom OpenSCAD syntax highlighting for Monaco

### Phase 3: Advanced Features
- [ ] Multiple render views (camera angles)
- [ ] Additional AI providers (OpenAI, Anthropic, local models)
- [ ] Render queue for batch processing
- [ ] Code snippets library
- [ ] OpenSCAD library browser
- [ ] Dark/light theme toggle

### Phase 4: AI Enhancement
- [x] Natural language to CAD generation ✅
- [x] Error explanation and fixes ✅
- [ ] Context-aware code suggestions
- [ ] Model optimization suggestions
- [ ] Documentation integration

## 📚 Documentation

All documentation is organized in the `docs/` folder:

- **Getting Started**: [docs/getting-started/](docs/getting-started/) - Setup guides
- **Developer Guide**: [docs/developer/DEV_README.md](docs/developer/DEV_README.md) - Development reference
- **Architecture**: [docs/architecture/](docs/architecture/) - Technical documentation
- **Features**: [docs/features/](docs/features/) - Feature guides
- **Security**: [docs/security/](docs/security/) - Security audit
- **Reference**: [docs/reference/](docs/reference/) - Quick references

See [docs/README.md](docs/README.md) for the complete documentation index.

## 📚 External Resources

- [OpenSCAD Documentation](https://openscad.org/documentation.html)
- [Electron Documentation](https://www.electronjs.org/docs)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

**Contact:** For bug reports, feature requests, complaints, or suggestions, email [hello@torrify.org](mailto:hello@torrify.org).

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the GNU General Public License v3.0 (GPL-3.0-only). See the [LICENSE](LICENSE) file for the full text.

## 👤 Author

Torrify — [hello@torrify.org](mailto:hello@torrify.org). Built as a Walking Skeleton MVP for an AI-assisted OpenSCAD IDE.

---

**Note**: This project has evolved from a Walking Skeleton MVP to a fully functional AI-assisted CAD IDE. Features include real AI integration (Gemini + OpenRouter + Ollama), multi-backend CAD support (OpenSCAD + build123d), and image import for reference-based modeling. Start by chatting with the AI, sending 3D snapshots for iteration, or attaching reference photos!

