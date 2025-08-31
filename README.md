# AI Coaching Interface

## Problem statement
AI-powered sales coaching interface that provides real-time feedback and performance analysis for sales professionals practicing their pitches.

## Users & context
Sales professionals looking to improve their pitching skills through AI-powered feedback and coaching in a simulated environment.

## Solution overview
An interactive web application that allows users to practice sales pitches with an AI coach, receive real-time feedback, and get detailed performance analysis through scorecards and summaries.

## Setup & run (steps)
1. Clone the repository
2. Run `npm i` to install the dependencies
3. Create a `.env.local` file based on `.env.example`
4. Run `npm run dev` to start the development server
5. Access the application at http://localhost:3000

## Models & data (sources, licenses)
The application uses various AI models for speech recognition, natural language processing, and performance analysis. Data sources include LinkedIn data API provided by 1Page. All data is processed securely and not stored beyond the session unless explicitly saved by the user.

## Evaluation & guardrails (hallucination/bias mitigations)
The system includes guardrails to prevent biased feedback and maintains transparency about AI limitations. Performance metrics are based on industry-standard sales techniques and communication best practices.

## Known limitations & risks
- Requires a stable internet connection for real-time analysis
- Speech recognition may have accuracy limitations in noisy environments
- System latency is high and could be optimized for better performance

## Team (names, roles, contacts)
- **Pooran Prasad Rajanna** - Designed the workflow and the frontend, research and development
  - Contact: [LinkedIn](https://www.linkedin.com/in/pooran/), [pooran@oayaw.com](mailto:pooran@oayaw.com)

- **Riya Singh** - Worked on backend APIs, AI RAG search, and summary/score generation
  - Contact: [LinkedIn](https://www.linkedin.com/in/riya-singh-lkdn/), [riya@oayaw.com](mailto:riya@oayaw.com)