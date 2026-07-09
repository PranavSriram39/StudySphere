# Deployment & Environment Configuration

This document provides setup, variables configuration, and hosting guidelines for running StudySphere in development and production environments.

---

## 1. Hosting Architecture Overview

StudySphere uses a distributed hosting architecture to optimize performance and take advantage of free-tier cloud platforms.

* **Frontend:** Hosted on **Vercel** (with native support for Next.js App Router, SSR/CSR, and Edge routing).
* **Express Backend:** Hosted on **Render** as a Node.js Web Service.
* **Flask Python Backend:** Hosted on **Render** as a Python Web Service.
* **Database:** Hosted on **MongoDB Atlas** (Shared Free Cluster).
* **Media Assets (Chat Attachments, Avatars):** Stored in **Cloudinary** cloud.
* **AI Model Engine:** Powered by **Groq Cloud API** (running Llama-3.3-70b-versatile).

---

## 2. Render Blueprint (`render.yaml`)

You can spin up both backends on Render simultaneously using the provided `render.yaml` template.

```yaml
services:
  # -----------------------------
  # Node.js Backend
  # -----------------------------
  - type: web
    name: studysphere-backend
    env: node
    region: singapore
    plan: free
    rootDir: backend
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: PORT
        value: 10000
      - key: NODE_ENV
        value: production

  # -----------------------------
  # Python Backend
  # -----------------------------
  - type: web
    name: studysphere-py-backend
    env: python
    region: singapore
    plan: free
    rootDir: py-backend
    buildCommand: pip install -r requirements.txt
    startCommand: python backend.py
    envVars:
      - key: PORT
        value: 10000
```

---

## 3. Environment Variable Specifications

To run StudySphere, copy the following variables into your configuration panels or local `.env` files.

### A. Express Backend (`backend/.env`)

Create a `.env` file inside the [backend](file:///c:/Users/prana/StudySphere/backend) directory:

```env
# Server Port configuration (Render overrides this in prod)
PORT=5000

# Connection string to MongoDB Atlas database instance
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-url>/<db-name>?retryWrites=true&w=majority

# Secret key used for signing JWT login tokens
JWT_SECRET=your_jwt_signing_secret_here

# Credentials for Nodemailer email services (e.g. SMTP for Reset Password)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-email-password-here

# Project Metadata
AUTHOR=YourName
```

### B. Flask Python Backend (`py-backend/.env`)

Create a `.env` file inside the [py-backend](file:///c:/Users/prana/StudySphere/py-backend) directory:

```env
# Groq API cloud key (used to access Llama-3.3)
Groq_API_KEY=gsk_your_groq_api_key_value_here
```

### C. Next.js Frontend (`frontend/.env`)

Create a `.env` file inside the [frontend](file:///c:/Users/prana/StudySphere/frontend) directory:

```env
# Defines base API URL selection targets
# Set to 'production' on Vercel to route requests to your Render deployment
# Set to 'local' for localhost routing (Express: 5000, Flask: 10000)
NEXT_PUBLIC_APP_ENV=local
```

---

## 4. Manual Deployment Guide

### Step 1: Set up MongoDB Atlas
1. Create a database on MongoDB Atlas.
2. Under "Network Access", allow your server IPs (or `0.0.0.0/0` for initial testing).
3. Copy the database connection string, replace placeholders with database user credentials, and add it to `MONGO_URI`.

### Step 2: Deploy Python Backend to Render
1. Create a new **Web Service** on Render connected to your StudySphere Git repository.
2. Set the **Root Directory** to `py-backend`.
3. Set the **Build Command** to `pip install -r requirements.txt`.
4. Set the **Start Command** to `python backend.py`.
5. Under environment variables, add `Groq_API_KEY`.
6. Save and deploy. Note the generated Web Service URL.

### Step 3: Deploy Express Backend to Render
1. Create a second **Web Service** on Render connected to the same repository.
2. Set the **Root Directory** to `backend`.
3. Set the **Build Command** to `npm install`.
4. Set the **Start Command** to `node server.js`.
5. Under environment variables, add:
   * `MONGO_URI`
   * `JWT_SECRET`
   * `EMAIL_USER`
   * `EMAIL_PASS`
6. Save and deploy. Note the backend URL.

### Step 4: Deploy Next.js Frontend to Vercel
1. Create a new project on Vercel importing the StudySphere repository.
2. Configure build settings:
   * **Root Directory:** `frontend`
   * **Build Command:** `next build`
   * **Output Directory:** `.next`
3. Add environment variables:
   * `NEXT_PUBLIC_APP_ENV`: Set to `production`.
4. Deploy the project. Vercel will automatically optimize your pages and serve them.
