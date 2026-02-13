# Torrify - Next Steps & Future Direction

Website: https://torrify.org

**Date**: February 4, 2026  
**Status**: ✅ Feature complete (Phase 2), Security hardened, Licensed (GPLv3).

---

## 🚀 Current Status

Torrify is now a robust, feature-complete AI-assisted CAD environment.

- **Core Features**: 3-column IDE, AI Chat, 3D Preview
- **CAD Support**: Multi-backend (OpenSCAD + build123d)
- **AI Integration**: Streaming responses, Context Caching (Pro), Image Support
- **Security**: Hardened IPC, Content Security Policy, Audit Complete
- **Pro Tier**: Managed Proxy Service active with LemonSqueezy auth and OpenAI/Anthropic integration

## 🔮 Immediate Focus

Before expanding further, we focus on stability and polish.

### 1. Custom Syntax Highlighting
**Why**: Improves readability and developer experience for OpenSCAD users.
**What**: Implement a custom Monaco language definition for OpenSCAD (`.scad` files) to support keywords, operators, and built-in functions.

## 🧭 Future Direction (User-Driven)

We have built a strong foundation. Rather than building features in isolation, the next phase of development will be driven by **user feedback**.

We want to avoid building a "walled garden". Future features should solve real user problems.

**Potential Areas for Exploration (dependent on feedback):**
- **STEP Support**: Native STEP file support for build123d.
- **Render Visuals**: Improved visual fidelity (materials, lighting, colors).
- **Parameter Sliders**: UI for adjusting parameters dynamically (similar to OpenSCAD Customizer).
- **Documentation**: "Best Models" report/guide for CAD tasks.
- **Education**: YouTube video lessons and tutorials.
- **Git Integration**: Version control for objects (visual history).
- **More AI Providers**: Direct integration with Anthropic or OpenAI if users demand it (currently supported via OpenRouter).
- **Additional Backends**: CadQuery or FreeCAD support if there is community interest.
- **Plugin System**: Allow the community to extend the IDE.

---

## 📚 Documentation Links

- [Developer Guide](developer/README.md)
- [Architecture](architecture/index.md)
- [Features](features/)

_Last Updated: February 4, 2026_
