# FreshRoute: Team Handover & AI Agent Developer Guide

Welcome Faraz, Ilyan, and Ammar! This document outlines our shared repository structure, database connection, and provides comprehensive instructions and copy-pasteable prompts for your respective AI coding agents to build your modules automatically.

---

## 1. Repository Setup & Shared Infrastructure

Mustafa has initialized the monorepo:
* **`backend/`**: Built using **NestJS** and **Prisma ORM**.
  * Auth (JWT login/register) is implemented and guarded.
  * Shared AI Proxy (`AiService`) is set up using the **Grok AI API** (`llama-3.3-70b-versatile`).
* **`frontend/`**: Built using **React + Vite + TypeScript**.
  * Configured with a responsive **glassmorphic dark-mode design system** in `src/index.css`.
  * Contextual session management is ready (`AuthContext.tsx`).
  * Axios client is configured to intercept and attach authorization tokens automatically.
* **Database (Supabase Cloud)**: 
  * The database is fully hosted in the cloud via **Supabase (Tokyo region)**. 
  * **You do not need to install or run PostgreSQL locally!** The `.env` file in the repository contains the live connection pooler string so you can connect directly.

---

## 2. Instructions for Your AI Coding Agent

If you are using an AI coding assistant (like Gemini, Claude, Cursor, or ChatGPT), copy your specific section below and paste it into your AI assistant. 

### Global AI Agent Rules:
1. **Pre-flight Dependency Check**: Before writing code, inspect the developer's system. If `node` or `npm` are missing, guide them to install them. If workspace dependencies (like `npm packages`) are missing, automatically run `npm install` in the respective folders (`backend/` or `frontend/`).
2. **No Local DB Setup**: Do not attempt to spin up Docker or install PostgreSQL. The connection string in `backend/.env` is already connected to our cloud database.
3. **Database Client Sync**: Run `npx prisma generate` inside the `backend/` folder to ensure the local type-safe client compiles correctly.
4. **Verifications**: Always verify that the backend compiles (`npm run build` in `backend`) and the frontend client builds (`npm run build` in `frontend`) without TypeScript errors before concluding.
5. **Git Push**: Once compilation is verified, automatically help the developer stage, commit, and push their changes to the GitHub repository.

---

## 3. Team Member Modules & Prompts

---

### 🧑‍💻 Faraz: Order Management, WebSockets, & Demand Forecasting AI

#### Your Features:
1. **Order Checkout & Workflow**: Create shopping cart checkout. Check stock availability, deduct stock from `Product` table, create the `Order`, and create multiple `OrderItems`. Implement status updates: `PENDING` ➔ `CONFIRMED` ➔ `PACKED` ➔ `IN_TRANSIT` ➔ `DELIVERED` / `DISPUTED`.
2. **WebSockets (Real-Time)**: Set up a WebSocket Gateway in NestJS (`socket.io`). When an order is confirmed, broadcast a notification directly to the specific Farmer who listed the item.
3. **AI Demand Forecaster**: Create a NestJS service that compiles the past 8 weeks of sales and uses the Grok AI proxy to forecast next week's crop demand. If the Grok API is offline, gracefully degrade by calculating a rolling average of the last 4 weeks of sales as a fallback.

#### Copy & Paste Prompt for Faraz's AI Agent:
```text
You are an expert full-stack developer assisting Faraz with his module on the "FreshRoute" monorepo.
FreshRoute is an AI-powered Farm-to-Table Supply Chain Platform. 

Monorepo Structure:
1. `backend/`: NestJS + Prisma ORM (v6.4.0) + PostgreSQL.
2. `frontend/`: React + Vite + TypeScript (Vanilla CSS styling).

Step 1: Check if npm packages are installed in both folders. If not, run "npm install". Run "npx prisma generate" in the backend to sync client types. Do not install any local database - the connection URL in backend/.env points directly to our live Supabase cloud database.

Step 2: Implement the following features:
1. Order Management:
   - Create routes and services in backend/src/orders/ to place an order (check stock, subtract stock, save Order & OrderItems).
   - Create endpoints to update order status: PENDING -> CONFIRMED -> PACKED -> IN_TRANSIT -> DELIVERED / DISPUTED. Guard them so only allowed roles can trigger changes.
2. WebSockets & Real-Time Alerts:
   - Establish a NestJS WebSocket Gateway (using @nestjs/websockets and socket.io).
   - Group sockets into Rooms based on User ID or Role.
   - When an order transitions to "CONFIRMED", send a socket notification to the specific Farmer(s) owning the items in that order.
   - Add WebSocket listeners in the React frontend to show real-time alerts.
3. AI Demand Forecaster:
   - Extend the AI module (backend/src/ai/) to forecast next week's sales volume using Grok.
   - Input: Order history (last 8 weeks) per produce category.
   - AI Output: Predicted order volume for next week with confidence levels (JSON format).
   - Fallback: If the Grok API fails, calculate a rolling average of the last 4 weeks as the forecast, alongside a warning message.
4. Frontend Screens:
   - A Buyer marketplace shopping cart, order checkout flow, and order progress tracking view.
   - A forecast page on the Farmer's dashboard displaying next week's predicted demand.

Step 3: Verify the changes by running "npm run build" in both backend and frontend. Fix any TypeScript or CSS compilation errors.

Step 4: Once verified, stage all files, prompt Faraz to confirm, and run "git add .", "git commit -m 'feat: implement order management and demand forecasting AI'", and "git push" to push the code.
```

---

### 🧑‍💻 Ilyan: Delivery Scheduling, OpenMaps, Cron Jobs, & Route Optimizer AI

#### Your Features:
1. **Delivery Runs**: Endpoints for Admins to assign confirmed orders to Drivers and assemble delivery routes.
2. **Driver Stops UI**: A Map page for Drivers showing their assigned delivery addresses as markers, allowing them to click, see details, and mark them as delivered/failed.
3. **OpenMaps Integration**: Integrate open-source mapping (e.g. Leaflet) in React using OpenStreetMap.
4. **Cron Job Schedule**: Configure a cron job that runs daily at 6:00 AM to automatically compile a daily stop report summary and log it for each driver.
5. **AI Route Optimiser**: A chat assistant for Drivers. The driver inputs constraints in natural language (e.g. "Deliver to address A first, then address B"). The Grok AI re-orders the stop sequence for optimal travel. If offline, fallback to sorting by straight-line distance.

#### Copy & Paste Prompt for Ilyan's AI Agent:
```text
You are an expert full-stack developer assisting Ilyan with his module on the "FreshRoute" monorepo.
FreshRoute is an AI-powered Farm-to-Table Supply Chain Platform. 

Monorepo Structure:
1. `backend/`: NestJS + Prisma ORM (v6.4.0) + PostgreSQL.
2. `frontend/`: React + Vite + TypeScript (Vanilla CSS styling).

Step 1: Check if npm packages are installed in both folders. If not, run "npm install". Run "npx prisma generate" in the backend to sync client types. Do not install any local database - the connection URL in backend/.env points directly to our live Supabase cloud database.

Step 2: Implement the following features:
1. Delivery Scheduling:
   - Create endpoints in backend/src/delivery/ for admins to assign driverIds to confirmed orders.
   - Create endpoints for drivers to update stop statuses (DELIVERED, FAILED) and input delivery instructions.
2. Scheduled Cron Jobs:
   - Set up @nestjs/schedule in the backend.
   - Create a cron task running daily at 6:00 AM. It compiles driver stops for the day and logs a summary report.
3. Map-based Tracker UI:
   - Install leaflet and react-leaflet (or mapbox/openlayers) in the frontend.
   - Build a dashboard map screen for Drivers showing markers for all assigned delivery stops.
   - Build a map tracking component on the Buyer dashboard showing where their order is (geocoding addresses or using mock coordinates).
4. AI Route Optimiser Chat:
   - Create a text-based chat drawer on the Driver's map screen.
   - Driver inputs stop constraints (e.g. "Need to visit address C before noon").
   - Send constraints to Groq via backend AI Proxy to optimize stop order.
   - Action buttons: "Accept Reordering" (re-orders stops on the active map) or "Ignore".
   - Fallback: If Grok is offline, sort stops by simple geographical distance.

Step 3: Verify the changes by running "npm run build" in both backend and frontend. Fix any TypeScript or CSS compilation errors.

Step 4: Once verified, stage all files, prompt Ilyan to confirm, and run "git add .", "git commit -m 'feat: implement delivery scheduling, maps, and route optimizer AI'", and "git push" to push the code.
```

---

### 🧑‍💻 Ammar: Quality Traceability, Chart Analytics, & Defect Classifier AI

#### Your Features:
1. **Complaints Portal**: Endpoints for Buyers to submit quality issues (text description + simulated upload) for individual order items.
2. **Quality Audit Traceability**: Trace the lifecycle of any item: which farm it came from, harvest date, temperature logs, and delivery driver runs.
3. **Admin Analytics Dashboard**: Interactive charts (e.g. Recharts or Chart.js) rendering:
   * Weekly food waste rates.
   * Demand forecast accuracy (actual vs predicted).
   * Top buyers by volume.
   * Driver delivery success rates.
4. **AI Complaint Classifier**: Classifies defects (packaging, freshness, quantity), severity (minor, major, critical), and drafts a polite supplier warning. If "critical", triggers a WebSocket alert to Admins. Fallback manually if AI is offline.

#### Copy & Paste Prompt for Ammar's AI Agent:
```text
You are an expert full-stack developer assisting Ammar with his module on the "FreshRoute" monorepo.
FreshRoute is an AI-powered Farm-to-Table Supply Chain Platform. 

Monorepo Structure:
1. `backend/`: NestJS + Prisma ORM (v6.4.0) + PostgreSQL.
2. `frontend/`: React + Vite + TypeScript (Vanilla CSS styling).

Step 1: Check if npm packages are installed in both folders. If not, run "npm install". Run "npx prisma generate" in the backend to sync client types. Do not install any local database - the connection URL in backend/.env points directly to our live Supabase cloud database.

Step 2: Implement the following features:
1. Quality & Traceability:
   - Create routes and services in backend/src/complaints/ to submit complaints (linked to OrderItems) and handle resolutions (Credit, Replace, Reject).
   - Create a traceback auditing endpoint. Gather farm origin, harvest date, delivery run info, and logs for a specific item.
2. Admin Analytics Dashboard:
   - Build an Analytics view on the Admin Dashboard using a charting library (like Recharts or Chart.js).
   - Render 4 distinct charts: Waste rates, Forecast accuracy, Top buyers, and Driver success rates.
   - Add backend endpoints to aggregate this data.
3. AI Complaint Classifier:
   - Send new complaint text to Grok via the AI proxy.
   - Output (JSON): Defect category, severity, and drafted supplier warning.
   - If severity is "critical", trigger a real-time WebSocket alert (using socket.io gateway) to all online administrators.
   - Fallback: If Grok is offline, show a manual classification select input for the buyer.

Step 3: Verify the changes by running "npm run build" in both backend and frontend. Fix any TypeScript or CSS compilation errors.

Step 4: Once verified, stage all files, prompt Ammar to confirm, and run "git add .", "git commit -m 'feat: implement quality complaints, analytics, and defect classifier AI'", and "git push" to push the code.
```
