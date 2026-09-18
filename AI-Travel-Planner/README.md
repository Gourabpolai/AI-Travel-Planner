# TripSync — AI Travel Planner

TripSync is a production-ready travel planning web application tailored for Indian destinations. It combines Gemini AI-powered day-by-day itineraries, Google Places integration with Two-Tier caching and Photon fallback, interactive budget and packing tools, and MongoDB-backed community place reviews.

## Architecture

```text
AI-Travel-Planner/
├── client/                     # Frontend (React 19, Vite, Tailwind CSS, Lucide icons)
│   ├── public/
│   │   └── destination-images/ # 300 Indian destinations (900 assets: webp, thumb, metadata)
│   └── src/
│       ├── api/                # API client layer (Axios instances for auth, trips, places, reviews)
│       ├── components/         # Shared UI components (Header, Modal, SearchBar, Tabs, Reviews)
│       ├── context/            # Authentication & session context
│       ├── data/               # Curated destinations & popular places data
│       ├── pages/              # Primary application views (Landing, Auth, Dashboard, PlaceDetails)
│       └── routes/             # Client-side router configuration (AppRouter)
├── server/                     # Backend (Node.js, Express, MongoDB Atlas, Mongoose)
│   ├── scripts/                # Database sync and verification scripts
│   │   └── archive/            # Archived data builder and image importer scripts
│   └── src/
│       ├── config/             # MongoDB connection configuration
│       ├── controllers/        # Request handling and orchestration
│       ├── data/               # Master destination dataset (indianDestinationsMaster.json)
│       ├── middleware/         # JWT authentication and error handlers
│       ├── models/             # Mongoose schemas (Trips, Users, Reviews, Caches, Itineraries)
│       ├── routes/             # RESTful API route definitions
│       ├── services/           # Business logic (Google Places, AI, Caches, Resilience)
│       └── utils/              # Helper utilities (resilience wrapper, email service)
└── docs/                       # Product specifications, API documentation, and schemas
```

## Quick Start

### 1. Backend Setup

```bash
cd server
npm install
npm run dev
```

Server runs by default on `http://localhost:8000`.

Ensure `server/.env` is configured with:
- `MONGODB_URI` (MongoDB Atlas or local fallback)
- `JWT_SECRET`
- `GEMINI_API_KEY`
- `GOOGLE_PLACES_API_KEY`

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Client runs by default on `http://localhost:5173`.

### 3. Production Build

```bash
cd client
npm run build
```

## Key Capabilities

- **300 Indian Destinations:** Curated master dataset with local photographs, thumbnails, and provenance.
- **Resilient Places Search:** Google Places API (New) with Photon OpenStreetMap fallback.
- **Two-Tier Caching:** In-memory L1 cache + persistent MongoDB L2 cache with single-flight deduplication.
- **AI Itinerary Engine:** Powered by Google GenAI (`@google/genai`) for multi-day schedule generation.
- **Community Place Reviews:** Shared, database-backed review system keyed by Google Place ID.
