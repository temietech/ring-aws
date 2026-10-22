# Perimeter Defense (Ring Defense)

An automated home security and perimeter defense dashboard built with React, Vite, Tailwind CSS, Lucide icons, AWS Amplify Gen 2, and Express.

The system connects physical Ring camera hardware and localized AI/motion-detection triggers to an instant, real-time threat incident response interface.

---

## 🛠 Testing & Evaluation (For Judges)

Because this project relies on physical Ring camera hardware, localized Express webhooks, and authenticated AWS AppSync cloud environments, full end-to-end testing requires our specific hardware setup.

To allow judges to evaluate the localized Incident Response Dashboard without needing a Ring camera:

1. Clone the repository and run `npm install` and `npm run dev`.
2. Open `http://localhost:5173`.
3. **Simulation Mode:** Press the `x` key on your keyboard to simulate a standardized Ring Webhook payload injection. This will trigger the real-time UI state, bypassing the need for an active AWS WebSocket connection.

---

## 🚀 Architecture Overview

1. **Hardware & Motion Detection:**
   - Physical Ring camera triggers on motion or AI facial covering detection (balaclava/intruder).
2. **Localized Webhook & Ingestion (`webhook.js`):**
   - Express server listening on port `3000` receives motion/event payloads.
   - Formats the event into a standardized `RingAlert` item.
   - Writes directly to Amazon DynamoDB using `@aws-sdk/client-dynamodb`.
3. **Cloud Infrastructure (AWS Amplify Gen 2):**
   - AppSync GraphQL and DynamoDB data schema (`amplify/data/resource.ts`) defining the `RingAlert` model.
   - Real-time GraphQL subscription for active threat alerts with public API key authorization.
4. **Incident Response Dashboard (`src/App.tsx`):**
   - **Monitoring State:** Clean dark-mode surveillance UI (`bg-slate-900`) with live camera placeholder, system status badge, and chronological event logs.
   - **Active Threat State:** Instant UI transformation with flashing red alert (`bg-red-600`), intruder snapshot with high-contrast border, audible alarm siren, emergency call dispatch CTA mapped to regional emergency numbers (UK: 999, US: 911, EU: 112, AUS: 000), and false-alarm dismissal.

---

## 💻 Local Development

### 1. Start the React Frontend:
```bash
npm install
npm run dev
```
Navigate to [http://localhost:5173](http://localhost:5173).

### 2. Run the Express Webhook Server:
```bash
node webhook.js
```
The server will start listening on `http://localhost:3000`.

### 3. Expose Local Webhook (Optional):
```bash
npx localtunnel --port 3000
```
POST requests sent to `/ring` will log events to DynamoDB and trigger connected listeners.
