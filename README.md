# Compendium

A local AI coding assistant that provides Claude Code-like functionality using local LLMs via Ollama.

## Features

- **Interactive REPL** - Chat with your AI assistant in the terminal
- **Tool Calling** - The AI can read, write, and edit files, run shell commands, and search your codebase
- **Conversation History** - Sessions are automatically saved and resumed
- **Streaming Responses** - See the AI's response as it's generated
- **Configurable** - Choose your model and customize settings

## Prerequisites

- Node.js 18+
- [Ollama](https://ollama.ai) installed and running
- A code-capable model pulled in Ollama (e.g., `qwen2.5-coder:14b`)

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/compendium.git
cd compendium

# Install dependencies
npm install

# Build the project
npm run build

# Link globally (optional)
npm link
```

## Quick Start

1. Start Ollama:
   ```bash
   ollama serve
   ```

2. Pull a model (if you haven't already):
   ```bash
   ollama pull qwen2.5-coder:14b
   ```

3. Run Compendium:
   ```bash
   # If linked globally
   compendium

   # Or run directly
   npm start
   ```

## Usage

### Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help message |
| `/clear` | Clear conversation history |
| `/model <name>` | Switch to a different model |
| `/models` | List available models |
| `/history` | Show conversation history |
| `/exit` | Exit the assistant |

### Examples

```
> Read the package.json file
> Create a new file called hello.ts with a hello world function
> Search for all TypeScript files in the project
> Run npm test
```

## Configuration

Configuration is stored in `~/.compendium/config.json`:

```json
{
  "ollamaUrl": "http://localhost:11434",
  "model": "qwen2.5-coder:14b",
  "historyEnabled": true
}
```

### CLI Options

```bash
compendium --model llama3.1:8b    # Use a specific model
compendium --url http://server:11434  # Connect to remote Ollama
compendium --no-history           # Disable conversation history
```

## Available Tools

The AI assistant has access to these tools:

| Tool | Description |
|------|-------------|
| `read` | Read file contents with line numbers |
| `write` | Create or overwrite files |
| `edit` | Find and replace text in files |
| `bash` | Execute shell commands |
| `glob` | Find files by pattern |
| `grep` | Search file contents with regex |

## Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Clean build artifacts
npm run clean
```

## Project Structure

```
compendium/
├── src/
│   ├── index.ts          # CLI entry point
│   ├── cli.ts            # REPL loop and command handling
│   ├── llm/
│   │   ├── client.ts     # Ollama API client
│   │   └── prompts.ts    # System prompts & tool schemas
│   ├── tools/
│   │   ├── index.ts      # Tool registry
│   │   ├── read.ts       # File reading
│   │   ├── write.ts      # File writing
│   │   ├── edit.ts       # File editing
│   │   ├── bash.ts       # Shell execution
│   │   ├── glob.ts       # File pattern matching
│   │   └── grep.ts       # Content search
│   ├── history/
│   │   └── store.ts      # Conversation persistence
│   └── utils/
│       ├── config.ts     # Configuration loading
│       └── display.ts    # Terminal formatting
├── package.json
├── tsconfig.json
└── README.md
```

## License

MIT
