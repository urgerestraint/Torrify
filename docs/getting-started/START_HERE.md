# Start Here

Torrify is an AI-assisted IDE for 3D CAD modeling that supports OpenSCAD and build123d.

## 🚀 Quick Setup

### 1. Prerequisites
*   **OpenSCAD** (Required) - The engine that creates your 3D models.
*   **Node.js** (Only if developing)
*   **Python 3.x** + `build123d` (Optional) - Only needed if you want to write Python code instead of SCAD.

### 2. Install & Run
```powershell
# Clone and install
git clone https://github.com/caseyhartnett/torrify.git
cd torrify
npm install

# Start development server
npm run electron:dev
```

### 3. Usage
*   **Editor**: Write SCAD code (e.g., `cube([10, 10, 10]);`)
*   **Render**: Press `Ctrl+S` to view the 3D model.
*   **AI Chat**: Type requests in the chat panel to generate code.

## 📚 Documentation Map

| Resource | Description |
|----------|-------------|
| **[Installation](./installation.md)** | Detailed installation steps for all platforms. |
| **[Features](../features/overview.md)** | Comprehensive guide to AI, CAD backends, and settings. |
| **[Developer Guide](../developer/getting-started.md)** | Setup for contributors and developers. |
| **[Troubleshooting](./TROUBLESHOOTING.md)** | Common issues and solutions. |
