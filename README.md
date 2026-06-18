# ATS Resume Match — AI Career Intelligence

> Free, self-hostable ATS resume optimizer. 100% client-side. No backend. Your data never leaves your browser.

![ATS Resume Match](https://img.shields.io/badge/self--hostable-yes-brightgreen) ![License](https://img.shields.io/badge/license-MIT-blue) ![Tech](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-indigo) ![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)

## ✨ Features

| Feature | Without API Key | With OpenAI API Key |
|---|---|---|
| Resume Upload (PDF, DOCX, TXT, MD) | ✅ | ✅ |
| ATS Text Extraction & "What the ATS Sees" View | ✅ | ✅ |
| **Resume Type Detection** (7 profiles) | ✅ | ✅ |
| **Dynamic Section Ordering** (profile-aware) | ✅ | ✅ |
| Section Detection & Formatting Warnings | ✅ | ✅ |
| ATS Score (0–100) with 5-dimension breakdown | ✅ | ✅ |
| Keyword Gap Analysis | ✅ (rule-based) | ✅ (AI-enhanced) |
| Resume Structuring | ✅ (local parser) | ✅ (GPT-4o-mini) |
| Deterministic ATS Optimization | ✅ | ✅ |
| AI Resume Optimization | ❌ | ✅ (GPT-4o-mini) |
| Job Description Parsing | ✅ (rule-based) | ✅ (AI cross-referenced) |
| Before/After Diff Viewer | ✅ | ✅ |
| Export PDF / DOCX / TXT / MD | ✅ (professional templates) | ✅ (**AI-Enhanced** export) |
| Cover Letter Generation | ❌ | ✅ |

## 🧠 Resume Type Detection

The app automatically detects which of **7 resume profiles** best fits your resume and adapts the section order accordingly:

| Profile | Best For | Section Priority |
|---|---|---|
| 🏢 Experienced Professional | 5+ years, linear career | Experience → Skills → Education |
| 🌱 Mid-Level | 2–5 years | Experience → Skills → Education |
| 🎓 Entry-Level | 0–2 years, limited experience | Skills → Education → Projects → Experience |
| 🎒 Student / New Grad | Still enrolled | Education → Projects → Skills → Experience |
| 🔬 Academic / Researcher | PhD, publications | Education → Research → Publications → Experience |
| 📜 Certification-Heavy | Certs outweigh degrees | Certifications → Skills → Experience → Education |
| 🔄 Career Changer | Gap or pivot detected | Summary → Transferable Skills → Education → Experience |

Section ordering is applied consistently across **optimization, PDF export, DOCX export, TXT export, and Markdown export**.

## 🤖 AI Integration (ATS Best Practices)

When an OpenAI API key is provided, every AI call is grounded in ATS best practices from Harvard OCS and Columbia CCE guidelines:

- **Parse Resume** — extracts structured data while preserving the full original context
- **Parse Job Description** — cross-references resume keywords to surface real gaps
- **Optimize Resume** — rebuilds the *entire* existing resume (never generates from scratch), incorporates detected profile, applies CAR-method bullet rewrites, strong action verbs, and keyword injection
- **Export (AI-Enhanced)** — each downloaded file is formatted by a dedicated AI call before writing to disk; downloads show a ✨ **AI-Enhanced** badge
- **Cover Letter** — tailored with full resume + job description context

## 📤 Export Quality

All exports use profile-aware section ordering and professional formatting:

| Format | Template |
|---|---|
| **PDF** | Professional typography, section rules, bullet points, contact header |
| **DOCX** | Properly structured Word document using `Packer.toBlob` (browser-compatible) |
| **TXT** | Clean plain-text with consistent spacing (ATS-safe) |
| **Markdown** | Structured `.md` with headings and bullet lists |

When an API key is present, exports are AI-formatted before download for maximum quality.

## 🔒 Privacy First

- Your resume is **never uploaded to any server** — everything runs in the browser
- OpenAI API key is stored **in memory only** — it disappears when you close the tab
- No analytics, no tracking, no cookies
- Non-AI features work completely **offline**

## 🚀 Self-Hosting

### Option 1: Vercel (Recommended, 1-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ats-resume-improver)

### Option 2: Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/ats-resume-improver)

### Option 3: GitHub Pages

1. Fork this repository
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. Push — it deploys automatically via the included workflow

### Option 4: Local Development (npm)

```bash
# Clone
git clone https://github.com/YOUR_USERNAME/ats-resume-improver
cd ats-resume-improver

# Install & run
make install
make dev           # http://localhost:5173

# Or without Make
npm install
npm run dev
```

### Option 5: Docker (Recommended for reproducible environments)

```bash
# Development — hot-reload on http://localhost:5173
make docker-dev

# Production — nginx on http://localhost:8080
make docker-prod

# Or with docker compose directly
docker compose up --build dev
docker compose up --build prod
```

See **[Makefile reference](#-makefile-reference)** below for all available targets.

### Option 6: Static File Server

```bash
make build
npx serve dist
# or
python3 -m http.server 8080 --directory dist
```

## 🐳 Docker

The project ships with a **multi-stage Dockerfile** and a **docker-compose.yml** covering both development and production:

```
Dockerfile
├── dev    — Node 20 Alpine + Vite dev server (hot-reload, port 5173)
├── builder — Node 20 Alpine + npm run build
└── prod   — nginx 1.26 Alpine serving ./dist (port 80/8080)
```

`docker-compose.yml` exposes two services:

| Service | Target stage | Host port | Description |
|---|---|---|---|
| `dev` | `dev` | 5173 | Hot-reload dev server with source volume mount |
| `prod` | `prod` | 8080 | Optimised nginx static build |

### Volume mount for hot-reload

The `dev` service mounts the project root into `/app` while keeping `node_modules` inside the container:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

Edit any file locally and the browser refreshes instantly — no rebuild needed.

## 🛠 Makefile Reference

Run `make` or `make help` to see all targets:

```
  install                Install npm dependencies
  dev                    Start local development server (http://localhost:5173)
  build                  Build production bundle into ./dist
  preview                Build then preview production bundle (http://localhost:4173)
  clean                  Remove build artefacts and node_modules

  docker-dev             Build & start dev container with hot-reload (http://localhost:5173)
  docker-dev-detach      Build & start dev container in the background
  docker-dev-down        Stop & remove the dev container
  docker-prod            Build & start production nginx container (http://localhost:8080)
  docker-prod-detach     Build & start production container in the background
  docker-prod-down       Stop & remove the production container

  docker-build           Build both Docker images without starting containers
  docker-clean           Remove all project Docker images and volumes
  logs                   Tail logs from all running containers
```

## 🔑 OpenAI API Key Setup

1. Get a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Enter it in the app's API key field (top bar or sidebar)
3. The key is stored **in memory only** — it disappears when you close the tab

**Cost estimate:** Analysing + optimising one resume costs approximately **$0.01–0.05** with GPT-4o-mini.

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| PDF Parse | pdfjs-dist |
| DOCX Parse | mammoth |
| PDF Export | jsPDF |
| DOCX Export | docx (`Packer.toBlob` — browser-compatible) |
| AI | OpenAI GPT-4o-mini (user-supplied key) |
| Container | Docker + nginx (multi-stage) |

## 📁 Project Structure

```
├── Dockerfile              # Multi-stage: dev / builder / prod-nginx
├── docker-compose.yml      # dev (5173) and prod (8080) services
├── Makefile                # Convenience targets for local + Docker workflows
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages auto-deploy
└── src/
    ├── components/
    │   ├── ui/                    # Button, Card, Badge, Progress
    │   ├── ApiKeySetup.tsx        # OpenAI key entry (memory-only)
    │   ├── ResumeUpload.tsx       # File upload + paste
    │   ├── AtsView.tsx            # "What the ATS sees" + detected profile card
    │   ├── JobDescriptionInput.tsx # Job posting input (cross-referenced with resume)
    │   ├── KeywordAnalysis.tsx    # Keyword gap visualisation
    │   ├── AtsScore.tsx           # Score dashboard with 5-dimension breakdown
    │   ├── ResumeOptimizer.tsx    # AI / local optimizer
    │   ├── DiffViewer.tsx         # Before/after comparison + inline exports
    │   ├── ExportOptions.tsx      # PDF/DOCX/TXT/MD export with AI-enhanced mode
    │   └── CoverLetterGenerator.tsx
    └── lib/
        ├── documentParser.ts      # PDF / DOCX / TXT extraction + ATS view
        ├── atsAnalyzer.ts         # Rule-based ATS scoring (weighted, 5 dimensions)
        ├── keywordMatcher.ts      # Keyword gap analysis
        ├── resumeTypeDetector.ts  # 7-profile detection + dynamic section ordering
        ├── openaiService.ts       # OpenAI integration (ATS best-practice prompts)
        ├── openaiExport.ts        # AI-enhanced export formatting
        ├── exportService.ts       # PDF / DOCX / TXT / MD generation
        └── utils.ts               # cn(), downloadBlob(), helpers
```

## 🔮 Roadmap

- [ ] Multiple AI providers (Anthropic Claude, Google Gemini, Ollama/local)
- [ ] Resume version history (IndexedDB)
- [ ] LinkedIn profile optimizer
- [ ] Interview question predictor
- [ ] Salary range estimator
- [ ] Cloudflare Pages deploy button

## 📄 License

MIT — fork it, host it, use it freely.
