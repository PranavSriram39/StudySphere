# Application Workflows & Lifecycles

This document details the step-by-step program flows and lifecycle stages for StudySphere's primary features.

---

## 1. AI Quiz Generation Flow (Level 8)

This workflow outlines how a teacher's uploaded PDF is parsed, processed by Llama-3.3-70b-versatile, validated, corrected, and finally stored as an active assessment.

```mermaid
flowchart TD
    Upload["1. Teacher Uploads PDF File"]
    POSTFlask["2. Express routes POST to Flask /generate-quiz"]
    TextExtract["3. PyPDF2 extracts text from pages"]
    SendGroq["4. Compile text & send prompt to Groq API"]
    ParseJSON["5. Receive output & parse JSON object"]
    
    Validate{"6. Valid Options (<4)? correct ID matches option?"}
    Repair["7. Repair duplicate options via backup pool"]
    Regenerate["8. Regenerate bad question via LLM query"]
    
    Store["9. Save Quiz Schema (is_active: true) in MongoDB"]
    Notify["10. Push 'Quiz Published' to Creator's Recent Activities"]

    Upload --> POSTFlask
    POSTFlask --> TextExtract
    TextExtract --> SendGroq
    SendGroq --> ParseJSON
    ParseJSON --> Validate
    Validate -- Option Duplicates --> Repair --> Store
    Validate -- Format Corrupt --> Regenerate --> Store
    Validate -- All Valid --> Store
    Store --> Notify
```

---

## 2. Quiz Attempt Lifecycle (Level 9)

Details the flow from a student launching an assessment, the real-time execution parameters, score computation, and statistical updates.

```mermaid
flowchart TD
    Click["1. Student selects 'Attempt Quiz'"]
    CheckAttempts{"2. Verify current attempts < maxAttempts & check timing window"}
    Block["3. Return 409 Conflict / 422 Expired Block"]
    Load["4. Fetch Quiz questions & initialize Timer"]
    Submit["5. Student submits answers or Timer expires"]
    
    Calculate["6. Score Attempt: correct/wrong/skipped questions count"]
    WriteAttempt["7. Save attempt in QuizUserMap collection"]
    AwardBadges["8. Run awardBadgesAndStreaks helper"]
    UpdateUser["9. Increment user streak & add score points to pastPerformances"]
    
    Click --> CheckAttempts
    CheckAttempts -- Restricted --> Block
    CheckAttempts -- Allowed --> Load --> Submit --> Calculate --> WriteAttempt --> AwardBadges --> UpdateUser
```

---

## 3. Leaderboard Aggregation Flow (Level 10)

Explains how historical and current quiz attempts are aggregated to render the real-time leaderboard standings.

```mermaid
flowchart TD
    Attempts[("QuizUserMap Attempt Collection")]
    Trigger["Leaderboard API Request: GET /api/leaderboard/overall"]
    
    Aggregate["Aggregate scores grouping by user_id"]
    Lookup["Join with User Collection (fetch username, name, avatar, email)"]
    Sort["Sort descending by cumulative points"]
    
    OverallRank["Renders Overall Standings"]
    TopicRank["Renders Subject/Topic Strengths Panel"]
    AnalyticsRank["Renders User Progress Growth Chart"]

    Attempts --> Trigger
    Trigger --> Aggregate --> Lookup --> Sort
    Sort --> OverallRank
    Sort --> TopicRank
    Sort --> AnalyticsRank
```

---

## 4. Socket.IO Chat Synchronization (Level 11)

This flow illustrates the real-time messaging cycle between active students within a channel.

```mermaid
sequenceDiagram
    autonumber
    actor A as Student A (Sender)
    participant S as Socket.IO Hub (Express Server)
    actor B as Student B (Receiver)

    A->>S: socket.emit("setup", userDetails)
    S-->>A: socket.emit("connected")
    A->>S: socket.emit("join chat", roomId)
    B->>S: socket.emit("join chat", roomId)

    A->>S: socket.emit("new_message", messageData, roomId)
    S->>S: Process broadcast target checks
    S-->>B: socket.broadcast.emit("new_message", messageData)
```

---

## 5. WebRTC Video Calling & Signaling (Level 12)

Details the direct peer-to-peer audio, video, and screen-sharing setup using Socket.IO as the signaling plane and PeerJS.

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Alice (Peer A)
    participant Sig as Socket.IO Server
    participant PeerServer as PeerJS Cloud Server
    actor Bob as Bob (Peer B)

    Alice->>PeerServer: Initialize Peer object (generates Peer ID)
    PeerServer-->>Alice: Returns Peer ID
    Alice->>Sig: socket.emit("join-room", roomId, AlicePeerID, Name, Image)
    Sig-->>Bob: socket.broadcast.emit("user-connected", AlicePeerID, Name, Image)
    
    Bob->>Alice: PeerJS initiates media connection call(AlicePeerID, BobStream)
    Alice-->>Bob: Accept call, Alice answers with AliceStream
    Note over Alice,Bob: Peer-to-Peer Media streaming established
    
    Note over Alice,Bob: User Actions (e.g. mute mic, stop cam)
    Alice->>Sig: socket.emit("user-toggle-audio", AlicePeerID, roomId)
    Sig-->>Bob: socket.broadcast.emit("user-toggle-audio", AlicePeerID)
    
    Alice->>Sig: socket.emit("user-leave", AlicePeerID, roomId)
    Sig-->>Bob: socket.broadcast.emit("user-leave", AlicePeerID)
```
