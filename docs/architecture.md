# System Architecture Specification

This document details the system design, components, and communication flows of the StudySphere platform.

---

## 1. High-Level Architecture (Level 1)

This flow illustrates the top-level structural interaction when a student requests services or performs AI-driven activities.

```mermaid
flowchart TD
    Client["User Browser (Next.js Client)"]
    ExpressAPI["Express API Backend (Node.js Server)"]
    DB[("MongoDB Database")]
    FlaskServer["Python AI Service (Flask Server)"]
    Groq["Groq API (Llama-3.3-70b-versatile)"]

    Client -->|REST API Requests & JWT| ExpressAPI
    Client -->|Real-Time WebRTC / Chat| ExpressAPI
    ExpressAPI -->|Mongoose Queries| DB
    ExpressAPI -->|Fetch / HTTP POST| FlaskServer
    FlaskServer -->|LLM Completion Prompt| Groq
```

---

## 2. System Architecture Map (Level 2)

StudySphere is divided into three major architectural tiers: the Presentation layer, the Orchestration layer, and the AI/Database layer.

```mermaid
flowchart LR
    subgraph Presentation ["Presentation Layer (Vercel)"]
        NextJS["Next.js App Router Client"]
        Zustand["Zustand State Store"]
        PeerJS_Client["PeerJS WebRTC Handler"]
    end

    subgraph ServiceOrchestration ["Service & Orchestration Layer (Render)"]
        Express["Express.js Server"]
        SocketIO["Socket.IO Server (Real-Time Communication)"]
        AuthMiddleware["JWT Verification & RBAC Middleware"]
    end

    subgraph DataAndAI ["Data & AI Core Services"]
        MongoDB[("MongoDB Atlas")]
        Flask["Flask Python Server (Render)"]
        GroqAPI["Groq LLM Engine"]
        Cloudinary["Cloudinary Storage (Media Attachments)"]
    end

    NextJS -->|Zustand States| Zustand
    NextJS -->|REST API Calls (Axios)| AuthMiddleware
    AuthMiddleware --> Express
    NextJS -->|WebRTC Events| SocketIO
    PeerJS_Client <-->|ICE / P2P Streaming| PeerJS_Client
    SocketIO <--> Express
    Express -->|Query / Updates| MongoDB
    Express -->|Generate Request| Flask
    Express -->|Upload Media| Cloudinary
    Flask -->|Prompt Parser| GroqAPI
```

---

## 3. Frontend Architecture (Level 3)

The frontend is built on **Next.js 13 App Router** with components modularized for scale.

```mermaid
flowchart TD
    subgraph AppRouter ["App Router Directory (app/)"]
        RootLayout["Root Layout (layout.js)"]
        HomePage["Main Page (page.js)"]
        OrgPage["Organization Page (/organization)"]
        QuizPage["Quiz Page (/quiz)"]
        ProfilePage["Profile Page (/Profile)"]
        WhiteboardPage["Whiteboard Page (/whiteboard)"]
    end

    subgraph ComponentLayer ["Modular Components (components/)"]
        Cards["Cards / Analytics Panels"]
        ChannelSec["Channel / Chat / Meet Panels"]
        AuthForms["Authentication (Login / Register)"]
        Canvas["Whiteboard Board Engine"]
    end

    subgraph StateLayer ["Zustand Shared State Management (store/)"]
        UserStore["userStore"]
        OrgStore["orgStore"]
        ChannelStore["channelStore"]
    end

    subgraph APILayer ["API Client Layer"]
        AxiosInterceptor["Axios Custom Interceptor (with JWT cookie)"]
        Endpoints["apiEndpoints.js Constants"]
    end

    RootLayout --> HomePage
    HomePage --> OrgPage
    OrgPage --> ChannelSec
    QuizPage --> Cards
    ProfilePage --> Cards
    WhiteboardPage --> Canvas

    ComponentLayer -->|Actions| StateLayer
    StateLayer -->|REST Call| AxiosInterceptor
    AxiosInterceptor -->|Resolves base URLs| Endpoints
```

---

## 4. Backend Architecture (Level 4)

The backend follows the **Controller-Service-Model** design pattern to separate concerns.

```mermaid
flowchart TD
    Request["Incoming API Request"]
    Routes["Express Router Mapping (routes/)"]
    Protect["protect (JWT Validation Middleware)"]
    Controllers["Controllers (controllers/)"]
    Services["Services (services/)"]
    Models["Mongoose Models (models/)"]
    MongoDB[("MongoDB Atlas Store")]

    Request --> Routes
    Routes --> Protect
    Protect --> Controllers
    Controllers --> Services
    Services --> Models
    Models --> MongoDB
```

---

## 5. Folder Architecture (Level 13)

```text
StudySphere/
├── backend/                  # Node.js/Express Backend REST Server
│   ├── config/               # Database Connection Setup
│   ├── controllers/          # Request Handlers & Logic Orchestration
│   ├── helpers/              # Response Structure and Formatter Utilities
│   ├── middlewares/          # JWT Verification & Custom CORS Gateways
│   ├── models/               # MongoDB Mongoose Data Schemas
│   ├── routes/               # Express API Route Mappings
│   ├── services/             # Core Business/DB Operations Logic
│   ├── server.js             # Express & Socket.IO Listener Configuration
│   └── vercel.json           # Vercel Serverless Deployment Config
├── frontend/                 # Next.js Frontend Application
│   ├── app/                  # Next.js 13 App Router Pages and Layouts
│   ├── components/           # Reusable UI Blocks (Quiz, Chats, Video)
│   ├── config/               # Custom Interceptors & Axios Layouts
│   ├── helperFunctions/      # Utility Tools (Formatting, Sorters)
│   ├── lib/                  # Storage abstractions & local adapters
│   ├── public/               # Asset graphics & static images
│   ├── store/                # Zustand State Stores (User, Org, Channel)
│   ├── tailwind.config.js    # Styling Config
│   └── package.json          # Node Modules Dependencies
├── py-backend/               # Flask Python AI Services Engine
│   ├── backend.py            # Flask REST endpoints & Text Processors
│   ├── requirements.txt      # Python Package Manifest
│   ├── test_api.py           # Unit validations & integration tests
│   └── .env                  # Python environment parameters
├── render.yaml               # Deployment Configuration Template (Blueprint)
└── README.md                 # Project Overview Documentation
```

---

## 6. Request Lifecycle (Level 14)

```mermaid
sequenceDiagram
    autonumber
    actor User as User Browser
    participant Axios as Axios Interceptor
    participant Express as Express Router
    participant Auth as Auth Middleware (protect)
    participant Ctrl as controller (e.g., quizController)
    participant Svc as service (e.g., quizService)
    participant DB as MongoDB (Mongoose)

    User->>Axios: Triggers Action (e.g., Submit Quiz)
    Axios->>Axios: Attach JWT Bearer Token from Cookies
    Axios->>Express: POST /api/submit-quiz
    Express->>Auth: Pass to Authorization Checker
    Auth->>Auth: Validate JWT & Fetch req.user
    alt JWT Invalid
        Auth-->>User: 401 Unauthorized Response
    else JWT Valid
        Auth->>Ctrl: Call submitQuiz(req, res)
        Ctrl->>Svc: Call submit(req, res)
        Svc->>DB: Find Quiz details & QuizUserMap.create()
        DB-->>Svc: Saved Attempt Document
        Svc->>Ctrl: Returns Quiz result data
        Ctrl-->>User: 200 OK (successResponse)
    end
```

---

## 7. Deployment Architecture (Level 15)

```mermaid
flowchart TD
    subgraph Clients ["Client Environment"]
        Browser["User Browser"]
    end

    subgraph CloudHosting ["Vercel Hosting Engine"]
        VercelCDN["Vercel Edge CDN"]
        NextFrontend["Next.js Frontend SSR/CSR Engine"]
    end

    subgraph BackendAPI ["Render Cloud Hosting Platform"]
        NodeBackend["Node.js/Express App (Web Service)"]
        FlaskBackend["Flask Python AI App (Web Service)"]
    end

    subgraph DataStores ["Database & Cloud Services"]
        Atlas[("MongoDB Atlas Cluster")]
        CloudinaryStorage[("Cloudinary Asset Server")]
    end

    Browser -->|HTTPS / WSS| VercelCDN
    VercelCDN --> NextFrontend
    NextFrontend -->|REST API / HTTPS| NodeBackend
    NextFrontend -->|Real-Time WSS| NodeBackend
    NodeBackend -->|HTTPS Fetch POST| FlaskBackend
    NodeBackend -->|MongoDB Protocol| Atlas
    NodeBackend -->|HTTPS Upload| CloudinaryStorage
```

---

## 8. Complete End-to-End System Diagram (Level 16)

This comprehensive overview shows how all modules, protocols, and data layers interconnect.

```mermaid
flowchart TD
    UserClient["Student / Teacher Browser (Next.js Application)"]
    ZustandStore["Zustand Client States (user, org, channel)"]
    PeerJS["PeerJS Host Client (WebRTC Audio/Video Connection)"]

    subgraph CoreBackend ["Express API Server (Node.js)"]
        Router["Express Router (/api)"]
        Middleware["JWT protect & RBAC Checks"]
        Controller["Controllers (User, Org, Quiz, Leaderboard)"]
        Service["Services Layer (Db operations, Streaks, Badges)"]
        SocketServer["Socket.IO Listener (Events: chat, meet, lobby)"]
    end

    subgraph DatabaseLayer ["MongoDB Atlas Cluster"]
        dbUser[("User Collection")]
        dbOrg[("Organization Collection")]
        dbChannel[("Channel Collection")]
        dbQuiz[("Quiz Collection")]
        dbAttempt[("QuizAttempt Collection")]
        dbMessage[("Message Collection")]
    end

    subgraph ExternalServices ["External Resources"]
        FlaskAI["Python Flask Engine (PDF Extractor)"]
        GroqLLM["Groq Llama-3.3 Cloud API"]
        CloudinaryCDN["Cloudinary Media API"]
    end

    UserClient -->|Updates Local State| ZustandStore
    UserClient -->|REST Requests + JWT Cookie| Router
    UserClient -->|Signaling Connection| SocketServer
    UserClient <-->|P2P Media Streams (Screen / Mic / Cam)| PeerJS

    Router --> Middleware
    Middleware --> Controller
    Controller --> Service
    Service -->|Mongoose Schema Updates| dbUser
    Service -->|Mongoose Schema Updates| dbOrg
    Service -->|Mongoose Schema Updates| dbChannel
    Service -->|Mongoose Schema Updates| dbQuiz
    Service -->|Mongoose Schema Updates| dbAttempt
    Service -->|Mongoose Schema Updates| dbMessage

    Service -->|Media Storage Uplink| CloudinaryCDN
    Service -->|AI Generator triggers HTTP request| FlaskAI
    FlaskAI -->|API Calls (llama-3.3-70b-versatile)| GroqLLM
```
