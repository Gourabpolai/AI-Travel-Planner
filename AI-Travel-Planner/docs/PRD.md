# TripSync - AI Travel Planner
### Intelligent Trip Planning Powered by Artificial Intelligence

---

**Version:** 1.1 (Updated to reflect current constraints & architecture)

**Author:** Gourab Polai

**Date:** 09 July 2026

---

# Table of Contents

1. Executive Summary
2. Vision Statement
3. Problem Statement
4. Objectives
5. Target Users
6. System Architecture & Technical Constraints (NEW)
7. Competitive Analysis
8. User Personas
9. User Stories
10. User Journey
11. Functional Requirements
12. Non-functional Requirements
13. MVP Features
14. Future Scope
15. Risks
16. Success Metrics
17. Development Roadmap
18. Conclusion

---

# 1. Executive Summary

TripSync is an AI-powered travel planning platform designed to simplify the entire travel planning process. Users can create trips, generate personalized AI itineraries, track budgets, manage packing checklists, view weather forecasts, and explore destinations using integrated maps.

Currently, the application is **strictly focused on Indian destinations** to provide highly localized context, with all budgeting and financial data represented in Indian Rupees (INR - ₹).

Instead of relying on multiple applications for planning, budgeting, navigation, and itinerary creation, TripSync provides a single platform that centralizes every aspect of trip management.

# 2. Vision Statement

To become an intelligent travel companion that helps users plan, organize, and enjoy memorable journeys with minimal effort using AI-powered recommendations and collaborative planning tools, starting with a laser focus on the Indian travel market.

# 3. Problem Statement

Planning a trip often requires travelers to switch between several different applications. They use Google Maps for navigation, weather apps to check forecasts, notes apps for packing lists, Excel to manage expenses, WhatsApp for coordinating with friends or family, and AI tools to create travel itineraries. Managing all these tasks across multiple platforms is time-consuming, confusing, and inefficient.

The lack of a single, integrated solution makes trip planning more complicated. TripSync solves this problem by combining itinerary generation, navigation, weather updates, budget tracking, packing checklists, and group planning into one easy-to-use platform.

# 4. Objectives

The primary objectives of TripSync are:

- Simplify travel planning by combining multiple travel tools into one platform.
- Generate personalized AI-based travel itineraries using Google Gemini.
- Restrict destinations to **India** for precise local planning.
- Help users manage their travel budget effectively in **INR (₹)**.
- Track daily expenses throughout the trip.
- Maintain interactive packing checklists.
- Display real-time weather information.
- Integrate interactive maps for navigation.
- Store travel history for future reference.

# 5. Target Users

## Primary Users
- Indian College Students looking for affordable getaways.
- Solo Travelers exploring India.
- Families planning vacations.
- Backpackers.

## Secondary Users
- Travel Agencies building quick itineraries for clients.

# 6. System Architecture & Technical Constraints (NEW)

To successfully design UIs or understand the backend flow, the following constraints must be strictly adhered to:

## 1. Regional & Currency Constraints
- **Geography:** The search and place autocomplete APIs are restricted to Indian locations only (`includedRegionCodes: ["in"]`).
- **Currency:** All UI elements dealing with budgets, estimated costs, and expenses must hardcode formatting to INR (`₹`). No multi-currency support is currently required.

## 2. API Quotas & Media Fetching
- **No Live Images:** Due to strict third-party API rate limits (Google Places, Wikipedia, Unsplash), **the application currently does NOT fetch dynamic photos from the database or external APIs**.
- **Static Assets:** The UI must rely exclusively on high-quality static placeholder images for destination cards, hero banners, and attraction thumbnails. Do not build UI components that expect a unique image URL from the backend per attraction.

## 3. Caching & Performance (Tier 1 Cache)
- When a user views a trip, the backend checks a MongoDB "Tier 1 Cache" for the destination details.
- The "Explore Spots" (Destination Explorer) UI leverages this cache to load attraction cards instantaneously without hitting external APIs or AI services, providing a seamless filtering experience.

## 4. AI Itinerary Generation Logic
- **Engine:** Powered by Google Gemini (`gemini-flash-latest`).
- **Resilience:** The backend uses a strict 25-second timeout and retry loop to gracefully handle `503 High Demand` errors without crashing the UI.
- **Regeneration:** When a user taps "Regenerate", the backend injects a "Random Seed" (timestamp) and specific instructions to force the AI to generate a **completely different** itinerary, ensuring the user never sees the same plan twice.

# 7. Competitive Analysis

| Feature | TripSync | Google Maps | Wanderlog | ChatGPT |
|----------|----------|-------------|------------|----------|
| AI Itinerary | ✅ | ❌ | ❌ | ✅ |
| Budget Tracker (INR) | ✅ | ❌ | ✅ | ❌ |
| Expense Tracking | ✅ | ❌ | ✅ | ❌ |
| Weather Integration | ✅ | ❌ | ❌ | ❌ |
| Packing Checklist | ✅ | ❌ | ✅ | ❌ |
| Static Image Optimization| ✅ | ❌ | ❌ | ❌ |

# 8. User Personas

## Persona 1 – Student Traveler
Name: Rahul Sharma
Age: 21
Occupation: College Student
Goals: Plan affordable trips within India, save money, generate itineraries quickly.
Pain Points: Limited budget, uses multiple apps.

## Persona 2 – Solo Traveler
Name: Sarah Williams
Age: 28
Occupation: Software Engineer
Goals: Discover unique places in India, travel efficiently.
Pain Points: Time-consuming planning, finding reliable local information.

# 9. User Stories

- As a traveler, I want to create a new trip in India so that I can organize my journey.
- As a traveler, I want AI to generate an itinerary so that I save planning time.
- As a traveler, I want to click "Regenerate" and get a completely unique alternative plan if I don't like the first one.
- As a traveler, I want to add expenses in Rupees (₹) so that I stay within my budget.
- As a traveler, I want a packing checklist so that I don't forget important items.
- As a traveler, I want to search for destinations using an autocomplete search bar.
- As a traveler, I want the "Explore Spots" page to load instantly from cache so I don't have to wait.

# 10. User Journey

Visitor -> Landing Page -> Register / Login -> Dashboard -> Create New Trip -> (Autocomplete Destination restricted to India, Enter Dates, Budget in INR) -> AI Generates Itinerary -> Save Trip -> Explore Spots (Instant Load via Cache) -> Manage Budget / Packing Checklist -> Trip Completed.

# 11. Functional Requirements

## Trip Management
- Search and create trips exclusively for Indian destinations.
- Format all budgets to `Intl.NumberFormat('en-IN')`.

## AI Itinerary Generation
- Generate personalized 1-to-N day itineraries.
- Handle API rate limits gracefully via background retries.
- Support forced regeneration for completely distinct alternative plans.

## Destination Explorer
- Load attractions instantly utilizing the pre-fetched MongoDB cache.
- Filter attractions locally via the search bar without triggering new network requests.
- Prevent dropdown overlapping issues using proper `z-index` stacking.

# 12. Non-Functional Requirements

- **Performance:** Caching must be heavily utilized to prevent slow AI/API calls. Destination lists must load from MongoDB instantly.
- **Cost-Efficiency:** Do not execute external image fetches (Google/Wiki/Unsplash). Rely on static UI placeholders to avoid quota exhaustion.

# 13. MVP Features

- User Authentication
- Dashboard
- India-Only Trip Management
- AI Itinerary Generator (with robust retry & distinct regeneration)
- Instant Destination Explorer (Cached)
- Budget & Expense Tracking (INR)
- Packing Checklist

# 14. Conclusion

TripSync aims to simplify the travel planning experience by integrating multiple travel management features into a single AI-powered platform. By acknowledging real-world technical constraints—such as API limits, image fetching quotas, and LLM timeouts—and building robust caching and fallback systems around them, TripSync delivers a lightning-fast and reliable planning experience for the Indian travel market.