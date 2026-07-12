# Architecture Diagrams Cheat Sheet

This document contains the essential diagrams required to master the "Final Checklist Before the Interview". Use these to practice your whiteboard explanations.

---

## 1. System Architecture (The Big Picture)
*Checklist Item: I can draw the System Architecture from memory.*

```mermaid
flowchart TD
    %% Entities
    Client["User Browser (Next.js SPA)"]
    CDN["Vercel Edge (Static Assets & SSR)"]
    Node["Express.js API (Render Web Service)"]
    Python["Flask AI Service (Render Web Service)"]
    DB[("MongoDB Atlas")]
    Groq["Groq API (Llama-3.3)"]
    Cloudinary[("Cloudinary (Media)")]

    %% Connections
    Client <-->|"1. HTTPS / REST"| CDN
    Client <-->|"2. WSS / Socket.IO"| Node
    Client <-->|"3. WebRTC (P2P)"| Client
    
    CDN -->|"API Requests"| Node
    
    Node <-->|"Mongoose queries"| DB
    Node -->|"HTTP POST (PDF Buffer)"| Python
    Node -->|"Media Uploads"| Cloudinary
    
    Python -->|"LLM Inference Request"| Groq
```

---

## 2. AI Quiz Generation Flow
*Checklist Item: I can explain the AI Quiz Generation flow step-by-step.*

```mermaid
sequenceDiagram
    autonumber
    actor Teacher
    participant NextJS as Frontend (React)
    participant Node as Express Backend
    participant Flask as Python AI Service
    participant Groq as Groq LLM API
    participant DB as MongoDB

    Teacher->>NextJS: Uploads PDF & Clicks "Generate"
    NextJS->>Node: POST /api/quiz (Multipart Form-Data)
    Node->>Node: Verify JWT & Teacher Role (RBAC)
    Node->>Flask: POST /generate-quiz (File Buffer)
    Flask->>Flask: PyPDF2 Extracts text from PDF
    Flask->>Groq: Prompt: "Generate 10 JSON MCQs from this text"
    Groq-->>Flask: Returns raw JSON string
    Flask->>Flask: Regex cleanup & Validate JSON
    Flask-->>Node: Returns structured Quiz Object
    Node->>DB: Save Quiz document
    Node-->>NextJS: 201 Created (Quiz Data)
    NextJS->>Teacher: Renders Quiz on screen
```

---

## 3. WebRTC Peer-to-Peer Signaling
*Checklist Item: I know exactly how WebRTC peer-to-peer signaling works in my app.*

```mermaid
sequenceDiagram
    autonumber
    actor UserA as Student A
    participant STUN as Google STUN Server
    participant Signaling as Node.js (Socket.IO)
    actor UserB as Student B

    UserA->>STUN: What is my Public IP?
    STUN-->>UserA: Returns Public IP & Port (ICE Candidate)
    UserA->>Signaling: Join Room + Send PeerJS ID & ICE Candidate
    Signaling->>UserB: Broadcast: User A Joined (Here is their ID)
    
    UserB->>STUN: What is my Public IP?
    STUN-->>UserB: Returns Public IP & Port
    
    UserB->>UserA: PeerJS call(UserA_ID) sending Local Media Stream
    UserA-->>UserB: Answers call sending Local Media Stream
    
    Note over UserA,UserB: Bypasses Node.js Server Completely
    UserA->>UserB: Direct P2P Video/Audio UDP Stream
    UserB->>UserA: Direct P2P Video/Audio UDP Stream
```

---

## 4. Next.js & Flask vs. Monolith
*Checklist Item: I can defend why I used Next.js and Flask instead of a monolith.*

```mermaid
flowchart LR
    subgraph Bad_Monolith ["The Bad Approach (Pure Node.js Monolith)"]
        direction TB
        UI1["React UI"] --> N1["Node.js Server"]
        N1 --> Chat1["Socket.IO Chat"]
        N1 --> AI1["Heavy PDF Parsing (Blocks Thread!)"]
        AI1 -.->|Event Loop Frozen| Chat1
    end

    subgraph Good_Decoupled ["The StudySphere Approach (Decoupled)"]
        direction TB
        UI2["Next.js (Vercel)"] -->|Fast I/O| N2["Node.js Server"]
        N2 -->|Instant| Chat2["Socket.IO Chat"]
        N2 -->|HTTP Request| F2["Flask Microservice"]
        F2 -->|CPU Heavy| AI2["PDF Parsing & Groq"]
        AI2 -.->|Event Loop NOT Blocked| Chat2
    end
```

---

## 5. Database Schema & Relationships (ERD)
*Checklist Item: I can explain the database schema and its relationships.*

```mermaid
erDiagram
    USER ||--o{ ORGANIZATION : "belongs to (Array of IDs)"
    USER ||--o{ QUIZ_ATTEMPT : "takes"
    
    ORGANIZATION ||--o{ CHANNEL : "contains"
    
    CHANNEL ||--o{ QUIZ : "hosts"
    CHANNEL ||--o{ MESSAGE : "contains chat"
    
    QUIZ ||--o{ QUIZ_ATTEMPT : "has many"
    
    QUIZ {
        ObjectId _id
        ObjectId channelId FK
        String title
        Array questions "Embedded Docs"
    }
    
    QUIZ_ATTEMPT {
        ObjectId _id
        ObjectId userId FK
        ObjectId quizId FK
        Number score
        Array answers
    }
    
    USER {
        ObjectId _id
        String email
        String passwordHash
        Array orgIds FK
        Number streak
        Number totalPoints
    }
```

---

## 6. JWT Authentication & RBAC Implementation
*Checklist Item: I know how JWT authentication and RBAC are implemented.*

```mermaid
flowchart TD
    Req["Incoming API Request"] --> Middleware["protect() Middleware"]
    
    Middleware --> CheckCookie{"Does HttpOnly 'token' cookie exist?"}
    
    CheckCookie -->|No| 401["Return 401 Unauthorized"]
    CheckCookie -->|Yes| Verify{"jwt.verify(token, SECRET)"}
    
    Verify -->|"Invalid/Expired"| 401
    Verify -->|"Valid"| Decode["Extract userId and Role from Payload"]
    
    Decode --> FetchDB["Find User in MongoDB (excluding password)"]
    FetchDB --> Attach["Attach req.user = userObject"]
    
    Attach --> RBAC{"adminOnly() Middleware"}
    
    RBAC -->|"req.user.role != 'admin'"| 403["Return 403 Forbidden"]
    RBAC -->|"req.user.role == 'admin'"| Controller["Execute Route Controller Logic"]
```
