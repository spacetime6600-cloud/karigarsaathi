# Frontend Testing Strategy

## 1. Test Architecture

The testing strategy uses **Vitest** with **React Testing Library** and **JSDOM**:
- **Unit Tests**: Domain logic, pricing calculators, fact extraction, passport hash generation.
- **Integration Tests**: Product draft workflows, public/private field filtering, and offline sync queue management.
- **Role Isolation**: Verification that public craft passport views expose no private data, and coordinator views maintain role separation.

## 2. Test Execution Commands

```bash
# Run complete test suite
npm run test

# Run tests in watch mode
npm run test:watch

# Run TypeScript type check
npm run typecheck

# Run ESLint validation
npm run lint

# Production build validation
npm run build
```
