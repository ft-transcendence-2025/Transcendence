
# API Gateway

This API Gateway serves as the single entry point for the multiplayer‑app backend.  
It handles routing, authentication, and service discovery for microservices such as **User Management**, **Game**, and **Chat**.

## ✨ Features
- Centralized HTTP routing and reverse‑proxy
- JWT verification (`Authorization: Bearer <token>`)
- Simple load‑balancing & health checks
- Environment‑driven service discovery
- Ready for rate‑limiting, logging and WebSocket passthrough

## 🛠 Tech Stack
| Tool | Purpose |
|------|---------|
| **Fastify** | High‑performance HTTP framework |
| **@fastify/jwt** | JWT auth & token decoding |
| **Node.js 20** | Runtime |
| **Docker** | Containerisation (optional) |

## 🚀 Quick Start

```bash
# clone
git clone https://github.com/your‑org/api‑gateway.git
cd api‑gateway

# install deps
npm install

# copy env and edit secrets / service URLs
cp .env.example .env

# dev mode
npm run dev
```

`.env` example:
```env
PORT=3000
JWT_SECRET=supersecret
USER_SERVICE_URL=http://user-service:3001
PROFILE_SERVICE_URL=http://profile-service:3002
FRIENDSHIP_SERVICE_URL=http://friendship-service:3003
```

## 🗺️  Routing Map
```
/users        -> USER_SERVICE_URL
/profiles     -> PROFILE_SERVICE_URL
/friendships  -> FRIENDSHIP_SERVICE_URL
```

## 🏗️  Docker

Build and run with Docker:

```bash
docker build -t api-gateway .
docker run -p 3000:3000 --env-file .env api-gateway
```

## 🛣️  Roadmap
- [ ] Rate‑limiting middleware
- [ ] Centralised request logging
- [ ] Role‑based access control
- [ ] WebSocket aggregation for real‑time presence

## 📄 License
MIT
