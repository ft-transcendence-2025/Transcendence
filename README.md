# SPA Modular e Robusta com TypeScript (Sem Frameworks)

Este repositório contém uma Single Page Application (SPA) construída **sem frameworks**, usando apenas **TypeScript**, **HTML**, **CSS** (Tailwind opcional) e roteamento customizado. A arquitetura e boas práticas aqui descritas visam facilitar o desenvolvimento escalável, modular e fácil de manter.

---

## 🚀 Visão Geral

- SPA com roteamento client-side baseado na API de histórico do navegador (`history.pushState`).
- Componentes construídos de forma modular, podendo ser funções, classes ou Web Components.
- Serviços que centralizam a comunicação com backend via `fetch`/`Promise`.
- Gerenciamento simples de estado global com padrão observer/pub-sub.
- Estrutura de pastas clara e escalável para organizar views, componentes, serviços, store e router.
- Build usando Vite para bundlagem e TypeScript para tipagem forte.
- Deploy simplificado via Nginx e Docker.

---

## 📁 Estrutura do Projeto

```
src/
├── components/       # Componentes UI reutilizáveis (botões, inputs, cards, etc)
├── services/         # Comunicação com backend (API calls, autenticação, etc)
├── store/            # Gerenciamento de estado global (stores, observers)
├── views/            # Páginas e telas da aplicação (Home, About, Contact, etc)
├── router.ts         # Roteador client-side
├── main.ts           # Entrada principal da aplicação (bootstrapping)
```

---

## 🏗️ Arquitetura e Organização

### 1. Componentes

- Criar componentes como funções que retornam elementos DOM, classes ou Web Components.
- Componentes devem ser **reutilizáveis e isolados**.
- Evitar manipulação direta do DOM fora dos componentes.
- Exemplo de componente funcional:

```ts
export function MyButton(label: string, onClick: () => void): HTMLElement {
  const btn = document.createElement('button')
  btn.textContent = label
  btn.addEventListener('click', onClick)
  return btn
}
```

- Exemplo de Web Component para encapsulamento mais avançado:

```ts
class MyButton extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
    this.shadowRoot!.innerHTML = `<button><slot></slot></button>`
    this.shadowRoot!.querySelector('button')!.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('clicked'))
    })
  }
}
customElements.define('my-button', MyButton)
```

---

### 2. Serviços (API)

- Centralizar todas as chamadas HTTP em módulos de serviços.
- Usar `fetch` e `async/await` para chamadas assíncronas.
- Tratar erros de rede e respostas inválidas dentro do serviço.
- Exemplo:

```ts
export async function fetchUsers() {
  const response = await fetch('/api/users')
  if (!response.ok) throw new Error('Erro ao carregar usuários')
  return response.json()
}
```

---

### 3. Gerenciamento de Estado (Store)

- Criar stores simples que mantêm o estado global e notificam componentes interessados.
- Usar padrão observer/pub-sub para atualização reativa.
- Exemplo básico de store:

```ts
type Listener = () => void

class Store<T> {
  private state: T
  private listeners: Listener[] = []

  constructor(initialState: T) {
    this.state = initialState
  }

  subscribe(listener: Listener) {
    this.listeners.push(listener)
  }

  getState() {
    return this.state
  }

  setState(newState: T) {
    this.state = newState
    this.listeners.forEach(l => l())
  }
}

export const userStore = new Store<{ users: any[] }>({ users: [] })
```

---

### 4. Roteamento

- Usar a API `history.pushState` para navegação sem reload.
- Criar função roteadora que mapeia rotas para views ou componentes.
- Escutar eventos `popstate` para controlar botões de navegação do navegador.
- Exemplo simples:

```ts
const routes = {
  '/': HomeView,
  '/about': AboutView,
  '/contact': ContactView
}

function router() {
  const path = window.location.pathname
  const view = routes[path] || NotFoundView
  document.getElementById('app')!.innerHTML = ''
  document.getElementById('app')!.appendChild(view())
}

window.addEventListener('popstate', router)
```

---

### 5. Boas Práticas Gerais

- Usar TypeScript para garantir segurança de tipos e melhor manutenção.
- Modularizar código com arquivos e pastas bem definidos.
- Separar lógica de apresentação (componentes) da lógica de dados (serviços e stores).
- Documentar funções, classes e componentes.
- Evitar manipulação direta do DOM fora de componentes para evitar inconsistências.
- Usar ferramentas como Vite para bundling e build otimizado.
- Versionar código com Git e manter README atualizado.

---

## ⚙️ Como Rodar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
```

### Build para produção

```bash
npm run build
```

### Deploy via Docker + Nginx

- Build da imagem Docker:

```bash
docker build -t my-spa-nginx -f nginx-gateway/Dockerfile .
```

- Rodar container:

```bash
docker run -d -p 8080:80 my-spa-nginx
```

Abrir `http://localhost:8080`

---

## 🌟 Considerações Finais

Este projeto é ideal para quem quer controle total sobre a arquitetura, performance e aprendizado profundo do fluxo de uma SPA sem depender de frameworks pesados. Ao seguir essa estrutura, você garante:

- Código limpo e organizado
- Facilidade para adicionar funcionalidades complexas
- Manutenção simplificada e escalabilidade futura
- Boa separação de responsabilidades

---

## 📚 Referências

- [MDN Web Components](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [History API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/History_API)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite Documentation](https://vitejs.dev/)

---

# Vamos codar sem frameworks, com controle total! 🚀

