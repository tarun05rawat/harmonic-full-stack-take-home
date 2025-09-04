# Harmonic Jam

Welcome to the jam! :D Hopefully these instructions make your setup seamless! :star:

The frontend repo will get you setup with a React server written in TypeScript.

## 🏗️ Architecture & Professional Features

This application demonstrates enterprise-level React development practices:

### Frontend Stack

- **React 18.3.1** with TypeScript - Type-safe modern React development
- **Material-UI 5.16.6** - Professional component library with theming
- **Vite** - Fast build tool optimized for modern development
- **Axios** - HTTP client with robust error handling

### Code Quality Features

- **Comprehensive TypeScript** - Strict typing with JSDoc documentation
- **Error Boundaries** - Graceful error handling and recovery
- **Custom Hooks** - Clean separation of business logic
- **Environment Configuration** - Secure, flexible deployment setup
- **Retry Logic** - Resilient API calls with exponential backoff

### Code Organization

```
src/
├── components/         # Reusable UI components with error boundaries
├── hooks/             # Custom React hooks (useTransfer, useApi)
├── utils/             # API clients and helper functions
├── config/            # Environment-based configuration
├── constants/         # Centralized application constants
└── types/             # TypeScript type definitions
```

# Setup

1. Ensure you have either node v18+ or v20+ installed ([install node](https://nodejs.org/en/download/package-manager/all) if you don't have it yet)
1. Make sure we are in the frontend directory:
   ```bash
   pwd
   > fullstack-jam/frontend
   ```
1. Run `npm install`
1. Followed by `npm run dev`
1. Navigate to http://localhost:5173 to see your React server.
