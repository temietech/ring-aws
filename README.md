# 🛡️ Perimeter Defense (Ring Defense)
### Next-Gen Real-Time Incident Response Powered by Amazon Ring & AWS Amplify

Built for the **Amazon Developer Hackathon**, **Perimeter Defense** connects physical **Amazon Ring** camera devices and localized threat detection with **AWS Amplify Gen 2**, **Amazon DynamoDB**, and **AWS AppSync** to turn standard passive security alerts into an instant, mission-critical incident dispatch battle station.

---

## 🛠 Testing & Evaluation (For Judges)

Because this project relies on physical Ring camera hardware, localized Express webhooks, and authenticated AWS AppSync cloud environments, full end-to-end testing requires our specific hardware setup.

To allow judges to evaluate the localized Incident Response Dashboard without needing a Ring camera:

1. Clone the repository and run `npm install` and `npm run dev`.
2. Open `http://localhost:5173`.
3. **Simulation Mode:** Press the `x` key on your keyboard to simulate a standardized Ring Webhook payload injection. This will trigger the real-time UI state, bypassing the need for an active AWS WebSocket connection.

---

## ☁️ Built with the Amazon & AWS Ecosystem

| Technology | Amazon / AWS Component | Role in Architecture |
|---|---|---|
| **Amazon Ring** | Video Doorbell & Security Grid | Physical edge device capturing intrusion motion & face covering events |
| **AWS Amplify Gen 2** | Code-First CDK / TypeScript Backend | Defines and provisions cloud resources with zero context switching (`amplify/`) |
| **AWS AppSync** | Managed GraphQL Subscriptions | Real-time WebSocket connection to push sub-second threat alerts directly to the browser |
| **Amazon DynamoDB** | Serverless NoSQL Database | Ultra-low latency ingestion store for active threat records (`RingAlert` model) |
| **AWS SDK for JavaScript v3** | `@aws-sdk/client-dynamodb` | High-efficiency modular client utilized in `webhook.js` for instant event writing |

---

## 🏗️ Architecture & Data Pipeline

```
┌────────────────────────┐
│   Amazon Ring Device   │  (Physical Camera / Edge Motion Detection)
└───────────┬────────────┘
            │ Webhook POST / HTTP Event
            ▼
┌────────────────────────┐
│  Express Ingestion API │  (`webhook.js` on port 3000)
│   (AWS SDK v3 Client)  │  Validates & maps intrusion payload
└───────────┬────────────┘
            │ PutItemCommand
            ▼
┌────────────────────────┐
│    Amazon DynamoDB     │  Stores `RingAlert` records with TTL & status
└───────────┬────────────┘
            │ AppSync Data Source
            ▼
┌────────────────────────┐
│      AWS AppSync       │  Managed GraphQL WebSocket Engine
│   (Amplify Gen 2 API)  │  Dispatches `onCreate` subscription events
└───────────┬────────────┘
            │ Real-time Subscription Stream
            ▼
┌────────────────────────┐
│    React Dashboard     │  (`src/App.tsx`)
│ (Tailwind CSS + Icons) │  Instantly triggers aggressive visual & audio alarm
└────────────────────────┘
```

---

## 🚀 Key Features

1. **Active Threat Elevation:**
   - Moves beyond standard push notifications by immediately converting the interface into an emergency command HUD with an aggressive pulsing red alarm, siren audio, and high-contrast intruder imagery.
2. **Instant Emergency Dispatch CTA:**
   - Direct integration via regional telephone protocols (`tel:${emergencyNumber}`) with dynamic routing for UK (`999`), US (`911`), EU (`112`), and Australia (`000`).
3. **Developer Simulation Mode:**
   - Built-in simulation trigger (`x` key or the on-screen "Simulate Threat" button) allowing hackathon evaluators to test UI state transitions without requiring physical perimeter hardware.

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
