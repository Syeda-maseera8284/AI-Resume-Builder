# ResumeLM - AI Resume Builder 🚀

ResumeLM is a modern, AI-powered application designed to help users manage their career profiles, generate ATS-optimized resumes, and meticulously tailor their applications to specific job listings.

## 🛠️ Technology Stack

### Core Framework & Frontend
*   **Next.js 15 (App Router)**: Core React framework for server/client components and API routes.
*   **React 19**: Frontend UI library utilizing concurrent features.
*   **TypeScript**: Strictly typed JavaScript for end-to-end type safety.
*   **Tailwind CSS & Shadcn UI**: Utility-first styling with accessible, reusable UI components.
*   **Zod**: Schema declaration and strict validation (crucial for AI structured outputs).

### Backend & Database
*   **Supabase (PostgreSQL)**: Primary database. Utilizes Row Level Security (RLS) to ensure user data isolation.
*   **Supabase Auth**: Handles user authentication (Email/Password & Google OAuth).
*   **Stripe**: Payment processing and subscription management (Free vs. Pro tiers).

### PDF Processing & Rendering
*   **@react-pdf/renderer**: Used to declaratively construct PDF documents using React components.
*   **react-pdf (pdfjs-dist)**: Renders the generated PDF visually inside the browser for real-time previews.
*   **pdf-parse (Node.js)**: Server-side text extraction from uploaded PDF files.

### AI Integration
*   **Vercel AI SDK (`ai`)**: Framework for orchestrating AI models, tool calling, and streaming.
*   **OpenAI / OpenRouter API**: Primary LLM providers. Heavily relies on **Structured Outputs** (JSON schema enforcement) to guarantee perfectly mapped data.
*   **PostHog**: Telemetry and analytics, heavily tied to the custom `ai_usage_events` tracking system.

---

## 🗺️ Application Flow & Features

### 1. User Authentication & Onboarding
*   **Flow**: Users sign up via Email or Google. Upon account creation, Supabase inserts a new user record.
*   **Subscription Check**: The system queries the `subscriptions` table. Free users have limits on AI usage, while Pro users have access to advanced models (e.g., `gpt-5.4-nano`) and higher limits.

### 2. The Master Profile (`/profile`)
*   **Concept**: A central hub containing the user's entire career history—every job, project, and skill they've ever had.
*   **AI Integration**: Users can upload an existing PDF resume.
    *   *How it works*: The PDF is uploaded to `/api/parse-pdf` -> Raw text is sent to the AI (`formatProfileWithAI`) -> The AI uses a strict Zod schema to categorize the text into `WorkExperience`, `Education`, and `Skills` -> The data is merged into the user's Supabase `profiles` row.

### 3. Job Board & Tracking (`/jobs`)
*   **Concept**: A place to store job postings the user wants to apply for.
*   **AI Integration**: Users paste a raw Job Description. 
    *   *How it works*: The AI (`formatJobListing`) analyzes the text, extracts the company name, salary, location, and crucially, an array of **Keywords** and **Technical Skills**. This structured data is saved to the `jobs` table.

### 4. Base Resumes (`/resumes`)
*   **Concept**: A "Base Resume" is a generic resume template tailored to a *type* of role (e.g., "Frontend Developer" vs. "Backend Developer").
*   **Creation Flow**:
    *   Users can build it manually by picking items from their Master Profile.
    *   **AI Integration**: Users can drop a PDF. The AI (`convertTextToResume`) reads the PDF and structures it strictly into the resume schema.

### 5. AI Tailoring (The Core Engine)
*   **Concept**: Generating a brand new, highly targeted resume for a specific job application.
*   **Flow**: The user selects a Base Resume and a Job Listing.
*   **AI Integration**: The `tailorResumeToJob` action is triggered.
    *   The AI is fed the base resume and the job's extracted keywords.
    *   It rewrites bullet points, adopting the vocabulary of the job description without inventing fake experience.
    *   It reorders skills and experiences to put the most relevant information at the very top.
    *   A new, non-destructive row is created in the `resumes` table linked to the `job_id`.

### 6. The Resume Editor & PDF Preview
*   **Concept**: The main workbench where users refine their resumes before downloading.
*   **Tech Flow**: The left side contains editable forms (synced to Supabase). As the user types, the right side uses `@react-pdf/renderer` to generate a blob and `react-pdf` to display a live, pixel-perfect preview.
*   **AI Integration (The Chatbot)**:
    *   An embedded assistant with access to **Server-Side Tools**.
    *   If a user asks *"Make my second work experience sound more impactful"*, the LLM invokes the `suggest_work_experience_improvement` tool. 
    *   The AI returns a deeply modified JSON object replacing that specific index in the resume array.

### 7. Resume Scoring & ATS Compatibility
*   **Concept**: Providing feedback on how well the resume matches the job.
*   **AI Integration**: The AI takes the final resume and the job description and generates a `ResumeScoreMetrics` object. It grades Action Verbs, Quantified Achievements, and Keyword Matches out of 100, providing human-readable suggestions on what to fix.

---

## 🧠 How the AI Architecture Works (Under the Hood)

1.  **Strict Schemas**: Every AI call uses `generateObject` with Zod schemas. We ensure `.nullable()` is explicitly defined on optional fields so OpenAI's strict Structured Outputs validation does not fail.
2.  **Usage Ledger**: Every time an AI request is made, `startAIUsageRequest` creates a row in the `ai_usage_events` table marking it as "started". 
3.  **Token Counting**: When the AI responds, `finishAIUsageRequest` updates the row with the `input_tokens`, `output_tokens`, and marks it "succeeded". This allows the admin to track AI costs per user.
4.  **Fallback Mechanism**: The `runTrackedAIRequest` orchestrates models. If a primary model (like `gpt-5.4-nano`) fails or is rate-limited, it iterates through an array of fallback models (like `gpt-5.4-mini`) seamlessly.
