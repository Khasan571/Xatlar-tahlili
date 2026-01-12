<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tB1hMyrU5wFq0dV_OQaeu_ighPkUzny3

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set env vars in `.env.local`:
   - `GEMINI_API_KEY=<ваш ключ Gemini>`
   - `PG_CONNECTION_STRING=postgres://user:password@host:port/dbname`
3. Run the app (клиент + API сервер):
   `npm run dev`

The API server listens on port 4000 by default (`VITE_API_BASE_URL` can override).
