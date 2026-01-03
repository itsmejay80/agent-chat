# Agent Server

An AI agent server built with [Google ADK](https://google.github.io/adk-docs/) and TypeScript using Bun runtime.

## Features

- 🤖 Built with Google Agent Development Kit (ADK)
- 💬 Chat widget for web integration
- 🌐 RESTful API with Fastify
- 🛠️ Extensible tool system

## Prerequisites

- [Bun](https://bun.sh/) v1.0.0 or later
- A Google API Key from [AI Studio](https://aistudio.google.com/apikey)

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Copy the environment file and add your API key:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your Google API key:
   ```
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```
   
   **Note:** You can also use `GEMINI_API_KEY` instead of `GOOGLE_GENAI_API_KEY`.

## Running the Server

```bash
bun run dev
```

The server will start on `http://localhost:3000` with:
- API endpoints at `/api/*`
- Chat widget at `/widget/chat-widget.js`
- Demo page available in `demo.html`

## Project Structure

```
agent-server/
├── agent.ts          # Agent definition with tools
├── server.ts         # Fastify server with API endpoints
├── widget/           # Chat widget frontend
│   ├── chat-widget.js
│   └── chat-widget.css
├── demo.html         # Demo page
├── .env.example      # Environment variables template
├── package.json
└── README.md
```

## Learn More

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Bun Documentation](https://bun.sh/docs)
