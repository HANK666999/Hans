# Wealth Gap Explainer — deployable starter

This starter keeps the existing cute/warm UI and connects it to Gemini through a Vercel serverless API route.

## What works in this starter
- Real AI text explanations through Gemini API.
- Follow-up questions (each request is sent to the AI).
- CSV and TXT uploads (text is read in the browser and sent as text).
- PDF and image uploads (sent to Gemini as inline data; max 3 MB).
- Human-review checklist remains in the UI.
- API key stays on the server, not in the browser.

## What is not included yet
- No database, login, saved chat history, or automated source verification.
- Word/Excel files are not parsed directly. Copy relevant text/numbers or export to CSV/TXT.
- Free-tier quotas can change, and public visitors can use the API quota. Do not share the public URL widely until you add stronger abuse protection/rate limiting.
- Do not upload private or sensitive data. Check the provider's current data-use terms before using this for anything beyond a class demo.

## Deploy to Vercel (no paid hosting required for a personal/class demo)
1. Create a Gemini API key in Google AI Studio: https://aistudio.google.com/app/apikey
2. Create a GitHub repository and upload the contents of this folder (the files inside this ZIP, not the ZIP itself).
3. Sign in to https://vercel.com, import that GitHub repository, and deploy.
4. In Vercel, open Project Settings -> Environment Variables.
5. Add `GEMINI_API_KEY` with your secret API key. Add `GEMINI_MODEL` with `gemini-2.5-flash` (optional).
6. Redeploy the project so the environment variable is applied.
7. Open the Vercel-provided URL and test a text question, then a small CSV/TXT file.

## Local run (optional)
Vercel's local functions need the Vercel CLI. After installing Node.js, run:
- `npm install -g vercel`
- `vercel dev`
- create a local `.env` file from `.env.example` and add your own key
Never commit `.env` or publish your API key.

## Cost and safety
Vercel Hobby is free for eligible personal/non-commercial projects. Gemini API has a free tier for selected models, subject to limits and current terms. A free tier is not unlimited. Set usage monitoring in Google AI Studio and keep the key private. Do not configure a paid billing account unless you understand and accept possible charges.
