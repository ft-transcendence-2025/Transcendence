
# 📘 Documentação da API Gateway

Esta API Gateway centraliza, autentica, roteia e regula o acesso às rotas da aplicação distribuída baseada em microserviços. Abaixo está a explicação de sua estrutura e funcionamento, com exemplos práticos da implementação.

---

## 🧱 Arquitetura Geral

A aplicação segue uma arquitetura modular e baseada em **Fastify**, composta pelos seguintes blocos principais:

- **Routes + Controllers**: definem os endpoints da API e direcionam para os serviços.
- **Services**: responsáveis por se comunicar com os microserviços.
- **Policies**: definem regras de autorização específicas por rota.
- **Plugins**: fornecem autenticação JWT e autorização customizada.
- **App Core**: registra plugins, rotas e inicializa o servidor Fastify.

---

## 📦 1. Services

Localizados em `src/services/`, esses arquivos são responsáveis por se comunicar com os microserviços via HTTP (Axios). Servem como uma camada de abstração entre a API Gateway e os serviços internos.

### 📄 Exemplo: `user-service.ts`

```ts
const BASE_URL = process.env.NODE_ENV == "production"
  ? "http://user-management:3000"
  : "http://localhost:3000";

export const getUsers = () => axios.get(`${BASE_URL}/users`);
export const getUserByUsername = (username: string) => axios.get(`${BASE_URL}/users/${username}`);
export const updateUser = (username: string, body: any) => axios.put(`${BASE_URL}/users/${username}`, body);
export const disableUser = (username: string) => axios.patch(`${BASE_URL}/users/${username}`);
export const deleteUser = (username: string) => axios.delete(`${BASE_URL}/users/${username}`);
export const login = (body: any) => axios.post(`${BASE_URL}/auth/login`, body);
export const register = (body: any) => axios.post(`${BASE_URL}/users`, body);
```

---

## 🛣️ 2. Routes + Controllers

As rotas estão registradas em `src/routes/` e são associadas a controllers inline, mantendo o código simples e funcional. Cada rota pode ter middlewares como autenticação (`authenticate`) e autorização (`authorize`).

### 📄 Exemplo: `userRoutes.ts`

```ts
app.get('/:username', {
  preHandler: [app.authenticate, app.authorize(policy.canViewUser)],
}, async (req, reply) => {
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
