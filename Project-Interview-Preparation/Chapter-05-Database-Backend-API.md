# Chapter 5: Backend, Database, and API Design

This chapter prepares you for intense backend and database interviews. You must demonstrate mastery over Data Modeling, API standardizations (REST), Authentication (JWT/RBAC), and how to optimize a Node.js/Express server to handle production-level traffic.

---

## 1. Database Design & Schemas

StudySphere uses **MongoDB (via Mongoose)**. Let’s break down the fundamental data modeling choices.

### Schema Relationships (The Graph)
1. **User (1) <---> (N) Organizations:** A user can be part of many Orgs; an Org has many users. This is a Many-to-Many relationship.
2. **Organization (1) <---> (N) Channels:** An Org contains multiple subject channels. (One-to-Many).
3. **Channel (1) <---> (N) Quizzes:** A channel contains multiple tests. (One-to-Many).
4. **Quiz (1) <---> (N) QuizAttempts:** A quiz has many attempts by different students. (One-to-Many).

### Normalization vs. Denormalization Tradeoffs
*   **Normalization (References):** In StudySphere, we heavily normalize data. A `User` document doesn't contain the whole `Organization` object; it just contains an array of `orgIds`. This prevents data bloat. If the Organization changes its name, we update it in *one* place, and it reflects everywhere.
*   **Denormalization (Embedding):** In the `Quiz` schema, we embed the `questions` array directly into the quiz document. We do *not* have a separate `Questions` collection. Why? Because questions are entirely dependent on their parent quiz and are always fetched together. Embedding them avoids an expensive JOIN (lookup) operation, massively improving read speed.

### Indexes & Query Optimization
If a user loads their dashboard, the server queries `QuizAttempt.find({ userId: req.user._id })`. Without an index, MongoDB scans every attempt ever made by anyone (Collection Scan - $O(N)$). 
*   **Best Practice:** We define Indexes on foreign keys in Mongoose: `schema.index({ userId: 1 })`. This creates a B-Tree index, reducing the search time to $O(\log N)$.

### Transactions (ACID in MongoDB)
What if an Admin deletes a Channel? We must also delete all Quizzes and QuizAttempts inside that channel. If the server crashes halfway through, we have "Orphaned Documents." 
*   **Production Fix:** Implement a MongoDB `Session`. 
    ```javascript
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        await Channel.findByIdAndDelete(channelId, { session });
        await Quiz.deleteMany({ channelId }, { session });
        await session.commitTransaction();
    } catch(err) {
        await session.abortTransaction();
    }
    ```

---

## 2. Authentication & Authorization (Security)

### Authentication (Who are you?) - JWT
We use **JSON Web Tokens (JWT)**.
*   **The Flow:** User sends email/password -> Server hashes password and compares via `bcrypt` -> If valid, server signs a payload `{ userId: '123' }` with a `SECRET_KEY` -> Returns the JWT.
*   **Storage (Critical Security):** DO NOT store JWTs in `localStorage`. They can be stolen via XSS (Cross-Site Scripting). StudySphere stores them in `HttpOnly` cookies. The browser automatically attaches this cookie to every API request, and JavaScript cannot read it.

### Authorization (What can you do?) - RBAC
**Role-Based Access Control** ensures users stay in their lanes.
*   **Implementation:** The JWT payload includes the user's role (or we fetch it in the `protect` middleware).
*   **Guard Middleware:** We implement a secondary middleware, e.g., `adminOnly`. 
    ```javascript
    const adminOnly = (req, res, next) => {
       if(req.user.role !== 'admin') return res.status(403).json({msg: 'Forbidden'});
       next();
    }
    ```
    This is attached to specific endpoints like `DELETE /api/channels/:id`.

---

## 3. API Design (REST Standards)

StudySphere adheres strictly to **REST (Representational State Transfer)** conventions.

### Endpoint Structure (Nouns, not Verbs)
*   **Good:** `GET /api/organizations`, `POST /api/organizations`
*   **Bad:** `GET /api/getOrganizations`, `POST /api/createOrganization`
*   **Hierarchical Routing:** To get channels for a specific org: `GET /api/organizations/:orgId/channels`. This visually represents the database relationship.

### Error Handling & Validation
*   **Validation:** Do not trust the client. Before hitting the database, inputs are validated (e.g., ensuring an email is formatted correctly, passwords are >6 chars). In a V2, a library like `Zod` or `Joi` should be used.
*   **Error Responses:** We use consistent HTTP status codes:
    *   `200 OK` (Success)
    *   `201 Created` (Success, new resource created)
    *   `400 Bad Request` (Invalid input data)
    *   `401 Unauthorized` (Missing or invalid JWT)
    *   `403 Forbidden` (Valid JWT, but lacks permission)
    *   `404 Not Found` (Resource doesn't exist)
    *   `500 Internal Server Error` (Database crash or Python microservice offline)

---

## 4. Advanced Backend Concepts

### Caching
*   **The Problem:** Hitting MongoDB every time a user refreshes the Organization list is expensive.
*   **The Solution (Redis):** We can cache the Organization array in Redis (an in-memory key-value store). When `GET /api/organizations` is hit, Express checks Redis first (taking 1ms). If it exists, return it. If not, hit MongoDB (taking 50ms), save the result in Redis with a TTL (Time-To-Live) of 5 minutes, and return it.

### Queues (Message Brokers)
*   **The Problem:** The AI Quiz generation takes 15 seconds. The user stares at a loading spinner. If they close the browser, the HTTP request dies, and the quiz is never saved.
*   **The Solution (RabbitMQ / BullMQ):** Instead of `await`ing the Python server, Node.js places a "Generate Quiz Task" into a Queue and returns a `202 Accepted`. A background worker picks up the task, calls Python, and saves it to MongoDB. Finally, a WebSocket event is fired to the user: "Your quiz is ready!"

### Rate Limiting
To prevent DDoS attacks or users spamming the AI generation (which costs API credits), we use `express-rate-limit`. We restrict users to, for example, 5 AI generation requests per hour per IP address.

---

## 5. Interview Master Questions (Backend & DB)

### Q1. How do you handle password storage? Why not encrypt them?
**Answer:** "Passwords must never be encrypted, they must be *hashed*. Encryption is two-way (it can be decrypted if you have the key). Hashing is a one-way mathematical function. If our database is stolen, hackers cannot reverse the hashes. I used `bcrypt` because it incorporates a 'salt' (random data added before hashing) to defeat Rainbow Tables, and it allows setting a 'work factor' to intentionally slow down the hashing process, making brute-force attacks computationally unfeasible."

### Q2. Explain the difference between Authentication and Authorization. How did you implement both?
**Answer:** "Authentication is verifying *who* you are. Authorization is verifying *what* you are allowed to do. In StudySphere, Authentication is handled by verifying credentials against the DB and issuing a JWT stored in an HttpOnly cookie. The `protect` middleware decodes this token to authenticate the user. Authorization is handled sequentially after that. A secondary middleware (e.g., `checkAdmin`) inspects the authenticated `req.user.role` to ensure they have the privileges to execute the specific controller logic."

### Q3. Why use MongoDB? What are the limitations compared to a SQL database like PostgreSQL?
**Answer:** "MongoDB was chosen because the schema for a Quiz (nested questions, varying options) maps perfectly to a BSON document. In SQL, this requires multiple normalized tables and expensive `JOIN` operations. 
The limitation of MongoDB is the lack of strict schema enforcement at the database level (though Mongoose handles it at the application level) and historical weaknesses with multi-document ACID transactions. If StudySphere heavily dealt with financial transactions instead of quizzes, I would have chosen PostgreSQL to guarantee absolute transactional integrity."

### Q4. Describe what happens if your Node.js application crashes.
**Answer:** "In development, the server simply stops. In a production environment, the Node process should be managed by a process manager like **PM2** or orchestrated within a **Docker container via Kubernetes**. If the app throws an uncaught exception, PM2 detects the exit code and automatically restarts the process within milliseconds. To prevent data loss during a crash, critical jobs (like AI processing) should be handled via persistent message queues."

### Q5. What is an N+1 query problem, and did you face it?
**Answer:** "The N+1 problem occurs when you fetch a list of items (1 query), and then loop through them to fetch related data for each item (N queries). In StudySphere, if I fetched 10 Channels, and then looped through them to `Quiz.find({ channelId: id })`, that's 11 queries. To avoid this, I use Mongoose's `.populate()` or MongoDB Aggregation pipelines to fetch the parent and child documents in a single, optimized database round-trip."

### Q6. How would you scale the Express backend to handle 10x traffic?
**Answer:** "First, I'd scale vertically (increase RAM/CPU). Next, I'd scale horizontally by spinning up multiple instances of the Express app behind an Application Load Balancer (ALB). Because authentication is stateless (JWT), any instance can serve any request. For database bottlenecks, I would implement **Redis caching** for high-read, low-change endpoints (like Organization details) and configure MongoDB read-replicas."

### Q7. You have a route that takes 5 seconds to respond. How do you debug it?
**Answer:** "I would implement logging and APM (Application Performance Monitoring) tools like Datadog or New Relic. Manually, I would wrap the controller logic in timing functions (`console.time()`) to isolate the bottleneck. Is it the database query? Is it the external API call to Python? Is it a CPU-blocking `for` loop? Once isolated, I optimize it—usually by adding DB indexes or making synchronous loops asynchronous."

### Q8. What is Cross-Site Request Forgery (CSRF) and how did you prevent it?
**Answer:** "CSRF is an attack where a malicious site tricks a user's browser into making an unwanted request to our API. Because we use cookies for JWT, the browser automatically attaches the cookie to any request to our domain. To prevent this, we configure the cookie with `SameSite: 'Strict'` or `'Lax'`. This tells the browser: 'Only attach this cookie if the request originated from the exact same domain (StudySphere's frontend)', effectively blocking cross-origin forgeries."

### Q9. Why did you use REST instead of GraphQL?
**Answer:** "GraphQL solves the problem of over-fetching and under-fetching by allowing the client to request exactly what it needs. However, it introduces significant complexity on the backend (resolvers, complex authorization rules, query depth limiting). For the MVP of StudySphere, our data requirements are well-defined and predictable. REST is standard, highly cacheable via HTTP verbs, and faster to implement securely."

### Q10. Walk me through how you implemented File Uploads for PDFs.
**Answer:** "Node.js cannot natively parse `multipart/form-data` streams easily. I used the `multer` middleware. Instead of saving the PDF to the disk (which is bad practice for scalable cloud servers), I configured `multer.memoryStorage()`. The PDF is held in RAM as a Buffer. The controller then takes this buffer and posts it directly to the internal Python Flask microservice for extraction. This keeps the Node server entirely stateless."

### Q11. Explain your indexing strategy in MongoDB.
**Answer:** "By default, MongoDB indexes the `_id` field. But if I frequently search for all Quizzes belonging to a specific Channel (`Quiz.find({ channelId: req.params.id })`), MongoDB has to scan every quiz in the database. I added a B-Tree index to `channelId`. This drastically reduces the query time from O(N) to O(log N). However, I didn't index every field, because indexes take up memory and slow down write operations (inserts/updates)."

### Q12. How does the 'Leaderboard' query work under the hood?
**Answer:** "The Leaderboard relies on the MongoDB Aggregation Pipeline. I don't pull thousands of records into Node.js to sort them. Instead, I send an aggregation array to MongoDB:
1. `$match`: Filter `QuizAttempts` by `orgId`.
2. `$group`: Group the documents by `userId`, using `$sum` to calculate total points and `$avg` for accuracy.
3. `$sort`: Sort the resulting aggregated documents by total points descending.
This pushes the heavy lifting to the database layer, which is highly optimized for this math."

### Q13. If your JWT expires while a user is filling out a form, what happens?
**Answer:** "If they click submit, the `protect` middleware throws a `TokenExpiredError` and returns a 401. The frontend Axios interceptor catches this and redirects to login, wiping the form state (which is a bad UX). To fix this, in an enterprise app, I would implement **Refresh Tokens**. The 401 triggers a silent request to `/api/refresh`, which uses a long-lived HTTP-Only refresh cookie to generate a new short-lived access JWT, allowing the original request to succeed without interrupting the user."

### Q14. What are Webhooks, and where might you use them in StudySphere?
**Answer:** "Webhooks are user-defined HTTP callbacks. They are triggered by specific events. If we integrated Stripe for paid Organizations in StudySphere, we would use Webhooks. When a user pays, Stripe sends a POST request to our Webhook endpoint (`/api/webhooks/stripe`). Our server validates the Stripe signature and updates the User's subscription status in the database asynchronously."

### Q15. How would you design an API rate limiter?
**Answer:** "I would use a sliding window algorithm backed by Redis. When a request hits the `/api/generate` endpoint, I use the user's IP address (or `userId`) as the Redis key. I increment the value and set an expiration of 1 hour. If the value exceeds the limit (e.g., 5), the middleware blocks the request and returns HTTP `429 Too Many Requests`. Redis is essential here because it is incredibly fast and works across multiple Node.js instances."
