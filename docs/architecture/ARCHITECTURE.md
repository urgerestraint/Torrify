# Architecture Overview

This document explains how **Torrify** is built behind the scenes. It is designed to give users and new contributors a high-level understanding of the application's structure without getting bogged down in code details.

## 🏗️ The Three-Layer Design

Torrify is built on **Electron**, which means it runs as a desktop application using web technologies. It follows a secure, three-layer architecture:

1.  **The Renderer (The UI)**
    *   **What it is:** The visual interface you interact with (buttons, editor, chat).
    *   **Tech:** React, TypeScript, TailwindCSS.
    *   **Responsibility:** Handles all user interaction, displays the 3D preview, and manages the code editor. It *cannot* directly touch your files or operating system for security reasons.

2.  **The Main Process (The Backend)**
    *   **What it is:** The invisible "engine" running in the background.
    *   **Tech:** Node.js, Electron.
    *   **Responsibility:** Handles "heavy lifting" like saving files, talking to the AI providers, and running the CAD engines (OpenSCAD/build123d). It has full access to the operating system.

3.  **The Preload Bridge (The Messenger)**
    *   **What it is:** A secure connector between the UI and the Main Process.
    *   **Responsibility:** Allows the UI to ask the Main Process to do things (like "Save this file" or "Render this code") without giving the UI full control over your computer. This is a key security feature.

---

## 🔄 How Rendering Works

When you click "Render" or press `Ctrl+S`, a complex relay race happens instantly:

1.  **Request:** The **Renderer** sends your code to the **Main Process** via the Bridge.
2.  **Execution:**
    *   **OpenSCAD:** The Main Process saves your code to a temporary file and runs the installed OpenSCAD application in "headless" mode (no window) to generate a 3D model.
    *   **build123d:** The Main Process runs a Python script that executes your code and exports a 3D model.
3.  **Conversion:** The CAD engine produces an STL file (a standard 3D format).
4.  **Display:** The Main Process sends the path of this STL file back to the **Renderer**, which loads it into the 3D viewer.

---

## 🤖 How the AI Chat Works

When you ask the AI a question, Torrify doesn't just send your message. It constructs a rich **Context** to ensure the AI gives good answers:

1.  **System Prompt:** A hidden instruction set that tells the AI: "You are an expert 3D modeler. You are using [OpenSCAD/build123d]. Here are the rules..."
2.  **API Knowledge:** Torrify injects a compressed reference manual of the current CAD language so the AI knows the correct function names and parameters.
3.  **Your Code:** The AI can "see" the code currently in your editor.
4.  **The Conversation:** Finally, your question is added.

This entire package is sent to the AI Provider (Gemini, OpenRouter, or Ollama), and the response is streamed back to the chat window.

---

## 📂 Where Data Lives

Torrify keeps your data in standard locations on your computer:

*   **Settings:** Stored in `~/.torrify/settings.json` (Home directory).
*   **Projects:** Saved as `.torrify` files, which are simple JSON text files containing your code, chat history, and settings for that specific project.
*   **Context/Knowledge Base:** Stored in the application's resource folder or your user data folder if you've customized it.

---

## 🔌 Connection to the Outside World

Torrify connects to external services only when you ask it to:

*   **AI Providers:** Connects to Google, OpenRouter, or your local Ollama server to process chat requests.
*   **Documentation:** Fetches documentation updates from GitHub if you click "Update" in settings.
*   **CAD Engines:** Runs local executables (OpenSCAD, Python) installed on your machine.

---

## 🗺️ Project Map

If you are looking at the source code, here is where to find things:

*   `electron/` - The **Main Process** code (backend logic).
*   `src/` - The **Renderer** code (UI, React components).
    *   `src/components/` - The UI panels (Chat, Editor, Preview).
    *   `src/services/` - Logic for talking to AI and CAD engines.
*   `resources/` - Built-in knowledge base files for the AI.
