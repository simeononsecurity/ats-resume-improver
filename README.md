# ATS Resume Match — AI Career Intelligence

> Self-hostable ATS resume optimizer. All parsing & scoring runs in your browser — AI features optionally call OpenAI using your own key.

[![GitHub Stars](https://img.shields.io/github/stars/simeononsecurity/ats-resume-improver?style=flat)](https://github.com/simeononsecurity/ats-resume-improver/stargazers)
[![GitHub Actions](https://github.com/simeononsecurity/ats-resume-improver/actions/workflows/deploy.yml/badge.svg)](https://github.com/simeononsecurity/ats-resume-improver/actions)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Tech](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-indigo)](https://github.com/simeononsecurity/ats-resume-improver)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](https://github.com/simeononsecurity/ats-resume-improver/blob/main/Dockerfile)

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
| Resume Structuring | ✅ (local parser) | ✅ (GPT-4.1 / GPT-4o / more) |
| Deterministic ATS Optimization | ✅ | ✅ |
| AI Resume Optimization | ❌ | ✅ (your choice of model) |
| Job Description Parsing | ✅ (rule-based) | ✅ (AI cross-referenced) |
| Before/After Diff Viewer | ✅ | ✅ |
| Export PDF / DOCX / TXT / MD | ✅ (professional templates) | ✅ (**AI-Enhanced** export) |
| Cover Letter Generation | ❌ | ✅ |
| **Model Selector** (6 OpenAI models) | — | ✅ |

## 🔒 Privacy

- **Without an API key**: everything runs 100% in your browser — no data ever leaves your device
- **With an API key**: your resume and job description are sent **directly to OpenAI** using your own key — no intermediate server
- API key is stored **in memory only** — it never touches disk and disappears when you close the tab
- No analytics, no tracking, no cookies either way

## 🧠 Resume Type Detection

The app automatically detects which of **7 resume profiles** best fits your resume and adapts section order accordingly:

| Profile | Best For | Section Priority |
|---|---|---|
| 🏢 Experienced Professional | 5+ years, linear career | Experience → Skills → Education |
| 🌱 Mid-Level | 2–5 years | Experience → Skills → Education |
| 🎓 Entry-Level | 0–2 years | Skills → Education → Projects → Experience |
| 🎒 Student / New Grad | Still enrolled | Education → Projects → Skills → Experience |
| 🔬 Academic / Researcher | PhD, publications | Education → Research → Publications → Experience |
| 📜 Certification-Heavy | Certs outweigh degrees | Certifications → Skills → Experience → Education |
| 🔄 Career Changer | Gap or pivot detected | Summary → Transferable Skills → Education → Experience |

Section ordering applies consistently across optimization, PDF, DOCX, TXT, and Markdown exports.

## 🤖 AI Model Selection

When an OpenAI API key is provided, choose from 6 models in the API key panel:

| Model | Best For |
|---|---|
| **GPT-4.1 mini** *(default)* | Smartest fast & affordable — recommended |
| GPT-4o mini | Fast & affordable classic |
| GPT-4.1 | Latest GPT-4.1 — sharp instruction following |
| GPT-4o | High quality flagship |
| GPT-4 Turbo | Large context window |
| GPT-3.5 Turbo | Fastest & cheapest |

Every AI call injects ATS best-practice prompts from Harvard OCS and Columbia CCE guidelines.

## 📤 Export Quality

| Format | Template |
|---|---|
| **PDF** | Professional typography, section rules, bullet points, contact header |
| **DOCX** | Properly structured Word document (`Packer.toBlob` — browser-compatible) |
| **TXT** | Clean plain-text with consistent spacing (ATS-safe) |
| **Markdown** | Structured `.md` with headings and bullet lists |

With an API key, exports are AI-formatted before download (✨ AI-Enhanced badge).

## 🚀 Self-Hosting

### Option 1: Vercel (Recommended, 1-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simeononsecurity/ats-resume-improver)

### Option 2: Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/simeononsecurity/ats-resume-improver)

### Option 3: GitHub Pages

1. Fork [simeononsecurity/ats-resume-improver](https://github.com/simeononsecurity/ats-resume-improver)
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. Push — it deploys automatically via the included workflow

### Option 4: Local Development (npm)

```bash
git clone https://github.com/simeononsecurity/ats-resume-improver
cd ats-resume-improver

make install
make dev           # http://localhost:5173

# Or without Make
npm install && npm run dev
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

### Option 6: Static File Server

```bash
make build
npx serve dist
```

## 🐳 Docker

Multi-stage Dockerfile with dev and prod targets:

```
Dockerfile
├── dev    — Node 20 Alpine + Vite dev server (hot-reload, port 5173)
├── builder — Node 20 Alpine + npm run build
└── prod   — nginx 1.26 Alpine serving ./dist (port 80/8080)
```

| Service | Target | Host port | Description |
|---|---|---|---|
| `dev` | `dev` | 5173 | Hot-reload dev server, source-mounted |
| `prod` | `prod` | 8080 | Optimised nginx static build |

The dev service mounts the project root for instant hot-reload:

```yaml
volumes:
  - .:/app
  - /app/node_modules
```

## 🛠 Makefile Reference

```
make help

  install                Install npm dependencies
  dev                    Start local dev server (http://localhost:5173)
  build                  Build production bundle into ./dist
  preview                Build + preview (http://localhost:4173)
  clean                  Remove build artefacts and node_modules

  docker-dev             Build & start dev container (http://localhost:5173)
  docker-dev-detach      Background dev container
  docker-dev-down        Stop dev container
  docker-prod            Build & start prod nginx (http://localhost:8080)
  docker-prod-detach     Background prod container
  docker-prod-down       Stop prod container

  docker-build           Build both images without starting
  docker-clean           Remove all project Docker images and volumes
  logs                   Tail logs from running containers
```

## 🔑 OpenAI API Key Setup

1. Get a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Enter it in the API key panel (sidebar on desktop, upload page on mobile)
3. Select your preferred model from the dropdown
4. The key is stored **in memory only** — gone when you close the tab

**Cost estimate:** Analysing + optimising one resume costs approximately **$0.002–0.05** depending on model.

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
| DOCX Export | docx (`Packer.toBlob`) |
| AI | OpenAI (user-supplied key, 6 model choices) |
| Container | Docker + nginx (multi-stage) |

## 📁 Project Structure

```
ats-resume-improver/
├── Dockerfile              # Multi-stage: dev / builder / prod-nginx
├── docker-compose.yml      # dev (5173) and prod (8080) services
├── Makefile                # 14 convenience targets
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages auto-deploy
└── src/
    ├── components/
    │   ├── ui/                    # Button, Card, Badge, Progress
    │   ├── ApiKeySetup.tsx        # API key + model selector
    │   ├── ResumeUpload.tsx       # File upload + paste
    │   ├── AtsView.tsx            # "What the ATS sees" + profile card
    │   ├── JobDescriptionInput.tsx # Job posting (cross-referenced with resume)
    │   ├── KeywordAnalysis.tsx    # Keyword gap visualisation
    │   ├── AtsScore.tsx           # Score + 5-dimension breakdown
    │   ├── ResumeOptimizer.tsx    # AI / local optimizer
    │   ├── DiffViewer.tsx         # Before/after + inline exports
    │   ├── ExportOptions.tsx      # PDF/DOCX/TXT/MD with AI-enhanced mode
    │   └── CoverLetterGenerator.tsx
    └── lib/
        ├── documentParser.ts      # PDF / DOCX / TXT extraction
        ├── atsAnalyzer.ts         # Rule-based ATS scoring
        ├── keywordMatcher.ts      # Keyword gap analysis
        ├── resumeTypeDetector.ts  # 7-profile detection + section ordering
        ├── openaiService.ts       # OpenAI (6 models, ATS best-practice prompts)
        ├── openaiExport.ts        # AI-enhanced export formatting
        ├── exportService.ts       # PDF / DOCX / TXT / MD generation
        └── utils.ts
```

## 🔮 Roadmap

- [ ] Additional AI providers (Anthropic Claude, Google Gemini, Ollama/local)
- [ ] Resume version history (IndexedDB)
- [ ] LinkedIn profile optimizer
- [ ] Interview question predictor
- [ ] Salary range estimator
- [ ] Cloudflare Pages deploy button

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first. See the [GitHub repo](https://github.com/simeononsecurity/ats-resume-improver) for the latest.

## 📄 License

MIT — fork it, host it, use it freely.
