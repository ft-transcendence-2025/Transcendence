
# API Gateway Service Architecture

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Visualization](#architecture-visualization)
- [Architecture Pattern](#architecture-pattern)
- [Module Responsibilities Overview](#module-responsibilities-overview)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Service Integration](#service-integration)
- [Authentication & Authorization](#authentication--authorization)
- [Error Handling](#error-handling)
- [Environment Configuration](#environment-configuration)
- [Deployment](#deployment)
- [Scalability Considerations](#scalability-considerations)
- [Development Workflow](#development-workflow)

## Overview

The API Gateway Service is a Node.js/TypeScript microservice built with Fastify framework that serves as the central entry point for the Transcendence project's distributed architecture. It handles request routing, authentication, authorization, and service orchestration across multiple backend microservices including User Management, Profile Management, and Friendship Management.

The gateway implements JWT-based authentication, role-based authorization policies, and provides a unified API interface for client applications while abstracting the complexity of the underlying microservice architecture.

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **Web Framework**: Fastify
- **Authentication**: JWT (JSON Web Tokens) with @fastify/jwt
- **HTTP Client**: Axios for service communication
- **CORS**: @fastify/cors for cross-origin requests
- **Monitoring**: fastify-metrics for Prometheus metrics
- **Environment**: Docker containerized
- **Load Balancing**: Nginx upstream configuration

## Architecture Visualization

### Complete System Architecture

```mermaid
graph TB
    Client[Client Application] --> Nginx[Nginx Load Balancer]
    Nginx --> Gateway1[API Gateway 1]
    Nginx --> Gateway2[API Gateway 2]
    
    subgraph "API Gateway Layer"
        Gateway1 --> Auth[Authentication Plugin]
        Gateway1 --> Authz[Authorization Plugin]
        Gateway1 --> Metrics[Metrics Plugin]
        Gateway2 --> Auth2[Authentication Plugin]
        Gateway2 --> Authz2[Authorization Plugin]
        Gateway2 --> Metrics2[Metrics Plugin]
    end
    
    subgraph "Route Layer"
        Gateway1 --> UserR[User Routes /api/users]
        Gateway1 --> ProfileR[Profile Routes /api/profiles]
        Gateway1 --> FriendR[Friendship Routes /api/friendships]
        Gateway1 --> AuthR[Auth Routes /api/auth]
    end
    
    subgraph "Service Layer"
        UserR --> UserS[User Service Client]
        ProfileR --> ProfileS[Profile Service Client]
        FriendR --> FriendS[Friendship Service Client]
        AuthR --> AuthS[Auth Service Client]
    end
    
    subgraph "Microservices"
        UserS --> UserMS[User Management Service]
        ProfileS --> UserMS
        FriendS --> UserMS
        AuthS --> UserMS
    end
    
    subgraph "Data Layer"
        UserMS --> Database[(SQLite Database)]
    end
    
    style Client fill:#e1f5fe
    style Nginx fill:#fff3e0
    style Gateway1 fill:#f3e5f5
    style UserMS fill:#e8f5e8
    style Database fill:#e8f5e8
```

### Request Flow Architecture

```mermaid
sequenceDiagram
    participant C as Client
    participant N as Nginx
    participant G as API Gateway
    participant A as Auth Plugin
    participant Az as Authorize Plugin
    participant S as Service Client
    participant MS as Microservice
    
    C->>N: HTTP Request
    N->>G: Route to Gateway
    G->>A: Authenticate Request
    A->>A: Verify JWT Token
    A->>G: Authentication Result
    G->>Az: Authorize Request
    Az->>Az: Check Policies
    Az->>G: Authorization Result
    G->>S: Call Service Client
    S->>MS: HTTP Request to Microservice
    MS->>S: Response Data
    S->>G: Formatted Response
    G->>N: HTTP Response
    N->>C: Final Response
```

### Service Communication Pattern

```mermaid
graph LR
    subgraph "API Gateway"
        Routes[Routes Layer] --> Services[Service Clients]
    end
    
    subgraph "Service Clients"
        UserSC[User Service Client]
        ProfileSC[Profile Service Client]
        FriendSC[Friendship Service Client]
        AuthSC[Auth Service Client]
    end
    
    subgraph "Microservices"
        Services --> UserMS[User Management Service:3000]
    end
    
    subgraph "Environment Routing"
        UserSC --> DevURL[DEV: localhost:3000]
        UserSC --> ProdURL[PROD: user-management:3000]
    end
    
    style Routes fill:#e1f5fe
    style Services fill:#fff3e0
    style UserMS fill:#e8f5e8
```

### Security Flow Diagram

```mermaid
graph TD
    Request[Incoming Request] --> JWT{JWT Token Present?}
    JWT -->|No| Unauthorized[401 Unauthorized]
    JWT -->|Yes| Verify{Verify Token}
    Verify -->|Invalid| Unauthorized
    Verify -->|Valid| Extract[Extract User Claims]
    Extract --> Policy{Check Authorization Policy}
    Policy -->|Denied| Forbidden[403 Forbidden]
    Policy -->|Allowed| Process[Process Request]
    Process --> Service[Call Microservice]
    Service --> Response[Return Response]
    
    style Unauthorized fill:#ffcdd2
    style Forbidden fill:#ffcdd2
    style Response fill:#c8e6c9
```

## Architecture Pattern

The API Gateway follows a **Service-Oriented Architecture (SOA)** with microservice communication:

```
┌─────────────────┐
│   Routes        │  ← HTTP Request/Response handling & routing
├─────────────────┤
│   Plugins       │  ← Authentication, Authorization, Metrics
├─────────────────┤
│ Service Clients │  ← HTTP clients for microservice communication
├─────────────────┤
│  Microservices  │  ← Backend services (User Management, etc.)
└─────────────────┘
```

## Module Responsibilities Overview

### Routes (`/routes`)
**What they do**: Define API endpoints and orchestrate request handling with authentication/authorization.
**Responsibility**: 
- HTTP method and URL pattern definition
- Middleware attachment (authentication, authorization)
- Request/response handling and error management
- Service client orchestration

**Why separate**: Routes act as the "contract" between clients and the gateway, handling HTTP concerns while delegating business logic to service clients.

**Example**: 
```typescript
app.get('/:username', {
  preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
}, async (req, reply) => {
  const response = await userService.getUserByUsername(username);
  reply.send(response.data);
});
```

### Service Clients (`/services`)
**What they do**: Provide HTTP client abstractions for communicating with backend microservices.
**Responsibility**:
- Environment-based URL configuration (dev/prod)
- HTTP request construction and sending
- Response handling and error forwarding
- Service discovery and routing

**Why separate**: Service clients abstract the complexity of microservice communication and provide a clean interface for the gateway to interact with backend services.

**Example**:
```typescript
export class userService {
  static base_url = process.env.NODE_ENV === "production" 
    ? "http://user-management:3000" 
    : "http://localhost:3000";
    
  static async getUserByUsername(username: string) {
    return axios.get(`${this.base_url}/users/${username}`);
  }
}
```

### Plugins (`/plugins`)
**What they do**: Provide cross-cutting concerns like authentication and authorization.
**Responsibility**:
- JWT token verification and validation
- User claim extraction and decoration
- Role-based authorization policy enforcement
- Request decoration with user context

**Why separate**: Plugins provide reusable middleware that can be applied across multiple routes, ensuring consistent security and behavior.

**Example**:
```typescript
app.decorate('authenticate', async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.status(401).send({ message: 'Invalid Token.' });
  }
});
```

### Policies (`/policies`)
**What they do**: Define authorization rules and access control logic.
**Responsibility**:
- User permission validation
- Resource access control
- Role-based access decisions
- Request context evaluation

**Why separate**: Policies centralize authorization logic, making it easier to maintain, test, and audit security rules.

**Example**:
```typescript
export const canViewUser = (user: any, req: any) => {
  const username = req.params.username;
  return user?.role === 'admin' || user.username === username;
};
```

## Project Structure

```
src/
├── app.ts                    # Fastify application setup and plugin registration
├── server.ts                 # Server entry point and lifecycle management
├── plugins/                  # Cross-cutting concerns
│   ├── auth.ts              # JWT authentication plugin
│   └── authorize.ts         # Authorization middleware plugin
├── policies/                 # Authorization policies
│   └── user-policy.ts       # User access control rules
├── routes/                   # API route definitions
│   ├── auth.routes.ts       # Authentication endpoints
│   ├── user.routes.ts       # User management endpoints
│   ├── profile.routes.ts    # Profile management endpoints
│   └── friendship.routes.ts # Friendship management endpoints
├── services/                 # Service client layer
│   └── User-Management/     # User Management service clients
│       ├── auth.service.ts
│       ├── user.service.ts
│       ├── profile.service.ts
│       └── friendship.service.ts
└── utils/                    # Shared utilities
```

## Core Components

### 1. Application Layer (`app.ts`)

- **Fastify Instance**: Configured with environment-based logging
- **Plugin Registration**: Authentication, authorization, and metrics
- **Route Registration**: Modular route mounting with API prefixes
- **CORS Configuration**: Cross-origin request handling

### 2. Authentication System

#### JWT Authentication Plugin
- **Token Verification**: Validates JWT tokens on protected routes
- **User Decoration**: Extracts user claims and decorates requests
- **Error Handling**: Returns appropriate HTTP status codes for auth failures

#### Authorization Plugin
- **Policy Enforcement**: Executes authorization policies
- **Context-Aware**: Evaluates user permissions based on request context
- **Flexible Rules**: Supports custom authorization logic

### 3. Service Client Layer

#### Environment-Aware Routing
Service clients automatically route to appropriate backends based on environment:

**Development**: Routes to `localhost:3000` (local development)
**Production**: Routes to `user-management:3000` (Docker container)

#### Service Classes
- **userService**: User CRUD operations and management
- **authService**: Authentication and 2FA operations
- **profileService**: Profile management and avatar handling
- **friendshipService**: Friendship and relationship management

### 4. Policy System

#### Authorization Policies
- **canViewUser**: Allows users to view their own profile or admins to view any
- **canListUsers**: Restricts user listing to administrators
- **Resource-based**: Policies evaluate both user roles and resource ownership

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Authentication | Authorization | Request Body | Response |
|--------|----------|-------------|----------------|---------------|--------------|----------|
| `POST` | `/api/auth/login` | User authentication with optional 2FA | None | None | `{ username, password, token? }` | `{ token }` |
| `POST` | `/api/auth/register` | User registration | None | None | `{ username, password, email? }` | `{ token }` |
| `POST` | `/api/auth/:username/2fa/generate` | Generate 2FA QR code | JWT Required | Self/Admin | - | `{ qr, otpauthUrl }` |
| `POST` | `/api/auth/:username/2fa/enable` | Enable two-factor authentication | JWT Required | Self/Admin | `{ token }` | `{ message }` |
| `POST` | `/api/auth/:username/2fa/disable` | Disable two-factor authentication | JWT Required | Self/Admin | - | `{ message }` |

### User Management Routes (`/api/users`)

| Method | Endpoint | Description | Authentication | Authorization | Request Body | Response |
|--------|----------|-------------|----------------|---------------|--------------|----------|
| `GET` | `/api/users` | List all users | JWT Required | Admin Only | - | `User[]` |
| `GET` | `/api/users/:username` | Get user by username | JWT Required | Self/Admin | - | `User` |
| `PUT` | `/api/users/:username` | Update user information | JWT Required | Self/Admin | `{ email?, password? }` | `{ message, user }` |
| `PATCH` | `/api/users/:username` | Disable user (soft delete) | JWT Required | Self/Admin | - | `{ message }` |
| `DELETE` | `/api/users/:username` | Delete user permanently | JWT Required | Self/Admin | - | `{ message }` |

### Profile Management Routes (`/api/profiles`)

| Method | Endpoint | Description | Authentication | Authorization | Request Body | Response |
|--------|----------|-------------|----------------|---------------|--------------|----------|
| `POST` | `/api/profiles/:username` | Create user profile | JWT Required | Self/Admin | `{ bio?, gender?, nickName?, firstName?, lastName?, language? }` | `{ message, profile }` |
| `GET` | `/api/profiles/:username` | Get user profile | JWT Required | Self/Admin | - | `Profile` |
| `PUT` | `/api/profiles/:username` | Update profile information | JWT Required | Self/Admin | `{ bio?, gender?, nickName?, firstName?, lastName?, language?, status? }` | `{ message, profile }` |
| `DELETE` | `/api/profiles/:username` | Delete user profile | JWT Required | Self/Admin | - | `{ message }` |

### Friendship Management Routes (`/api/friendships`)

| Method | Endpoint | Description | Authentication | Authorization | Request Body | Response |
|--------|----------|-------------|----------------|---------------|--------------|----------|
| `POST` | `/api/friendships` | Send friend request | JWT Required | Authenticated | `{ fromUserId, toUserId }` | `{ message, friendship }` |
| `GET` | `/api/friendships/requests/:username` | Get pending friend requests | JWT Required | Self/Admin | - | `Friendship[]` |
| `GET` | `/api/friendships/list/:username` | List user's friends | JWT Required | Self/Admin | - | `User[]` |
| `PATCH` | `/api/friendships/respond/:friendshipId` | Accept/decline friend request | JWT Required | Authenticated | `{ status }` (ACCEPTED/DECLINED/BLOCKED) | `{ message, friendship }` |
| `DELETE` | `/api/friendships` | Remove friend/block user | JWT Required | Authenticated | `{ fromUserId, toUserId }` | `{ message }` |

### HTTP Status Codes

| Status Code | Meaning | When Used |
|-------------|---------|-----------|
| `200` | OK | Successful GET, PUT, PATCH operations |
| `201` | Created | Successful POST operations |
| `400` | Bad Request | Invalid input, validation errors |
| `401` | Unauthorized | Missing or invalid JWT token |
| `403` | Forbidden | Valid token but insufficient permissions |
| `404` | Not Found | Resource not found |
| `500` | Internal Server Error | Service communication errors, server-side errors |
| `502` | Bad Gateway | Upstream service unavailable |
| `503` | Service Unavailable | Service temporarily unavailable |

### Request/Response Examples

#### User Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "securePassword123!"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get User Profile (Authenticated)
```bash
GET /api/profiles/johndoe
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "id": "uuid-123",
  "username": "johndoe",
  "bio": "Software developer passionate about gaming",
  "language": "ENGLISH",
  "status": "ONLINE",
  "createdAt": "2023-12-01T10:00:00Z"
}
```

#### Send Friend Request
```bash
POST /api/friendships
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "fromUserId": "uuid-123",
  "toUserId": "uuid-456"
}
```

## Security Features

### JWT Authentication
- **Token-based Authentication**: Stateless JWT tokens with configurable expiration
- **Secure Secret**: Environment-based JWT secret configuration
- **Token Verification**: Automatic token validation on protected routes
- **User Context**: Extracted user claims available in request context

### Authorization Policies
- **Role-based Access Control**: Admin and user role differentiation
- **Resource Ownership**: Users can only access their own resources
- **Policy Composition**: Flexible policy combination and evaluation
- **Context-aware Decisions**: Authorization based on request parameters

### CORS Protection
- **Cross-Origin Control**: Configurable CORS policies
- **Origin Validation**: Environment-specific origin restrictions
- **Preflight Handling**: Automatic OPTIONS request handling

### Request Validation
- **Input Sanitization**: Request body and parameter validation
- **Type Safety**: TypeScript interfaces for request/response types
- **Error Handling**: Consistent error response formatting

## Service Integration

### Microservice Communication
- **HTTP Client**: Axios-based service communication
- **Environment Routing**: Automatic dev/prod service discovery
- **Error Propagation**: Transparent error forwarding from services
- **Timeout Handling**: Configurable request timeouts

### Service Discovery
```typescript
// Environment-based service URLs
const BASE_URL = process.env.NODE_ENV === "production"
  ? process.env.PROD_USER_URL        // Docker: user-management:3000
  : process.env.DEV_USER_URL;        // Local: http://localhost:3000
```

### Load Balancing
The API Gateway operates behind Nginx with upstream configuration:
```nginx
upstream gateway_upstream {
    server api-gateway-1:3000 max_fails=3 fail_timeout=10s;
    server api-gateway-2:3000 max_fails=3 fail_timeout=10s;
    least_conn;
}
```

## Authentication & Authorization

### JWT Token Structure
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "username": "username",
  "role": "user|admin",
  "exp": 1640995200
}
```

### Authorization Flow
1. **Token Extraction**: Extract JWT from Authorization header
2. **Token Verification**: Validate token signature and expiration
3. **User Decoration**: Add user claims to request context
4. **Policy Evaluation**: Execute route-specific authorization policies
5. **Access Decision**: Allow or deny request based on policy result

### Policy Examples
```typescript
// Self or admin access
export const canViewUser = (user: any, req: any) => {
  const username = req.params.username;
  return user?.role === 'admin' || user.username === username;
};

// Admin-only access
export const canListUsers = (user: any) => {
  return user?.role === 'admin';
};
```

## Error Handling

### Error Categories
- **Authentication Errors**: Invalid or missing JWT tokens
- **Authorization Errors**: Insufficient permissions
- **Service Communication Errors**: Upstream service failures
- **Validation Errors**: Invalid request format or data

### Error Response Format
```json
{
  "message": "Error description",
  "error": "Additional error details",
  "statusCode": 400
}
```

### Error Propagation
The gateway transparently forwards errors from backend services while ensuring consistent error formatting for clients.

## Environment Configuration

### Required Environment Variables
```bash
# JWT Configuration
JWT_SECRET=your-secret-key

# Service URLs - Development
DEV_USER_URL=http://localhost:3000
DEV_AUTH_URL=http://localhost:3000/auth
DEV_PROFILE_URL=http://localhost:3000/profiles
DEV_FRIENDSHIP_URL=http://localhost:3000/friendships

# Service URLs - Production
PROD_USER_URL=http://user-management:3000
PROD_AUTH_URL=http://user-management:3000/auth
PROD_PROFILE_URL=http://user-management:3000/profiles
PROD_FRIENDSHIP_URL=http://user-management:3000/friendships

# Server Configuration
NODE_ENV=development|production
PORT=3000
HOST=0.0.0.0
```

### Logging Configuration
- **Development**: Pretty-printed logs with timestamps
- **Production**: JSON structured logging for log aggregation
- **Test**: Minimal logging output

## Deployment

### Docker Configuration
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Container Orchestration
The gateway runs as multiple instances behind an Nginx load balancer:
```yaml
services:
  api-gateway-1:
    build: ./API-Gateway
    networks: [internal]
  
  api-gateway-2:
    build: ./API-Gateway
    networks: [internal]
    
  nginx:
    build: ./Front-End
    ports: ["5000:443", "8080:80"]
    networks: [public, internal]
```

### Health Checks
- **Readiness Probe**: `/health` endpoint for container health
- **Liveness Probe**: Process monitoring and restart capability
- **Metrics Endpoint**: `/metrics` for Prometheus monitoring

## Scalability Considerations

### Horizontal Scaling
- **Stateless Design**: No session state stored in gateway instances
- **Load Balancing**: Nginx upstream configuration with health checks
- **Service Discovery**: Environment-based service URL configuration
- **Container Orchestration**: Docker Compose and Kubernetes ready

### Performance Optimization
- **Connection Pooling**: HTTP client connection reuse
- **Request Caching**: Potential for response caching implementation
- **Compression**: Gzip compression for response optimization
- **Monitoring**: Prometheus metrics for performance tracking

### Fault Tolerance
- **Circuit Breaker**: Potential implementation for service protection
- **Retry Logic**: Configurable retry mechanisms for service calls
- **Graceful Degradation**: Fallback mechanisms for service failures
- **Health Checks**: Upstream service health monitoring

## Development Workflow

### Build Process
```bash
npm run dev    # Development server with hot reload
npm run build  # TypeScript compilation to dist/
npm start      # Production server from compiled code
```

### Local Development
1. **Start Services**: Run User Management service locally
2. **Environment Setup**: Configure DEV_* environment variables
3. **Gateway Startup**: Run `npm run dev` for hot reload
4. **Testing**: Use Postman/curl for endpoint testing

### Testing Strategy
- **Unit Tests**: Service client and plugin testing
- **Integration Tests**: End-to-end API testing
- **Load Testing**: Performance and scalability validation
- **Security Testing**: Authentication and authorization validation

This API Gateway provides a robust, scalable, and secure entry point for the Transcendence project's microservice architecture, with comprehensive authentication, authorization, and service orchestration capabilities.
  const { username } = req.params as { username: string };
  const response = await userService.getUserByUsername(username);
  reply.send(response.data);
});
```

---

## 🔐 3. Autenticação JWT

A autenticação é implementada com o plugin `@fastify/jwt`, registrado como um plugin Fastify em `src/plugins/auth.ts`.

### 📄 Exemplo: `auth.ts`

```ts
app.decorate('authenticate', async (req, reply) => {
  try {
    await req.jwtVerify();
  } catch {
    reply.status(401).send({ message: 'Invalid Token.' });
  }
});
```

---

## ⚖️ 4. Autorização com Policies

As **policies** são funções que avaliam regras de negócio antes de permitir acesso a determinadas rotas. São injetadas via `app.authorize()`.

### 📄 Exemplo: `user-policy.ts`

```ts
export const canViewUser = (user, req) => {
  return user?.role === 'admin' || user.username === req.params.username;
};

export const canListUsers = (user) => {
  return user?.role === 'admin' || user.username === "bene";
};
```

### 📄 Exemplo: `authorize.ts`

```ts
app.decorate('authorize', (validate) => {
  return async (req, reply) => {
    const user = req.user;
    if (!validate(user, req)) {
      reply.status(403).send({ message: 'Access denied.' });
    }
  };
});
```

---

## 🧩 5. Registro da Aplicação

O core da aplicação (`src/app.ts`) registra todos os plugins e rotas:

```ts
app.register(authPlugin);
app.register(authorizePlugin);

app.register(userRoutes, { prefix: 'api/users' });
app.register(profileRoutes, { prefix: 'api/profiles' });
app.register(friendshipRoutes, { prefix: 'api/friendships' });
// chatRoutes e gameRoutes comentados, em testes ou desenvolvimento.
```

---

## 🔁 Fluxo de Requisição

```
Cliente → Rota Fastify → [Autenticação JWT] → [Policy (autorização)] → Controller → Service → Microserviço
```

---

## ✅ Benefícios da Arquitetura

- **Segurança Centralizada**: JWT e policies aplicadas antes de atingir os microserviços.
- **Modularidade**: serviços e regras isoladas, facilitando manutenção e testes.
- **Escalabilidade**: novos microserviços podem ser adicionados facilmente.
- **Ambientes Suportados**: lógica baseada em `NODE_ENV` para URLs dinâmicas.
- **Extensível**: políticas e plugins adicionais podem ser incluídos conforme necessidade.
