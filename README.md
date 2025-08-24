# Pink Pong Frontend

<iframe width="768" height="432" src="https://miro.com/app/live-embed/uXjVIo83pAE=/?embedMode=view_only_without_ui&moveToViewport=-2167,-1117,4398,2098&embedId=799500446367" frameborder="0" scrolling="no" allow="fullscreen; clipboard-read; clipboard-write" allowfullscreen></iframe>

## Development Setup

### Run project as production (ignore docker compose override for dev)

`docker compose -f docker-compose.yml up --build`

### Run project as dev (watch html and ts files)

In the frontend folder:
`npm run dev`

In the root folder (find the compose dev file in Transcendence repo):
`docker compose -f docker-compose.dev.yml up`

# Project Structure

```
frontend/
├── public/                     # Static assets and HTML templates
│   ├── index.html             # Main entry point
│   ├── assets/                # Static resources (icons, images)
│   └── html/                 # Component HTML templates
│       ├── pong.html         # Pong game interface
│       ├── navbar.html       # Navigation bar component
│       └── ...               # Other HTML templates
├── src/                      # TypeScript source code
│   ├── app.ts               # Main application entry point
│   ├── app.css              # Global styles and Tailwind configuration
│   ├── components/          # Reusable UI components
│   │   ├── navbar.ts        # Navigation bar functionality
│   │   └── ...              # Other components
│   ├── router/              # Client-side routing
│   ├── services/            # API communication layer
│   ├── utils/               # Utility functions
│   │   ├── jwtUtils.ts      # JWT token handling
│   │   └── ...              # Other utilities
│   └── views/               # Page view controllers
│       ├── pong.ts          # Pong game controller
│       └── ...              # Other views
├── package.json             # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── .env
```

## Code Organization

### Architecture Pattern

- **Component-Based**: Each UI component has a corresponding TypeScript file for logic
- **Template Separation**: HTML templates are stored separately from TypeScript logic
- **Service Layer**: API communication is abstracted into service modules
- **Router-Based**: Single Page Application (SPA) with client-side routing

### Key Design Principles

1. **Separation of Concerns**

   - HTML templates in `/public/html/`
   - TypeScript logic in `/src/`
   - Styles in `/src/app.css` with Tailwind classes

2. **Authentication Flow**

   - JWT tokens stored in localStorage
   - Token decoding utilities in `jwtUtils.ts`
   - Authentication state managed across components

3. **Custom Styling System**

   - Semantic color variables using Tailwind v4 `@theme` directive
   - Custom utility classes for shadows and effects
   - Consistent theme throughout

4. **API Layer**
   - Generic request wrapper in `utils/api.ts`
   - Service-specific modules for different API endpoints
   - Automatic token injection for authenticated requests

### Main Entry Points

- **`app.ts`**: Application initialization and router setup
- **`router.ts`**: Route handling and navigation logic
- **`navbar.ts`**: Authentication state and navigation
- **Component Views**: Individual page controllers in `/views/`

### Avatars

[Flaticon](https://www.flaticon.com/)
