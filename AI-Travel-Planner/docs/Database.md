# TripSync Database Design

## Overview

TripSync uses MongoDB as its primary database. The database is designed using a document-oriented approach where each major feature of the application is represented by a separate collection.

## Database Collections

1. Users
2. Trips
3. Itineraries
4. Expenses
5. PackingItems
6. Invitations
7. Notifications

---

# Users Collection

The Users collection stores information about every registered user of the application. Each user can create multiple trips, manage expenses, maintain packing checklists, and receive AI-generated travel recommendations.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| _id | ObjectId | Yes | Unique identifier for each user |
| name | String | Yes | User's full name |
| email | String | Yes | Unique email address used for login |
| password | String | Yes | Hashed password using bcrypt |
| avatar | String | No | Profile image URL |
| bio | String | No | Short user description |
| preferredCurrency | String | Yes | Default currency (INR, USD, EUR, etc.) |
| travelStyle | String | No | Solo, Family, Backpacking, Luxury, Business |
| createdAt | Date | Yes | Account creation timestamp |
| updatedAt | Date | Yes | Last profile update timestamp |

---

# Trips Collection

The Trips collection stores all travel plans created by users. Each trip belongs to one user and contains essential travel information such as destination, travel dates, budget, itinerary, and trip status.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| _id | ObjectId | Yes | Unique trip identifier |
| userId | ObjectId | Yes | References the owner in the Users collection |
| title | String | Yes | Name of the trip (e.g., Goa Vacation 2027) |
| destination | String | Yes | Destination city or country |
| startDate | Date | Yes | Trip start date |
| endDate | Date | Yes | Trip end date |
| budget | Number | Yes | Total planned budget |
| currency | String | Yes | Budget currency (INR, USD, etc.) |
| interests | Array | No | User interests (Adventure, Food, Beaches, etc.) |
| itineraryId | ObjectId | No | Reference to AI-generated itinerary |
| status | String | Yes | Planned, Ongoing, Completed, Cancelled |
| coverImage | String | No | Trip cover image URL |
| createdAt | Date | Yes | Trip creation timestamp |
| updatedAt | Date | Yes | Last update timestamp |

---

# Itineraries Collection

The Itineraries collection stores AI-generated travel plans for each trip. Each itinerary belongs to a single trip and contains day-wise travel schedules.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| _id | ObjectId | Yes | Unique itinerary identifier |
| tripId | ObjectId | Yes | References the associated trip |
| generatedBy | String | Yes | AI model used (Gemini) |
| totalDays | Number | Yes | Total trip duration |
| itinerary | Array | Yes | Day-wise travel schedule |
| createdAt | Date | Yes | Generation timestamp |
| updatedAt | Date | Yes | Last modification timestamp |

---

# Expenses Collection

The Expenses collection stores every expense recorded during a trip. Each expense belongs to one trip.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| _id | ObjectId | Yes | Unique expense identifier |
| tripId | ObjectId | Yes | References the associated trip |
| category | String | Yes | Food, Transport, Hotel, Shopping, etc. |
| amount | Number | Yes | Expense amount |
| description | String | No | Additional notes |
| expenseDate | Date | Yes | Date of the expense |
| createdAt | Date | Yes | Record creation timestamp |

---

# PackingItems Collection

The PackingItems collection stores all packing checklist items associated with a specific trip. It allows users to organize, update, and track the items they need to pack before traveling.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| _id | ObjectId | Yes | Unique packing item identifier |
| tripId | ObjectId | Yes | References the associated trip |
| itemName | String | Yes | Name of the packing item |
| category | String | No | Category such as Clothing, Electronics, Documents, Medicines, etc. |
| quantity | Number | No | Number of items to pack |
| isPacked | Boolean | Yes | Indicates whether the item has been packed |
| createdAt | Date | Yes | Record creation timestamp |
| updatedAt | Date | Yes | Last update timestamp |

---

# Invitations Collection

The Invitations collection stores invitations sent to other users for collaborative trip planning. Users can invite friends or family members to join and manage a trip together.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| _id | ObjectId | Yes | Unique invitation identifier |
| tripId | ObjectId | Yes | References the associated trip |
| senderId | ObjectId | Yes | User who sent the invitation |
| receiverEmail | String | Yes | Email address of the invited user |
| status | String | Yes | Invitation status (Pending, Accepted, Rejected) |
| createdAt | Date | Yes | Invitation creation timestamp |

---

# Notifications Collection

The Notifications collection stores notifications sent to users regarding trip updates, invitations, reminders, weather alerts, and system announcements.

| Field | Type | Required | Description |
|--------|------|----------|-------------|
| _id | ObjectId | Yes | Unique notification identifier |
| userId | ObjectId | Yes | References the associated user |
| title | String | Yes | Notification title |
| message | String | Yes | Detailed notification message |
| type | String | Yes | Reminder, Invitation, Weather, Expense, System |
| isRead | Boolean | Yes | Indicates whether the notification has been read |
| createdAt | Date | Yes | Notification creation timestamp |

---

# Database Relationships

The following relationships exist between the collections:

- One User can create multiple Trips.
- One Trip belongs to one User.
- One Trip has one AI-generated Itinerary.
- One Trip can contain multiple Expenses.
- One Trip can contain multiple Packing Items.
- One Trip can have multiple Invitations.
- One User can receive multiple Notifications.

---

# Entity Relationship Diagram (ERD)

```text
                         +----------------+
                         |     Users      |
                         +----------------+
                         | _id            |
                         | name           |
                         | email          |
                         | password       |
                         +----------------+
                                 |
                                 | 1
                                 |
                                 | N
                         +----------------+
                         |     Trips      |
                         +----------------+
                         | _id            |
                         | userId         |
                         | destination    |
                         | budget         |
                         | status         |
                         +----------------+
                           /    |      \
                          /     |       \
                         /      |        \
                        N       N         1
                       /        |         \
          +---------------+  +---------------+  +----------------+
          |   Expenses    |  | PackingItems  |  |  Itineraries   |
          +---------------+  +---------------+  +----------------+
          | tripId        |  | tripId        |  | tripId         |
          | amount        |  | itemName      |  | itinerary      |
          | category      |  | isPacked      |  | totalDays      |
          +---------------+  +---------------+  +----------------+

                                 |
                                 | 1
                                 |
                                 | N
                         +----------------+
                         | Invitations    |
                         +----------------+
                         | tripId         |
                         | senderId       |
                         | receiverEmail  |
                         | status         |
                         +----------------+

Users
   |
   | 1
   |
   | N
+------------------+
| Notifications    |
+------------------+
| userId           |
| title            |
| message          |
| isRead           |
+------------------+
```

---

# Conclusion

The TripSync database is designed using MongoDB's document-oriented model to provide flexibility, scalability, and efficient data management. The separation of users, trips, itineraries, expenses, packing items, invitations, and notifications into dedicated collections improves maintainability while supporting future feature expansion. This design provides a strong foundation for implementing authentication, AI itinerary generation, budget management, collaborative trip planning, and other core functionalities of the application.