# BA Agentic Automation Suitability Assistant

An **Agentic decision-support web application** designed to help **Business Analysts** assess automation suitability, recommend the right automation tools, estimate effort, and identify required skills for a given business process.

The solution uses a **serverless architecture on Vercel**, combining a static frontend with an AI-powered backend agent.

---

## 🚀 Features

- Capture business process details via an interactive UI
- (Optional) Upload AS-IS documents (PDF, DOCX, Images)
- Extract and normalize document content
- Agentic reasoning using an LLM (OpenAI)
- Recommendations for:
  - Primary & secondary automation tools
  - Estimated delivery timeline
  - Required skills
  - Justification / reasoning
- Fully serverless and cloud-native (Vercel)

---

## 🏗️ Architecture Overview

- **Frontend**: Static HTML, CSS, JavaScript  
- **Backend**: Vercel Serverless Functions  
- **AI Layer**: OpenAI Chat Completions API  
- **Hosting**: Vercel  