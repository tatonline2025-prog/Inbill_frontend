## Local Setup (Dev/Test/Build)

1. Create local env file from template:

```bash
cp .env.example .env
```

If you are on PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Ensure backend API is running at `http://localhost:3000`.

3. Run frontend locally:

```bash
npm run dev:local
```

Frontend runs at `http://localhost:3001` and proxies `/backend/*` to backend origin (`BACKEND_ORIGIN`).

## Local Commands

```bash
npm run dev:local
npm run test:local
npm run build:local
npm run start:local
```

## Environment Variables

- `NEXT_PUBLIC_API_BASE_URL`: default `/backend` for local proxy mode.
- `BACKEND_ORIGIN`: backend server target, default `http://localhost:3000`.
