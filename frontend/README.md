# Mental Coach — Frontend

Next.js frontend for the Mental Coach app. It talks to the FastAPI backend and is styled like classic NES Tetris.

## Prerequisites

- **Node.js 18+** (which includes `npm`). If you see `zsh: command not found: npm`, install or enable Node (see below).
- Backend API running (see repo root `api/README.md`). Default: `http://localhost:8000`.

### Installing Node.js and npm

You need Node.js (and npm) on your PATH. Choose one option:

- **Homebrew (macOS):**
  ```bash
  brew install node
  ```
  Then open a **new terminal** and run `npm --version` to confirm.

- **Official installer:**  
  Download the LTS version from [nodejs.org](https://nodejs.org/) and run the installer. Restart your terminal afterward.

- **If you use nvm (Node Version Manager):**
  ```bash
  nvm install 20
  nvm use 20
  ```
  Or ensure nvm is loaded in your shell (e.g. add the nvm lines to `~/.zshrc` and open a new terminal).

After `npm` is available, continue with **Run locally** below.

## Run locally

1. **Install dependencies**

   ```bash
   cd frontend && npm install
   ```

2. **Start the backend** (from repo root)

   ```bash
   uv run uvicorn api.index:app --reload
   ```

   Leave this running on port 8000.

3. **Start the frontend**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You can type messages and get replies from the mental coach.

## Environment

- **`NEXT_PUBLIC_API_URL`** (optional) — Backend base URL. If unset, the app uses `http://localhost:8000`. Set this on Vercel to your deployed API URL.

## Build for production

```bash
npm run build
npm start
```

## Deploy on Vercel

- Connect the repo to Vercel and set the **root directory** to `frontend` (or deploy the `frontend` folder).
- Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g. your Vercel serverless API or another host).
