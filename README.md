# ATS Resume Match — AI Career Intelligence

> Self-hostable ATS resume optimizer. Parsing & scoring runs entirely in your browser. AI features support **OpenAI**, **Anthropic Claude**, and **Ollama (local)** — bring your own key or run fully offline.

[![GitHub Stars](https://img.shields.io/github/stars/simeononsecurity/ats-resume-improver?style=flat)](https://github.com/simeononsecurity/ats-resume-improver/stargazers)
[![GitHub Actions](https://github.com/simeononsecurity/ats-resume-improver/actions/workflows/deploy.yml/badge.svg)](https://github.com/simeononsecurity/ats-resume-improver/actions)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Tech](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20TypeScript-indigo)](https://github.com/simeononsecurity/ats-resume-improver)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED?logo=docker&logoColor=white)](https://github.com/simeononsecurity/ats-resume-improver/blob/main/Dockerfile)

## ✨ Features

| Feature | No AI Key | Cloud AI (OpenAI / Anthropic) | Local AI (Ollama) |
|---|---|---|---|
| Resume Upload (PDF, DOCX, TXT, MD) | ✅ | ✅ | ✅ |
| ATS Text Extraction & "What the ATS Sees" View | ✅ | ✅ | ✅ |
| **Resume Type Detection** (7 profiles) | ✅ | ✅ | ✅ |
| **Dynamic Section Ordering** (profile-aware) | ✅ | ✅ | ✅ |
| Section Detection & Formatting Warnings | ✅ | ✅ | ✅ |
| ATS Score (0–100) with 5-dimension breakdown | ✅ | ✅ | ✅ |
| Keyword Gap Analysis | ✅ rule-based | ✅ **AI semantic** | ✅ **AI semantic** |
| Resume Structuring | ✅ local parser | ✅ AI-powered | ✅ AI-powered |
| Deterministic ATS Optimization | ✅ | ✅ | ✅ |
| AI Resume Optimization | ❌ | ✅ | ✅ |
| Job Description Parsing | ✅ rule-based | ✅ AI cross-referenced | ✅ AI cross-referenced |
| Before/After Diff Viewer | ✅ | ✅ | ✅ |
| Export PDF / DOCX / TXT / MD | ✅ professional templates | ✅ **AI-Enhanced** | ✅ **AI-Enhanced** |
| Cover Letter Generation | ❌ | ✅ | ✅ |
| **Interview Question Predictor** | ❌ | ✅ | ✅ |
| **Salary Range Estimator** | ❌ | ✅ | ✅ |
| **Multi-provider model selector** | — | ✅ OpenAI + Claude | ✅ 8 Ollama models |

## 🔒 Privacy

| Mode | What leaves your device? |
|---|---|
| **No AI key** | Nothing — 100% local, runs in your browser |
| **OpenAI / Anthropic** | Resume text + job description are sent **directly** to the AI provider API using **your key** — no intermediate server |
| **Ollama (local)** | Nothing — model runs on your own machine (or Docker container) |

- API keys are stored **in memory only** — they disappear when you close the tab
- No analytics, no tracking, no cookies
- The footer accurately reflects which mode is active

## 🤖 AI Providers & Models

The API key panel lets you choose provider and model. All AI calls include ATS best-practice prompts from Harvard OCS and Columbia CCE guidelines.

### OpenAI

| Model | Best For |
|---|---|
| **GPT-4.1 mini** *(default)* | Smartest fast & affordable — recommended |
| GPT-4o mini | Fast & affordable classic |
| GPT-4.1 | Latest GPT-4.1 — sharp instruction following |
| GPT-4o | High quality flagship |
| GPT-4 Turbo | Large context window |
| GPT-3.5 Turbo | Fastest & cheapest |

**Cost estimate:** ~$0.002–0.05 per resume

### Anthropic Claude

| Model | Best For |
|---|---|
| **Claude Sonnet 4.5** *(default)* | Fast & intelligent — recommended |
| Claude Opus 4.5 | Most capable — best for complex tasks |
| Claude Haiku 4.5 | Fastest & cheapest |
| Claude 3.5 Sonnet | Reliable and well-tested |
| Claude 3.5 Haiku | Fast and affordable v3.5 |

### Ollama (Local / Self-hosted)

No API key required. Set `OLLAMA_ORIGINS=*` to allow browser access.

| Model | Notes |
|---|---|
| **Llama 3.3** *(default)* | Latest Meta Llama — recommended |
| Llama 3.2 | Meta Llama 3.2 |
| Mistral 7B | Fast & capable |
| Mixtral 8x7B | Mixture of experts |
| Qwen 2.5 | Alibaba Qwen 2.5 |
| DeepSeek R1 | Strong reasoning |
| Phi-4 | Microsoft Phi-4 |
| Gemma 3 | Google Gemma 3 |

## 🧠 AI-Powered Keyword Analysis

When an AI provider is configured, the keyword gap analysis upgrades from simple string matching to **semantic analysis**:

| | Without AI | With AI |
|---|---|---|
| Matching method | Exact string match only | Semantic understanding of context |
| Match strength | — | Strong / Moderate / Partial ratings |
| Match context | — | Notes like *"found in Skills and 3 job roles"* |
| Gap importance | All gaps treated equal | Critical / High / Medium / Low ratings |
| Suggestions | Generic tips | Per-keyword actionable suggestions |
| Coverage % | String-count based | Semantically weighted |
| Summary | — | 2-3 sentence AI narrative |

Local analysis still runs **instantly** — AI results enrich it asynchronously while you review.

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

## 📤 Export Quality

| Format | Template |
|---|---|
| **PDF** | Professional typography, section rules, bullet points, contact header |
| **DOCX** | Properly structured Word document (`Packer.toBlob` — browser-compatible) |
| **TXT** | Clean plain-text with consistent spacing (ATS-safe) |
| **Markdown** | Structured `.md` with headings and bullet lists |

With an AI provider configured, exports are AI-formatted before download (✨ AI-Enhanced badge).

## 🚀 Self-Hosting

### Option 1: Vercel (Recommended, 1-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/simeononsecurity/ats-resume-improver)

### Option 2: Cloudflare Pages

[![Deploy to Cloudflare Pages](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/simeononsecurity/ats-resume-improver)

### Option 3: Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/simeononsecurity/ats-resume-improver)

### Option 4: GitHub Pages

1. Fork [simeononsecurity/ats-resume-improver](https://github.com/simeononsecurity/ats-resume-improver)
2. Go to **Settings → Pages**
3. Set source to **GitHub Actions**
4. Push — it deploys automatically via the included workflow

### Option 5: Local Development (npm)

```bash
git clone https://github.com/simeononsecurity/ats-resume-improver
cd ats-resume-improver

make install
make dev           # http://localhost:5173

# Or without Make
npm install && npm run dev
```

### Option 6: Docker (Recommended for reproducible environments)

```bash
# Development — hot-reload on http://localhost:5173
make docker-dev

# Production — nginx on http://localhost:8080
make docker-prod

# Dev + Ollama together (full local AI stack)
make docker-dev-with-ollama

# Or with docker compose directly
docker compose up --build dev
docker compose up --build prod
```

### Option 7: Static File Server

```bash
make build
npx serve dist
```

## 🦙 Ollama — Local AI

Run a fully local AI stack — no API keys, no data leaving your machine.

```bash
# Start Ollama container (persists models across restarts)
make ollama

# Pull a model
make ollama-pull MODEL=llama3.2

# Start dev app + Ollama side-by-side
make docker-dev-with-ollama
```

Then open the app, go to the API key panel, select **Ollama (Local)**, set URL to `http://localhost:11434`, and pick a model.

> **Note:** The `ollama` service in `docker-compose.yml` includes an optional NVIDIA GPU `deploy` block. Remove it if you don't have an NVIDIA GPU — CPU-only works fine for smaller models.

## 🐳 Docker

Multi-stage Dockerfile with dev and prod targets, plus a dedicated Ollama service:

```
Dockerfile
├── dev    — Node 20 Alpine + Vite dev server (hot-reload, port 5173)
├── builder — Node 20 Alpine + npm run build
└── prod   — nginx 1.26 Alpine serving ./dist (port 80/8080)
```

| Service | Target / Image | Host port | Description |
|---|---|---|---|
| `dev` | `dev` | 5173 | Hot-reload dev server, source-mounted |
| `prod` | `prod` | 8080 | Optimised nginx static build |
| `ollama` | `ollama/ollama:latest` | 11434 | Local LLM server (`OLLAMA_ORIGINS=*`) |

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
  docker-dev-with-ollama Dev container + Ollama side-by-side

  ollama                 Start Ollama container (http://localhost:11434)
  ollama-down            Stop Ollama (data volume preserved)
  ollama-pull            Pull a model  (make ollama-pull MODEL=llama3.2)

  docker-build           Build both images without starting
  docker-clean           Remove all project Docker images and volumes
  logs                   Tail logs from running containers
```

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
| AI | OpenAI · Anthropic Claude · Ollama (user-supplied key or local) |
| Container | Docker + nginx (multi-stage) + Ollama service |

## 📁 Project Structure

```
ats-resume-improver/
├── Dockerfile              # Multi-stage: dev / builder / prod-nginx
├── docker-compose.yml      # dev (5173), prod (8080), ollama (11434)
├── Makefile                # 18 convenience targets
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages auto-deploy
└── src/
    ├── components/
    │   ├── ui/                    # Button, Card, Badge, Progress
    │   ├── ApiKeySetup.tsx        # Multi-provider: OpenAI / Anthropic / Ollama
    │   ├── ResumeUpload.tsx       # File upload + paste
    │   ├── AtsView.tsx            # "What the ATS sees" + profile card
    │   ├── JobDescriptionInput.tsx # Job posting (AI cross-referenced)
    │   ├── KeywordAnalysis.tsx    # AI semantic keyword gap visualisation
    │   ├── AtsScore.tsx           # Score + 5-dimension breakdown
    │   ├── ResumeOptimizer.tsx    # AI / local optimizer
    │   ├── DiffViewer.tsx         # Before/after + inline exports
    │   ├── ExportOptions.tsx      # PDF/DOCX/TXT/MD with AI-enhanced mode
    │   └── CoverLetterGenerator.tsx
    └── lib/
        ├── documentParser.ts      # PDF / DOCX / TXT extraction
        ├── atsAnalyzer.ts         # Rule-based ATS scoring
        ├── keywordMatcher.ts      # Local + AI semantic keyword analysis
        ├── resumeTypeDetector.ts  # 7-profile detection + section ordering
        ├── aiProvider.ts          # Unified OpenAI / Anthropic / Ollama caller
        ├── openaiService.ts       # Resume parse + optimize prompts
        ├── openaiExport.ts        # AI-enhanced export formatting
        ├── exportService.ts       # PDF / DOCX / TXT / MD generation
        └── utils.ts
```

## 🔮 Roadmap

- [x] Additional AI providers (Anthropic Claude, Ollama/local)
- [x] AI-powered semantic keyword analysis with importance ratings
- [x] Interview Question Predictor
- [x] Salary Range Estimator
- [x] Cloudflare Pages deploy button
- [ ] Resume version history (IndexedDB)
- [ ] LinkedIn profile optimizer
- [ ] Google Gemini provider support

## 🤝 Contributing

Pull requests are welcome. For major changes, open an issue first. See the [GitHub repo](https://github.com/simeononsecurity/ats-resume-improver) for the latest.

## 📄 License

MIT — fork it, host it, use it freely.
