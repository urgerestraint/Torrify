# Torrify Documentation

**Wiki-style documentation hub** - All project documentation organized by category.

**Current Version:** 0.9.2  
**Latest Features:** Streaming AI, Knowledge Base Context, Image Import, Menu Bar, Multi-Backend CAD

**Contact:** For issues, complaints, suggestions, or feedback: [hello@torrify.org](mailto:hello@torrify.org)

## 📚 Documentation Structure

```
docs/
├── README.md (this file)          # Main documentation index
├── getting-started/               # First-time setup guides
├── developer/                      # Developer reference
├── architecture/                   # Technical architecture
├── features/                       # Feature documentation
├── security/                       # Security documentation
├── reference/                      # Quick references
└── history/                        # Project history & changelogs
```

---

## 🚀 Quick Navigation

### For New Users
- **[Getting Started](getting-started/)** - Setup and first steps

### For Developers
- **[Developer Guide](developer/)** - Development workflows and commands
- **[Architecture](architecture/)** - Technical design and structure
- **[Testing](developer/TESTING.md)** - Testing guide

### For Contributors
- **[Features](features/)** - Feature documentation
- **[Security](security/)** - Security audit and best practices
- **[Reference](reference/)** - Quick reference materials
- **[Next Steps](NEXT_STEPS.md)** - Recommended development priorities

---

## 📖 Documentation by Category

### Getting Started

**Location**: `docs/getting-started/`

| File | Description |
|------|-------------|
| `START_HERE.md` | Quick orientation and overview |
| `QUICKSTART.md` | 5-minute setup guide |
| `START_APP.md` | Application startup instructions |

**Read First**: `START_HERE.md`

---

### Developer

**Location**: `docs/developer/`

| File | Description |
|------|-------------|
| `DEV_README.md` | Developer reference guide |
| `TESTING.md` | Testing guide and procedures |

**Key Topics**:
- Development commands
- Command line arguments (`--reset-settings`)
- Testing workflows
- Build processes
- Troubleshooting

---

### Architecture

**Location**: `docs/architecture/`

| File | Description |
|------|-------------|
| `ARCHITECTURE.md` | High-level architecture overview |
| `HANDOFF.md` | Complete project handoff document |
| `PRO_PRICING_ANALYSIS.md` | PRO tier pricing analysis |
| `WINDOWS_BUILD_REQUIREMENTS.md` | Windows build requirements |
| `README.md` | Architecture docs index |

**Key Topics**:
- System architecture
- File structure
- Design decisions
- Component relationships

---

### Features

**Location**: `docs/features/`

| File | Description |
|------|-------------|
| `CAD_BACKENDS.md` | Multi-backend CAD support |
| `STREAMING_AI.md` | Streaming responses and stop control |
| `IMAGE_IMPORT.md` | Image attachments in chat |
| `KNOWLEDGE_BASE.md` | Knowledge base context management |
| `MENU_BAR.md` | Native menu bar + error diagnosis |
| `SETTINGS_FEATURE.md` | Settings system documentation |
| `LLM_INTEGRATION.md` | AI/LLM integration guide |
| `WHATS_NEW.md` | Recent feature announcements |

**Key Topics**:
- CAD backend selection (OpenSCAD, build123d)
- Feature implementations
- Configuration guides
- Usage examples

---

### Security & Code Quality

**Location**: `docs/security/` and `docs/`

| File | Description |
|------|-------------|
| `security/SECURITY_AUDIT.md` | Complete security audit |
| `CODE_HEALTH.md` | Code quality and technical debt analysis |

**Key Topics**:
- Security posture and vulnerabilities
- Code organization (large-file refactor complete; see CODE_HEALTH.md)
- Type safety improvements
- Testing infrastructure
- Development tooling (ESLint, pre-commit hooks)
- Performance optimizations
- Technical debt tracking

---

### Reference

**Location**: `docs/reference/`

| File | Description |
|------|-------------|
| `QUICK_REFERENCE.md` | One-page cheat sheet |
| `PROJECT_FORMAT.md` | Project file format specification |
| `DOCUMENTATION_INDEX.md` | Documentation navigation guide |

**Key Topics**:
- Quick lookups
- File formats
- API references

---

### History

**Location**: `docs/history/`

| File | Description |
|------|-------------|
| `SESSION_SUMMARY.md` | Development session summaries |
| `EXPLORATION_SUMMARY.md` | Project exploration findings |
| `AI_PROMPT_UPDATE.md` | AI prompt updates |
| `SYSTEM_PROMPT.md` | System prompt documentation |

**Key Topics**:
- Development history
- Session logs
- Project evolution

---

## 🔍 Finding Documentation

### By Task

**I want to...**

- **Get started** → `docs/getting-started/START_HERE.md`
- **Set up the app** → `docs/getting-started/QUICKSTART.md`
- **Develop features** → `docs/developer/DEV_README.md`
- **Write tests** → `docs/developer/TESTING.md`
- **Understand architecture** → `docs/architecture/ARCHITECTURE.md`
- **Configure AI** → `docs/features/LLM_INTEGRATION.md`
- **Change CAD backend** → `docs/features/CAD_BACKENDS.md`
- **Review security** → `docs/security/SECURITY_AUDIT.md`
- **Improve code quality** → `docs/CODE_HEALTH.md` ⭐
- **See what's new** → `docs/features/WHATS_NEW.md`
- **Quick reference** → `docs/reference/QUICK_REFERENCE.md`

### By Role

**I am a...**

- **New User** → Start with `docs/getting-started/START_HERE.md`
- **Developer** → Read `docs/developer/DEV_README.md`
- **Contributor** → Review `docs/architecture/HANDOFF.md`
- **Security Auditor** → See `docs/security/SECURITY_AUDIT.md`

---

## 📝 Documentation Standards

### File Naming

- Use `UPPERCASE.md` for major documents
- Use `kebab-case.md` for specific topics
- Keep `README.md` in each folder for navigation

### Cross-References

When referencing other docs, use relative paths:
```markdown
See [Testing Guide](../developer/TESTING.md) for details.
```

### Updates

- Update this index when adding new docs
- Keep `HANDOFF.md` updated with major changes
- Document breaking changes in `docs/history/`

---

## 🔗 External Links

- [Main README](../README.md) - User-facing documentation (root)
- [OpenSCAD Documentation](https://openscad.org/documentation.html)
- [Electron Documentation](https://www.electronjs.org/docs)
- [React Documentation](https://react.dev/)

---

## 📊 Documentation Statistics

- **Total Documents**: 27+
- **Categories**: 7
- **Getting Started**: 4 files (START_HERE, QUICKSTART, START_APP, TROUBLESHOOTING)
- **Developer Guides**: 2 files (DEV_README, TESTING)
- **Architecture**: 5 files (ARCHITECTURE, HANDOFF, PRO_PRICING_ANALYSIS, WINDOWS_BUILD_REQUIREMENTS, README)
- **Features**: 8 files
- **Security & Quality**: 2 files (Security Audit + Code Health)
- **Reference**: 3 files
- **History**: 5+ files

---

## 🎯 Quick Links

### Most Important Documents

1. **[Getting Started](getting-started/START_HERE.md)** - Start here if new
2. **[Developer Guide](developer/DEV_README.md)** - Developer reference
3. **[CAD Backends](features/CAD_BACKENDS.md)** - OpenSCAD + build123d support
4. **[Next Steps](NEXT_STEPS.md)** - Recommended development priorities
5. **[Code Health](CODE_HEALTH.md)** - Code quality & technical debt ⭐ NEW!
6. **[Security Audit](security/SECURITY_AUDIT.md)** - Security documentation
7. **[Main README](../README.md)** - User documentation (root)
8. **[Handoff Document](architecture/HANDOFF.md)** - Complete project history
9. **[Pricing Analysis](architecture/PRO_PRICING_ANALYSIS.md)** - PRO plan analysis
10. **[Windows Build](architecture/WINDOWS_BUILD_REQUIREMENTS.md)** - Windows build requirements

---

**Last Updated**: February 2026  
**Documentation Version**: 2.2 (Architecture links fixed; pre-release checklist retired)

