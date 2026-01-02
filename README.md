# 🎙️ Articlar — AI IELTS Speaking Practice Platform

Articlar is a web-based IELTS Speaking practice platform designed to simulate real exam conditions and provide structured speaking practice using AI.

🔗 **Live Demo:** https://articlar.netlify.app/

---

## 🚀 Features

- **Full IELTS Speaking Mock Test**  
  Simulates Parts 1, 2, and 3 in a timed, exam-like format.

- **Topic-based Practice**  
  Allows users to practice specific IELTS speaking topics with targeted prompts.

- **Part-specific Training**  
  Enables focused practice for Part 1, Part 2, or Part 3 to improve weaker areas.

---

## 🧠 AI Design & Constraints

Articlar uses **Gemini 2.5 Flash** via Google AI Studio to generate examiner-style prompts and feedback.

The system was intentionally developed under **free-tier model and compute constraints**, reflecting real-world limitations often faced by early-stage projects.

Key design considerations:
- Structured prompt design to reduce hallucinations
- Short, focused responses to improve consistency
- Basic fallback handling for unstable or incomplete outputs

---

## ⚠️ Limitations

- Occasional instability due to free-tier model constraints
- Feedback quality may vary depending on topic complexity
- No pronunciation scoring or audio analysis (text-based only)

These limitations are documented intentionally and serve as areas for future improvement.

---

## 🛣️ Roadmap

- Rubric-based feedback aligned with IELTS band descriptors
- Improved response stability through prompt iteration
- Hybrid rule-based + AI feedback for consistency
- Session summaries and learner progress tracking

---

## 🎯 Motivation

IELTS Speaking preparation is often expensive and inaccessible.  
Articlar explores how **AI-assisted tools** can support speaking practice under realistic exam conditions while operating with minimal computational resources.

---

## 🧪 Status

This project is a functional prototype intended for learning, experimentation, and iteration.
