# REST API Documentation

This document describes the API endpoints exposed by the StudySphere Node.js/Express server and the Flask AI service.

---

## 1. Authentication & Profile APIs

Base route: `/api/`

| Method | Route | Description | Auth Required | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/register` | Register a new user account. | No | `{ name, username, email, mobile_number, password }` |
| **POST** | `/login` | Log in a user. Returns JWT session token. | No | `{ email, password }` |
| **GET** | `/user` | Fetch current active user details. | Yes (Bearer JWT) | - |
| **POST** | `/forgot-password` | Generate reset password token & mailer link. | No | `{ email }` |
| **POST** | `/reset-password` | Reset password using token. | No | `{ token, password }` |
| **GET** | `/get-user-progress/:org` | Fetch overall progress chart stats for a user in a specific organization. | No | Query: `:org` (organization ID) |
| **GET** | `/profile` | Get logged-in user profile details (bio, contacts, skills). | Yes (Bearer JWT) | - |
| **PATCH** | `/profile` | Update profile information. | Yes (Bearer JWT) | `{ bio, phone, linkedin, github, portfolio, skills: [] }` |
| **POST** | `/profile/upload-avatar` | Upload profile image avatar. | Yes (Bearer JWT) | Form-Data: `{ file }` (Media image) |
| **GET** | `/profile/activity` | Get current user's recent activities. | Yes (Bearer JWT) | - |
| **GET** | `/profile/progress` | Get detailed stats for user progress reporting. | Yes (Bearer JWT) | - |
| **GET** | `/profile/upcoming` | Fetch upcoming tasks and events. | Yes (Bearer JWT) | - |
| **GET** | `/profile/leaderboard-analytics` | Get profile ranking and statistics for charts. | Yes (Bearer JWT) | - |

---

## 2. Organization APIs

Base route: `/api/`

| Method | Route | Description | Auth Required | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/create-org` | Establish a new organization. | Yes (Bearer JWT) | `{ name, image }` |
| **POST** | `/join-org` | Join an organization using a unique code. | Yes (Bearer JWT) | `{ org_code }` |
| **POST** | `/leave-org` | Leave the current joined organization. | Yes (Bearer JWT) | `{ org_id }` |
| **GET** | `/get-org` | Retrieve the organization details the user is part of. | Yes (Bearer JWT) | - |

---

## 3. Channel APIs

Base route: `/api/`

| Method | Route | Description | Auth Required | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/create-channel` | Create a new study/subject channel in an organization. | Yes (Bearer JWT) | `{ name, description, org_id }` |
| **POST** | `/join-channel` | Join/subscribe to a specific channel. | Yes (Bearer JWT) | `{ channelId }` |
| **GET** | `/fetch-all-channels` | Fetch list of all channels in an organization. | Yes (Bearer JWT) | Query: `?org_id=ID` |
| **PUT** | `/rename-channel` | Rename an existing channel. | Yes (Bearer JWT) | `{ channelId, name }` |
| **GET** | `/fetch-channel/:channelId` | Fetch details of a single channel. | Yes (Bearer JWT) | Path: `:channelId` |
| **POST** | `/get-members` | Fetch the list of members in a channel. | Yes (Bearer JWT) | `{ channelId }` |
| **GET** | `/channel-list` | Get list of channels joined by the active user. | Yes (Bearer JWT) | Query: `?org_id=ID` |
| **GET** | `/leave-channel/:channelId` | Unsubscribe/leave a channel. | Yes (Bearer JWT) | Path: `:channelId` |

---

## 4. Chat & Message APIs

Base route: `/api/`

| Method | Route | Description | Auth Required | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/fetch-message/:channelId` | Retrieve all historical messages in a channel. | Yes (Bearer JWT) | Path: `:channelId` |
| **POST** | `/send-message` | Send a text, media file, or attachment. | Yes (Bearer JWT) | `{ content, channelId, attachments, type, mediaType }` |
| **POST** | `/delete-message` | Remove a sent message. | Yes (Bearer JWT) | `{ messageId }` |

---

## 5. Quiz & Assessment APIs

Base route: `/api/`

| Method | Route | Description | Auth Required | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| **POST** | `/create-quiz` | Create/Save a quiz draft or publish one in a channel. | Yes (Bearer JWT) | `{ title, subject, quiz, org_id, channel_id, published, startDateTime, endDateTime, negativeMarking, maxAttempts, instructions, randomizeQuestions, randomizeOptions }` |
| **GET** | `/get-quizzes` | Fetch all quizzes for a channel. | Yes (Bearer JWT) | Query: `?org_id=ID&channel_id=ID&active=true` |
| **GET** | `/get-quiz` | Retrieve a specific quiz metadata and total submissions. | Yes (Bearer JWT) | Query: `?quiz_id=ID` |
| **POST** | `/submit-quiz` | Submit answers for a quiz attempt. | Yes (Bearer JWT) | `{ quiz_id, answers, points, startTime, endTime, timeTaken, correct, wrong, skipped, totalMarks, percentage, accuracy, difficulty, completionStatus }` |
| **GET** | `/get-user-quizzes` | Fetch all quizzes corresponding to a user. | Yes (Bearer JWT) | Query: `?org_id=ID&channel_id=ID` |
| **PUT** | `/stop-quiz` | Disables/closes active quiz immediately. | Yes (Bearer JWT) | `{ quiz_id }` |

---

## 6. Leaderboard APIs

Base route: `/api/leaderboard/`

| Method | Route | Description | Auth Required | Request Body / Query Params |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/overall` | Fetch the overall leaderboard standings. | Yes (Bearer JWT) | Query: `?org_id=ID` |
| **GET** | `/topics` | Fetch performance analysis by topics. | Yes (Bearer JWT) | Query: `?org_id=ID` |
| **GET** | `/subject/:subject` | Fetch subject-specific leaderboard rankings. | Yes (Bearer JWT) | Query: `?org_id=ID`, Path: `:subject` |
| **GET** | `/assessment/:assessmentId`| Fetch details of leaderboard ranks for a single quiz. | Yes (Bearer JWT) | Path: `:assessmentId` |
| **GET** | `/organization/:organizationId`| Retrieve aggregated statistics metrics for an organization. | Yes (Bearer JWT) | Path: `:organizationId` |
| **GET** | `/analytics/user/:userId`| Get specific user progress analytics. | Yes (Bearer JWT) | Path: `:userId` |
| **GET** | `/recent-activity` | Fetch recent organization quiz attempt activity logs. | Yes (Bearer JWT) | Query: `?org_id=ID` |
| **GET** | `/organization-members` | Fetch members leaderboard metrics in organization. | Yes (Bearer JWT) | Query: `?org_id=ID` |
| **GET** | `/channel-members` | Fetch members leaderboard metrics inside a channel. | Yes (Bearer JWT) | Query: `?channel_id=ID` |

---

## 7. Python AI Service APIs

Port: `10000` (Local/Production)

| Method | Route | Description | Auth Required | Request Body Parameters |
| :--- | :--- | :--- | :--- | :--- |
| **GET** | `/` | Verify if the Flask AI server is online. | No | - |
| **POST** | `/generate-quiz` | Processes PDF document to generate formatted quiz JSON questions via Groq (Llama-3.3). | No | Form-Data: `{ file, num_questions, difficulty, title, duration }` |
