# GDG MMMUT Frontend Setup

## Prerequisites

- Node.js 18+
- Backend API running (default: `http://localhost:5000`)

## Install

```bash
cd frontend
npm install
```

## Environment Setup

1. Copy env template:

```bash
copy .env.example .env
```

2. Configure values in `.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:5173
```

## Run

```bash
npm run dev
```

Default app URL: `http://localhost:5173`

## Build

```bash
npm run build
```
