# Dale · AI Automation Portfolio

A personal portfolio that **demonstrates** AI automation skills instead of just
describing them. The site itself is the proof of work:

- A live **AI-powered chat agent** that answers questions about Dale.
- Six **interactive demos** (content generator, TH↔EN translator, multi-agent
  pipeline, KPI analyser, CRM assistant, n8n workflow explainer).

Built with **Vite + React + Tailwind CSS + React Router**, powered by the
**Google Gemini API** (`gemini-2.0-flash`, free tier).

## How the API key is kept secret

The model is **never called directly from the browser**. Every request goes
through a Vercel serverless function at [`api/claude.js`](api/claude.js), which
holds the key server-side in the `GEMINI_API_KEY` environment variable. The
browser only ever calls our own `/api/claude` endpoint via the shared helper
[`src/lib/claude.js`](src/lib/claude.js). This means the key is **not** bundled
into the public client JavaScript.

## Local development

```bash
npm install
npm i -g vercel        # once, for the local serverless proxy

cp .env.example .env   # then paste your free GEMINI_API_KEY into .env
vercel dev             # runs the app + /api/claude proxy together
```

> Get a free Gemini key at [aistudio.google.com](https://aistudio.google.com) — no card required.

> `npm run dev` works for pure UI work, but the Claude-powered features need the
> `/api/claude` function, which only runs under `vercel dev`.

## Project structure

```
api/claude.js              Serverless proxy to the Claude API
src/lib/claude.js          Shared client helper (callClaude)
src/lib/prompts.js         System prompts (chat agent + demos)
src/components/            Navbar, Footer, ChatAgent, ProjectCard, DemoModal, ...
src/demos/                 The six interactive demos
src/pages/                 HomePage, ProjectsPage, AboutPage
src/data/projects.js       Project catalogue
```

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, **Import** the GitHub repo (framework auto-detected as Vite).
3. Add an environment variable: `GEMINI_API_KEY` = your key
   (**not** `VITE_`-prefixed).
4. Deploy. Every push to `main` auto-deploys.

## Before sending to employers

- [ ] Replace the placeholder bio in `src/pages/AboutPage.jsx`.
- [ ] Add a real CV link (the "Download CV" button currently points to `#`).
- [ ] Update the chat system prompt in `src/lib/prompts.js` with real project details.
- [ ] Confirm `GEMINI_API_KEY` is set in Vercel.
- [ ] Test the live URL: chat agent + at least one demo.
- [ ] Note: demos run on Gemini's free tier, while your résumé highlights Claude
      experience — decide whether to mention both, or keep them as-is.
