# Compendium

An agentic remote AI coding assistant with distributed tool execution via Ollama. Compendium provides Claude Code-like functionality with support for local, server, client, and daemon modes for multi-machine orchestration.

## Features

- **Interactive REPL** - Chat with your AI assistant in the terminal
- **Tool Calling** - The AI can read, write, and edit files, run shell commands, and search your codebase
- **Conversation History** - Sessions are automatically saved and resumed
- **Streaming Responses** - See the AI's response as it's generated
- **Server Mode** - Run as a WebSocket server for remote clients
- **Remote Client** - Connect to a Compendium server from anywhere
- **Daemon Mode** - Register machines as remote tool executors
- **Multi-Machine Execution** - Route tool calls to specific machines in a distributed setup

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

## Modes of Operation

### 1. Local Mode (Default)

Run Compendium locally with direct Ollama access:

```bash
compendium local
# or just
compendium
```

Options:
```bash
compendium local --model llama3.1:8b     # Use a specific model
compendium local --url http://server:11434  # Connect to remote Ollama
compendium local --no-history            # Disable conversation history
```

### 2. Server Mode

Start Compendium as a WebSocket server that clients and daemons can connect to:

```bash
compendium serve --port 3030 --token YOUR_SECRET_TOKEN
```

Options:
| Option | Description | Default |
|--------|-------------|---------|
| `-p, --port <port>` | Port to listen on | 3030 |
| `-t, --token <token>` | Auth token (auto-generated if omitted) | - |
| `-H, --host <host>` | Host to bind to | 0.0.0.0 |
| `-m, --model <model>` | Model to use | config default |
| `-u, --url <url>` | Ollama server URL | config default |

### 3. Client Mode

Connect to a remote Compendium server:

```bash
compendium connect localhost:3030 --token YOUR_SECRET_TOKEN
```

The client provides the same REPL interface as local mode, but all AI processing happens on the server.

### 4. Daemon Mode

Run as a headless agent daemon that registers with a server to execute tools remotely:

```bash
compendium daemon \
  --server ws://server:3030 \
  --token YOUR_SECRET_TOKEN \
  --name my-workstation \
  --capabilities read,write,edit,bash,glob,grep
```

Options:
| Option | Description |
|--------|-------------|
| `-s, --server <url>` | Server URL to connect to (required) |
| `-t, --token <token>` | Authentication token (required) |
| `-n, --name <name>` | Machine name for identification (required) |
| `-c, --capabilities <tools>` | Comma-separated list of allowed tools |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      COMPENDIUM                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  LOCAL MODE              SERVER MODE                        │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │   CLI REPL   │        │   WebSocket  │                  │
│  │      +       │        │    Server    │                  │
│  │   AgentCore  │        │      +       │                  │
│  │      +       │        │  AgentCore   │                  │
│  │   Ollama     │        │      +       │                  │
│  └──────────────┘        │  ToolRouter  │                  │
│                          └──────┬───────┘                  │
│                                 │                          │
│                    ┌────────────┼────────────┐             │
│                    │            │            │             │
│               ┌────▼────┐  ┌────▼────┐  ┌────▼────┐       │
│               │ Remote  │  │  Local  │  │ Daemon  │       │
│               │ Client  │  │  Tools  │  │ (Remote)│       │
│               └─────────┘  └─────────┘  └─────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Machine Execution

When running in server mode with connected daemons, the AI can execute tools on specific machines:

1. Start the server:
   ```bash
   compendium serve --port 3030
   ```

2. Connect daemons from other machines:
   ```bash
   # On machine "devbox"
   compendium daemon -s ws://server:3030 -t TOKEN -n devbox

   # On machine "buildserver"
   compendium daemon -s ws://server:3030 -t TOKEN -n buildserver
   ```

3. Connect as a client and ask the AI to run commands on specific machines:
   ```
   > Run "npm test" on devbox
   > Read the build logs from buildserver
   ```

4. Use `/machines` to see connected machines.

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help message |
| `/clear` | Clear conversation history |
| `/model <name>` | Switch to a different model |
| `/models` | List available models |
| `/machines` | List connected machines (client mode) |
| `/history` | Show conversation history |
| `/exit` | Exit the assistant |

## Available Tools

| Tool | Description |
|------|-------------|
| `read` | Read file contents with line numbers |
| `write` | Create or overwrite files |
| `edit` | Find and replace text in files |
| `bash` | Execute shell commands |
| `glob` | Find files by pattern |
| `grep` | Search file contents with regex |

## Configuration

Configuration is stored in `~/.compendium/config.json`:

```json
{
  "ollamaUrl": "http://localhost:11434",
  "model": "qwen2.5-coder:14b",
  "historyEnabled": true
}
```

## Project Structure

```
compendium/
├── src/
│   ├── index.ts              # CLI entry point with all commands
│   ├── cli.ts                # Local REPL loop and command handling
│   ├── llm/
│   │   ├── client.ts         # Ollama API client with streaming
│   │   └── prompts.ts        # System prompts & tool schemas
│   ├── core/
│   │   └── agent.ts          # Central AgentCore orchestrator
│   ├── server/
│   │   ├── index.ts          # WebSocket server implementation
│   │   ├── protocol.ts       # Message type definitions
│   │   ├── auth.ts           # Token authentication
│   │   └── router.ts         # Tool routing to machines
│   ├── client/
│   │   ├── index.ts          # Remote client UI
│   │   └── connection.ts     # WebSocket client wrapper
│   ├── daemon/
│   │   ├── index.ts          # Daemon main class
│   │   ├── executor.ts       # Local tool executor
│   │   └── registration.ts   # Server registration helper
│   ├── tools/
│   │   ├── index.ts          # Tool registry
│   │   ├── read.ts           # File reading
│   │   ├── write.ts          # File writing
│   │   ├── edit.ts           # File editing
│   │   ├── bash.ts           # Shell execution
│   │   ├── glob.ts           # File pattern matching
│   │   └── grep.ts           # Content search
│   ├── history/
│   │   └── store.ts          # Conversation persistence
│   └── utils/
│       ├── config.ts         # Configuration loading
│       └── display.ts        # Terminal formatting
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Run in development mode
npm run dev

# Build
npm run build

# Clean build artifacts
npm run clean
```

## License

MIT
