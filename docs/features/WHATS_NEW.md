# What's New in Torrify

## Latest Update: Streaming AI + Knowledge Base + Image Import

**Date:** January 25, 2026

### Highlights
- **Streaming AI responses** with a stop button and live cursor
- **Knowledge Base context** for OpenSCAD/build123d API assistance
- **Image import** in chat with previews and project persistence

---

## Previous Update: Menu Bar & Error Diagnosis

**Date:** January 24, 2026

---

## 📋 Native Menu Bar

LLM and Help functionality has been moved from the toolbar to the native menu bar for a cleaner interface.

### Menu Structure

| Menu | Items |
|------|-------|
| **File** | New, Open, Save, Save As, Export Source, Export STL, Quit |
| **Edit** | Undo, Redo, Cut, Copy, Paste, Select All |
| **View** | Render, Reload, DevTools, Zoom controls, Fullscreen |
| **LLM** | Toggle AI, Switch to BYOK, Switch to PRO, LLM Settings |
| **Help** | Help Bot, Show Demo, Settings |

### Why This Change?

- Cleaner toolbar with less clutter
- Native keyboard accelerators
- Follows desktop application conventions
- LLM controls still easily accessible

---

## 🔧 One-Click Error Diagnosis

When you encounter a render error, you can now ask the AI to diagnose it with one click!

### How It Works

1. Code fails to render (syntax error, CAD error, etc.)
2. Error message is displayed in the preview panel
3. Click the purple **"Ask AI to Diagnose"** button
4. AI receives your code + the error message
5. AI analyzes and suggests fixes

### Example

```
Error: STL export error: extrude doesn't accept BuildSketch...
```

Click "Ask AI to Diagnose" and the AI will explain:
- What the error means
- Why it happened
- How to fix it with corrected code

---

## Previous Update: Multi-Backend CAD Support

Torrify now supports multiple CAD backends! Choose between **OpenSCAD** and **build123d** (Python).

See [CAD_BACKENDS.md](CAD_BACKENDS.md) for full documentation.

---

## Previous Update: AI Integration

## 🤖 Real AI is Here!

The mock chat bot has been replaced with **real Google Gemini AI**!

### What This Means

**Before:**
```
User: "How do I create a sphere?"
Bot: "Mock response to: 'How do I create a sphere?'"
```

**Now:**
```
User: "How do I create a sphere?"
AI: "To create a sphere in OpenSCAD, use the sphere() function:

sphere(r=10, $fn=100);

Where:
- r is the radius
- $fn controls the number of facets (higher = smoother)

The $fn parameter is optional but recommended for smooth spheres."
```

### Try It Now!

1. Launch the app: `npm run electron:dev`
2. Type in chat: "Explain the cube function"
3. Watch AI respond with helpful OpenSCAD information
4. Your current code is automatically included as context!

---

## 🎯 New Features

### 1. Real AI Chat
- Powered by Google Gemini 2.0 Flash
- Understands OpenSCAD deeply
- Sees your current code automatically
- Maintains conversation history
- Fast responses (1-3 seconds)

### 2. Multi-Provider Support
The architecture now supports multiple AI providers:
- ✅ **Google Gemini** (Active)
- 🚧 **OpenAI** (Coming soon)
- 🚧 **Anthropic Claude** (Coming soon)
- 🚧 **Local Models** (Coming soon - Ollama, LM Studio)

### 3. Enhanced Settings
New "AI Configuration" tab in settings (⚙️):
- Choose your AI provider
- Enter API key
- Select model
- Enable/disable AI
- Adjust temperature (creativity)
- Set max tokens (response length)

### 4. Better UI
- Header bar with app title
- Settings gear icon always visible
- Status indicator shows current AI model
- Error messages are more helpful
- Loading states during AI thinking

---

## 📝 How to Configure

### Step 1: Open Settings
Click the ⚙️ icon in the top-right corner

### Step 2: Go to AI Configuration Tab
Switch from "General" to "AI Configuration"

### Step 3: Configure (BYOK)
Torrify uses a bring-your-own-key model. Enter your API key and enable the assistant.

### Step 4: Save
Click "Save" button (already configured, but you can adjust)

---

## 💡 Usage Examples

### Get Help
```
You: "What does $fn do?"
AI: "$fn controls the number of fragments used to render curved surfaces..."
```

### Generate Code
```
You: "Create a cylinder 30mm tall and 10mm radius"
AI: "cylinder(h=30, r=10, $fn=50);"
```

### Debug Issues
```
You: "Why isn't this rendering?"
AI: [Analyzes your code] "The issue is... try changing..."
```

### Learn Concepts
```
You: "Explain difference() function"
AI: [Detailed explanation with examples]
```

---

## 🔧 Technical Details

### What's Under the Hood

**New Architecture:**
```
ChatPanel → LLM Service Factory → Gemini Service → Google API
                                ↓
                         (OpenAI, Anthropic, Custom coming soon)
```

**Code Context:**
Every AI request automatically includes:
- Your current code from the editor
- Conversation history
- OpenSCAD-specific instructions

**Smart Prompting:**
```
System: "You are an expert OpenSCAD assistant..."
System: "Current code: cube([10, 10, 10]);"
User: "Make it bigger"
AI: [Understands context and suggests cube([20, 20, 20])]
```

### Files Added
```
src/services/llm/
├── types.ts           - Shared interfaces
├── index.ts           - Factory pattern
└── GeminiService.ts   - Google Gemini impl.
```

### Settings Updated
```json
{
  "llm": {
    "provider": "gemini",
    "model": "gemini-2.0-flash-exp",
    "apiKey": "YOUR_KEY",
    "enabled": true,
    "temperature": 0.7,
    "maxTokens": 2048
  }
}
```

---

## 🎨 UI Changes

### New Header Bar
```
┌─────────────────────────────────────────────┐
│ Torrify  OpenSCAD IDE         [⚙️]       │
└─────────────────────────────────────────────┘
```

### Updated Chat Panel
```
┌─────────────────────────────┐
│ AI Assistant                │
│ Google Gemini (gemini-2.0...) │ ← Shows current model
├─────────────────────────────┤
│ [Conversation]              │
│                             │
│ [Thinking...] ← Loading     │  ← During AI response
│                             │
│ [Type message...]           │
│ [Send] ← Disabled while AI  │
│        is thinking          │
└─────────────────────────────┘
```

### Settings Modal - New AI Tab
```
[General] [AI Configuration] ← Tabs

AI Configuration:
  [x] Enable AI Assistant

  Provider: [Google Gemini ▼]
  Model: gemini-2.0-flash-exp
  API Key: ••••••••••••••••••••
  
  Temperature: 0.7
  Max Tokens: 2048
  
  [Cancel] [Save]
```

---

## 🧪 Testing

Run `npm test` to see the current test count and status.

---

## 🚀 What to Try First

### 1. Ask About OpenSCAD
```
"What is the difference between cube() and sphere()?"
```

### 2. Get Code Help
```
"How do I create a hollow cylinder?"
```

### 3. Debug Your Code
Write some invalid OpenSCAD, then ask:
```
"Why isn't this working?"
```

### 4. Learn New Features
```
"Show me examples of the difference() function"
```

### 5. Generate Complex Shapes
```
"Create a gear with 20 teeth"
```

---

## 🎁 Bonus Features

### Context-Aware AI
The AI automatically knows what you're working on:
- Sees your current code
- Remembers conversation
- Gives relevant suggestions
- No need to paste code manually

### Smart Error Handling
If AI fails:
- Clear error messages
- Suggests next steps
- Doesn't break the app
- Can retry immediately

### Persistent Settings
- Settings saved automatically
- Survive app restarts
- Per-user configuration
- Easy to backup/restore

---

## 📈 Performance

### AI Response Times
- **Gemini Flash:** 1-3 seconds (typical)
- **First message:** May take 3-5 seconds
- **Follow-ups:** Usually faster

### Token Usage
- **Average request:** 500-1000 tokens
- **With code context:** 1000-1500 tokens
- **Long conversations:** Up to 3000 tokens

### Costs (Gemini Free Tier)
- **Free:** 15 requests/minute
- **Cost:** $0.00 (free tier sufficient for testing)
- **Paid:** ~$0.01 per day typical use

---

## ⚠️ Important Notes

### API Key Security
Your API key is:
- ✅ Stored locally on your machine
- ✅ Not in version control
- ✅ Password-masked in UI
- ✅ Used only for your requests

**Don't share your settings file!**

### Internet Required
The AI features require internet connection:
- Gemini API calls
- OpenAI (when implemented)
- Anthropic (when implemented)

Local models (when implemented) will work offline.

### Rate Limits
Gemini free tier: 15 requests/minute
- Sufficient for normal use
- Upgrade if you hit limits

---

## 🐛 Known Issues

### None Critical!

Minor items may include local dependency warnings or backend-specific setup issues.

---

## 🔮 Coming Soon

### Next Updates

1. **More Providers**
   - OpenAI (GPT-4)
   - Anthropic (Claude)
   - Local models (Ollama)

2. **Advanced AI Features**
   - Code modification
   - Error auto-fix
   - Inline suggestions

3. **Editor Enhancements**
   - Custom OpenSCAD syntax highlighting
   - Code snippets library

---

## 📚 Documentation

### New Guides
- `LLM_INTEGRATION.md` - Complete AI integration docs
- `SESSION_SUMMARY.md` - Work done this session
- Updated `HANDOFF.md` - Full development log

### Updated Guides
- `README.md` - Now mentions AI features
- `QUICKSTART.md` - AI setup instructions

---

## ✅ Verification

To verify everything works:

```powershell
# 1. Run tests
npm test
# Shows the current test count and pass/fail summary

# 2. Launch app
npm run electron:dev
# Should open without errors

# 3. Test AI
# Type "hello" in chat
# Should get real AI response (not mock)

# 4. Test rendering
# Press Ctrl+S
# Should see cube in preview

# 5. Check settings
# Click ⚙️
# Should see AI Configuration tab
```

---

## 🎉 Summary

**What Changed:**
- Mock AI → Real Google Gemini
- Hardcoded → Configurable
- Single provider → Multi-provider ready
- Basic → Production-ready

**What Stayed the Same:**
- All existing features work
- Tests still passing
- UI mostly unchanged
- OpenSCAD rendering works

**Bottom Line:**
You now have a **real, functional AI-assisted OpenSCAD IDE** with room to grow!

---

## 📞 Quick Help

**AI not responding?**
→ Check Settings → AI Configuration → Verify enabled

**Want different AI?**
→ Other providers coming soon, or implement yourself using the guide

**Need more help?**
→ Read `LLM_INTEGRATION.md` for complete details

---

**Enjoy your AI-powered OpenSCAD IDE! 🚀**

---

## 🆕 File Operations

**Date:** January 24, 2026

### What's New

Torrify now supports direct file operations for `.scad` and `.py` files (backend-aware)!

**New Features:**
- **Open Files**: Open `.scad` or `.py` files directly (`Ctrl+O`)
- **Save Files**: Save files to disk (`Ctrl+S` when file is open)
- **Save As**: Save files with new names (`Ctrl+Shift+S`)
- **New File**: Create new files (`Ctrl+N`)
- **Window Title**: Shows current filename and unsaved changes indicator
- **Unsaved Changes Warning**: Prompts before losing unsaved work

**How to Use:**
1. Click "Open" in the header or press `Ctrl+O`
2. Select a `.scad` or `.py` file
3. Edit the code
4. Click "Save" or press `Ctrl+S` to save
5. Window title shows `* filename.scad` when you have unsaved changes

**Benefits:**
- Work directly with existing OpenSCAD/build123d files
- No need to copy/paste code
- Standard IDE file operations
- Unsaved changes protection

**Keyboard Shortcuts:**
- `Ctrl+O` - Open file
- `Ctrl+N` - New file
- `Ctrl+S` - Save (if file open) or Render (if no file)
- `Ctrl+Shift+S` - Save As

---

## 🔧 Multi-Backend CAD Support

**Date:** January 24, 2026

### What's New

Torrify now supports **multiple CAD backends**! You can choose between OpenSCAD (traditional) and build123d (Python-based).

### Supported Backends

| Backend | Language | File Extension | Requirements |
|---------|----------|----------------|--------------|
| **OpenSCAD** (default) | OpenSCAD DSL | `.scad` | OpenSCAD CLI |
| **build123d** | Python | `.py` | Python + build123d |

### How to Switch Backends

1. Open Settings (⚙️ button)
2. Go to "General" tab
3. Select "CAD Backend" dropdown
4. Choose your preferred backend
5. Configure the required path (OpenSCAD executable or Python interpreter)
6. Save settings

### What Changes When You Switch

**Editor:**
- **OpenSCAD**: C-style syntax highlighting, 2-space tabs
- **build123d**: Python syntax highlighting, 4-space tabs

**AI Assistant:**
- Prompts automatically adapt to your selected backend
- OpenSCAD: Get help with OpenSCAD functions, modules, and syntax
- build123d: Get help with build123d, Python, and Open CASCADE concepts

**Rendering:**
- Both backends output STL for the 3D preview
- OpenSCAD: Uses OpenSCAD CLI directly
- build123d: Uses Python with auto-export wrapper

### build123d Auto-Export

The build123d backend automatically detects and exports your geometry! Just write normal build123d code:

```python
from build123d import *

# Create a box
box = Box(10, 10, 10)
result = box  # Assign to 'result' for auto-export
```

**Supported patterns:**
- Algebra mode: `box = Box(10, 10, 10)`
- Builder mode: `with BuildPart() as part: Box(10, 10, 10)`
- Named variables: `result`, `part`, `model`, `obj`, `shape`, `solid`, `box`, etc.

### Installation

**OpenSCAD:**
- Install OpenSCAD from https://openscad.org
- Configure path in Settings

**build123d:**
```bash
pip install build123d
```
- Configure Python path in Settings (default: `python`)

### Why Multiple Backends?

- **Flexibility**: Use your preferred CAD tool
- **Python Power**: build123d gives you Python's full ecosystem
- **Learning**: Try different approaches to 3D modeling
- **Migration**: Easily switch between tools

### Documentation

See `docs/features/CAD_BACKENDS.md` for complete documentation.

---

*Milestone - January 24, 2026*

