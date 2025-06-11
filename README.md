# Frontend SPA with TypeScript, Tailwind & Nginx

This is a lightweight Single Page Application (SPA) built with plain TypeScript and Tailwind CSS — no frameworks. The project uses Vite for bundling and builds into a static site served by Nginx in Docker.

## Features

- ⚡️ Vite-powered TypeScript bundling
- 🎨 Optional Tailwind CSS styling
- 🧭 Client-side routing with clean URLs
- 🐳 Dockerized Nginx serving `dist/` as static files
- 🔐 HTTPS-ready with configurable TLS certs

## Run Locally

```bash
```bash
npm install
npm run build
docker compose -f @workspace/docker-compose.yml up --build
```
