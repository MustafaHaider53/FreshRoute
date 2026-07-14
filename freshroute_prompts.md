# FreshRoute: Team AI Prompts

This document contains copy-pasteable prompts for Faraz, Ilyan, and Ammar. They can copy their respective prompt and paste it into an AI assistant (like Grok, Claude, or ChatGPT) to automatically understand the codebase and implement their feature modules.

---

## 1. Faraz's Prompt (Order Management, WebSockets, & Demand Forecasting AI)

Copy and paste the text below:

```text
You are an expert full-stack developer assisting me (Faraz) with my part of the "FreshRoute" course project. 
FreshRoute is an AI-powered Farm-to-Table Supply Chain Platform. 

The project is structured as a monorepo containing:
1. `backend/`: A NestJS API using Prisma ORM with PostgreSQL.
2. `frontend/`: A React 18 + TypeScript SPA (styled with Vanilla CSS).

Mustafa has already initialized the repository. In `backend/prisma/schema.prisma`, the complete schema has been set up (including the User, Product, Order, OrderItem, Complaint, PricingSuggestion, and DemandForecast models). The Auth module (JWT) is also implemented.

My assigned features are:
1. Order Management:
   - Schema relations: Users (role BUYER) can create Orders containing multiple OrderItems (each pointing to a Product and its respective Farmer).
   - Backend logic: Create endpoints for:
     * Placing an order (multi-item shopping cart checkout). Check that product quantities are available, deduct stock from the Product model, create the Order, and create the OrderItems.
     * Order workflow transitions: Pending -> Confirmed -> Packed -> In Transit -> Delivered / Disputed.
     * Guard these routes by roles (e.g. only Admin/Farmer can confirm/pack/ship; only Driver/Admin can mark delivered; only Buyer/Admin can dispute).
2. WebSockets & Real-Time Alerts:
   - Establish a NestJS WebSocket Gateway (`socket.io` using `@nestjs/websockets`).
   - Group socket connections into Rooms by Role or User ID (e.g. "farmers", "driver-stops", and individual user rooms).
   - When a Buyer places an order and it changes to "CONFIRMED", broadcast a WebSocket notification to the specific Farmer(s) whose products are in that order.
   - Provide standard WebSocket client-side connection hooks in the React frontend.
3. AI Integration: Demand Forecaster (AI Feature 1):
   - Create a NestJS service/endpoint that maps through the shared NestJS AI Proxy.
   - Inputs: The last 8 weeks of order history per produce category, and the current week of the year.
   - AI Output: Predict next week's order volume per category (in weight or units) with a confidence band (low, medium, high).
   - Dashboard Integration: Show the predicted demand forecasts to Farmers on their dashboard so they can plan harvests.
   - Fallback (Graceful Degradation): If the Grok/LLM API is unavailable, calculate and return a simple static rolling average of the last 4 weeks of sales as the forecast, alongside a message alerting the user that the AI prediction is offline.

Task:
Please analyze the FreshRoute system requirements and write the clean, optimized code for my part. 
This includes:
- Backend: `backend/src/orders/` modules, controllers, services, DTOs, and WebSocket gateway.
- AI Module additions: `backend/src/ai/` extension for the Demand Forecaster.
- Frontend: Buyer marketplace shopping cart, order placement UI, order tracking page (showing progress bar of status transitions), and Farmer's forecast dashboard view.
- Styling: Premium vanilla CSS layouts with micro-animations, proper error boundaries, and loading indicators.
```

---

## 2. Ilyan's Prompt (Delivery Scheduling, Maps, Cron Jobs, & Route Optimizer AI)

Copy and paste the text below:

```text
You are an expert full-stack developer assisting me (Ilyan) with my part of the "FreshRoute" course project. 
FreshRoute is an AI-powered Farm-to-Table Supply Chain Platform. 

The project is structured as a monorepo containing:
1. `backend/`: A NestJS API using Prisma ORM with PostgreSQL.
2. `frontend/`: A React 18 + TypeScript SPA (styled with Vanilla CSS).

Mustafa has already initialized the repository. In `backend/prisma/schema.prisma`, the complete schema has been set up (including the User, Product, Order, OrderItem, Complaint, PricingSuggestion, and DemandForecast models). The Auth module (JWT) is also implemented.

My assigned features are:
1. Delivery Scheduling:
   - Backend logic: Add endpoints for Admins to assign confirmed orders to Drivers and assemble "Delivery Runs" (updating `driverId` on Orders).
   - Driver Stops: Create endpoints for Drivers to see their assigned stops, mark a stop as "DELIVERED" or "FAILED" (with special reasons/instructions), and trigger a real-time WebSocket notification back to the Buyer.
2. Scheduled Cron Jobs:
   - Configure a NestJS Cron service (using `@nestjs/schedule`).
   - Create a cron job that runs daily at 6:00 AM. It queries all orders assigned to each driver for that day, compiles a delivery schedule report, and sends a daily summary alert/log to each driver (we can simulate the email sending with a console log and saving a summary report in a delivery log file/table).
3. Map-based Tracker UI:
   - In the React frontend, integrate a mapping library (such as Leaflet via React-Leaflet or OpenLayers) using open-source OpenStreetMap tiles.
   - Render a map for Drivers showing all their assigned delivery stops as map markers. Clicking a marker shows the customer details, delivery address, and notes.
   - Render a map for Buyers to track their order status visually (coordinates can be mocked or geocoded based on address).
4. AI Integration: Route Optimiser Chat (AI Feature 4 - Bonus):
   - Integrate a text-based chat interface for Drivers on their map screen.
   - Input: Driver describes their stops or special constraints in natural language (e.g. "I have to deliver to 5th Ave first, then 10th street, but 10th street closes at 12 PM").
   - AI Output: Suggests a reordered stop sequence to minimize total travel time/distance, accompanied by a brief rationale.
   - Driver Actions: The Driver can click "Accept Reordering" which automatically re-sorts their stop sequence list on the map, or "Ignore" and keep the original order.
   - Fallback: If the Grok/LLM API is offline, default back to sorting stops by ascending geographical distance (simple straight-line distance sorting) or original order.

Task:
Please analyze the FreshRoute system requirements and write the clean, optimized code for my part.
This includes:
- Backend: `backend/src/delivery/` controllers, services, DTOs, and Cron scheduler.
- AI Module additions: `backend/src/ai/` extension for the Route Optimiser Chat.
- Frontend: Admin assignment panel, Driver route map panel (using Leaflet), Route Optimizer Chat UI, and Buyer order tracking map component.
- Styling: Premium vanilla CSS layouts with responsive map frames, smooth transitions, and loading states.
```

---

## 3. Ammar's Prompt (Quality Complaints, Admin Analytics, & Complaint Classifier AI)

Copy and paste the text below:

```text
You are an expert full-stack developer assisting me (Ammar) with my part of the "FreshRoute" course project. 
FreshRoute is an AI-powered Farm-to-Table Supply Chain Platform. 

The project is structured as a monorepo containing:
1. `backend/`: A NestJS API using Prisma ORM with PostgreSQL.
2. `frontend/`: A React 18 + TypeScript SPA (styled with Vanilla CSS).

Mustafa has already initialized the repository. In `backend/prisma/schema.prisma`, the complete schema has been set up (including the User, Product, Order, OrderItem, Complaint, PricingSuggestion, and DemandForecast models). The Auth module (JWT) is also implemented.

My assigned features are:
1. Quality & Traceability:
   - Backend logic: Endpoints for Buyers to submit quality complaints (free-text description + optional image upload) linked to a specific OrderItem.
   - Workflow transitions: Submitted -> Under Review -> Resolved (with resolution types: Credit, Replace, or Reject).
   - Traceability lookup: Create an endpoint that allows Admins or Buyers to view the entire traceback of an OrderItem (linked farm details, harvest date, days-since-harvest, driver delivery run logs, and temperature/spoilage alerts).
2. Admin Analytics Dashboard:
   - Create a dashboard in the React frontend utilizing a charting library (like Chart.js or Recharts).
   - Render at least 4 chart types:
     * Weekly waste rate by category (bar chart showing spoiled/wasted vs sold produce).
     * Demand forecast accuracy (line/area chart comparing predicted vs actual orders).
     * Top 10 buyers by volume and revenue (horizontal bar chart).
     * Driver delivery success rates (pie/donut chart).
   - Add backend analytics routes to aggregate and query these metrics.
3. AI Integration: Quality Complaint Classifier (AI Feature 3):
   - When a Buyer submits a complaint, route the text + product details through the NestJS AI Proxy.
   - AI Output: Automatically classify the defect category (packaging, contamination, freshness, wrong item, quantity), determine severity (minor, major, critical), and draft a polite supplier alert message for the Farmer.
   - WebSocket Escalation: If the AI classifies the complaint severity as "critical", trigger a real-time WebSocket alert directly to all online Administrators.
   - Fallback: If the Grok/LLM API is offline, gracefully degrade by rendering a manual category dropdown for the buyer to choose and set severity to "under review".

Task:
Please analyze the FreshRoute system requirements and write the clean, optimized code for my part.
This includes:
- Backend: `backend/src/complaints/` and `backend/src/analytics/` modules, controllers, and services.
- AI Module additions: `backend/src/ai/` extension for the Quality Classifier.
- Frontend: Buyer complaint submission form, admin complaint manager dashboard, traceback audit view, and Admin Analytics Dashboard with the 4 charts.
- Styling: Premium vanilla CSS layouts with glassmorphic dashboards, charts, and clean transitions.
```
