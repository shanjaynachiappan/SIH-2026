# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## MineGuard AI Assistant Setup

The MineGuard AI Assistant is designed to run locally using the **Qwen3** open-weight model via **Ollama**. This ensures all mine telemetry and data remains completely private.

### 1. Install Ollama
Download and install Ollama from [ollama.com](https://ollama.com/).

### 2. Download Qwen3 Model
Once Ollama is installed, open your terminal and pull the Qwen3 model. (Note: use the tag you prefer; the default expected is `qwen3:4b` or you can change it in the `.env` file).
```bash
ollama run qwen3:4b
```

### 3. Environment Configuration
The application is pre-configured with a `.env` file containing:
```
VITE_AI_API_URL=http://localhost:11434
VITE_AI_MODEL=qwen3:4b
```
Ensure Ollama is running on port 11434 (which is its default).

### 4. Running the Frontend
Start the MineGuard frontend:
```bash
npm run dev
```

### 5. Testing the AI Assistant
1. Navigate to the AI Assistant page in the sidebar.
2. The status indicator in the top right should read "Local Qwen3 • Connected" if Ollama is running.
3. If Ollama is off, the Assistant gracefully degrades to "Fallback Mode" to still provide deterministic data summaries.
4. Go to the Live Map workspace and start the simulation, then ask the AI Assistant "What changed?" to see it analyze the real-time simulation data.
