# StudyWise

StudyWise is a study planner that does the annoying part for you: hand it a PDF syllabus, and it reads through the chapters, weeks, and modules, then turns them into a clean, checkable topic list for your course. No more manually retyping "Week 4: Thermodynamics" into a to-do app.

Upload a syllabus, review what got extracted, uncheck anything that isn't actually a topic (looking at you, "Office Hours: Tue/Thu"), and you've got a study plan ready to go.

## How it works

1. You drag a PDF into a course.
2. The backend pulls the raw text out of it.
3. That text gets sent to Gemini with a prompt asking it to extract topics, estimated hours, and an order.
4. If Gemini is unavailable, rate-limited, or just doesn't cooperate, a local regex-based parser kicks in as a fallback — it looks for lines matching patterns like `Week 3:`, `Chapter 5`, `Unit II`, etc., and filters out administrative noise (grading policies, office hours, instructor emails).
5. You get a review screen with checkboxes so you can approve exactly what gets added, then it's saved as topics on your course.

The Gemini call and the local fallback are deliberately separate so a flaky API key, an expired quota, or a network hiccup never means the feature just stops working — it degrades instead of breaking.

## Stack

**Frontend**
- Angular (standalone components, signals for state)
- Vite as the build tool
- Tailwind for styling

**Backend**
- ASP.NET Core Web API (C#)
- ASP.NET Core Identity for auth (cookie-based)
- iText for PDF text extraction
- Google Gemini API for syllabus parsing, with a local fallback parser

## Project structure

```
studywise/
├── frontend/                  # Angular app
│   └── src/app/
│       ├── services/
│       │   └── studywise-api.ts       # HTTP layer talking to the backend
│       └── pages/
│           └── syllabus-upload.ts     # Drag-and-drop upload + review UI
└── backend/
    ├── StudyWise.API/
    │   └── Controllers/
    │       └── SyllabusController.cs  # Upload endpoint, validation, orchestration
    └── StudyWise.Infrastructure/
        └── Parsing/
            ├── GeminiSyllabusParser.cs  # Calls Gemini, falls back to regex parsing
            └── PdfTextExtractor.cs      # Pulls raw text out of the uploaded PDF
```

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) (18+) and npm
- [.NET SDK](https://dotnet.microsoft.com/download) (8.0+)
- A [Gemini API key](https://aistudio.google.com/app/apikey) from Google AI Studio

### Backend

```bash
cd backend/StudyWise.API
```

Add your Gemini credentials to `appsettings.Development.json` (or user secrets — recommended so the key doesn't end up in git):

```bash
dotnet user-secrets set "Gemini:ApiKey" "your-api-key-here"
dotnet user-secrets set "Gemini:Model" "gemini-2.5-flash"
```

Then run it:

```bash
dotnet run
```

The API comes up on `http://localhost:5098` by default.

### Frontend

```bash
cd frontend
npm install
npm start
```

The app runs on `http://localhost:4200` and expects the backend to be reachable at `http://localhost:5098` (see `API_BASE_URL` in `studywise-api.ts` if you need to point it elsewhere).

### A couple of things worth knowing

- Uploads are capped at 10MB and PDF-only — both the frontend and backend check this, so you get a fast client-side rejection and a safe server-side one.
- The Gemini free tier has fairly tight rate limits (requests per minute *and* per day, depending on the model). If you're testing a lot, you'll see 429s — the local parser will quietly take over when that happens, so parsing still works, just with less finesse than the LLM.
- Auth is cookie-based via ASP.NET Identity, so the syllabus endpoint expects a logged-in session — there's no separate API token to juggle for local development.

## Roadmap ideas

- Smarter estimated-hours logic (right now both the LLM and fallback parser default to fairly simple heuristics)
- Support for non-PDF syllabus formats (Word docs, plain text, maybe even a pasted-in block of text)
- Editable topic titles in the review screen before confirming, instead of just include/exclude