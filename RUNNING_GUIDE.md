# Running the Wedding Invitation Project

This guide provides step-by-step instructions to run the project in two modes:
1. **Local Development**: Using the Firebase Firestore Emulator.
2. **Production / Real Database**: Connecting to the live Firebase Firestore instance.

## Prerequisites

- **Node.js** (v18 or later recommended)
- **Firebase CLI** (`npm install -g firebase-tools`)
- **Java** (Required for Firebase Emulators)

---

## 🏗️ Project Structure

- **`BE/`**: Backend (NestJS API).
- **`web/wedding-invitation/`**: Frontend (Astro + Svelte).

---

## 1. Local Development (with Emulators)

This mode runs everything on your machine, using a local database that is wiped when you restart (unless configured otherwise).

### Step 1: Setup Backend & Emulators

1. Open a terminal and navigate to the `BE` folder:
   ```bash
   cd BE
   npm install
   ```
2. Start the Firebase Firestore Emulator:
   ```bash
   npm run firebase:emulator
   ```
   *Keep this terminal open.*

### Step 2: Seed the Database (Optional)

To load initial data from `BE/data/invitados.csv` into the emulator:

1. Open a **new terminal**.
2. Navigate to `BE` and run:
   ```bash
   npm run seed:local
   ```
   *Note: Ensure `data/invitados.csv` exists and the first column is set to "true" for rows you want to import.*

### Step 3: Run the Backend API

1. In the same terminal (or a new one), start the NestJS server in development mode:
   ```bash
   npm run start:dev
   ```
   *The server will start on `http://localhost:3000`.*

### Step 4: Run the Frontend

1. Open a **new terminal** and navigate to the frontend folder:
   ```bash
   cd web/wedding-invitation
   npm install
   ```
2. Start the development server:
   ```bash
   npm run start
   ```
   *The frontend will typically run on `http://localhost:4321`.*

---

## 2. Running with Real Firestore

This mode connects the backend to your actual Firebase project. Use this for production or testing against real data.

### Step 1: Backend Configuration

You must provide credentials to the backend. You have two options:

**Option A: Using Service Account File (Recommended for Local Prod Testing)**
1. Download your Firebase service account key from the Firebase Console (Project Settings > Service Accounts).
2. Save the file as **`service-account.json`** inside the `BE/` directory.

**Option B: Using Environment Variables**
1. Create a `.env` file in the `BE/` directory.
2. Add the following variables:
   ```env
   NODE_ENV=production
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
   ALLOWED_ORIGINS=http://localhost:4321,https://your-production-domain.com
   ```

### Step 2: Run the Backend

1. Build the backend:
   ```bash
   cd BE
   npm run build
   ```
2. Start the production server:
   ```bash
   npm run start:prod
   ```
   *This commands runs the built application and will connect to the real Firestore using the credentials provided.*

### Step 3: Frontend Configuration

The frontend needs to know where the backend is hosted.

1. Navigate to `web/wedding-invitation`.
2. Create or edit the **`.env`** file (create one if it doesn't exist).
3. Set the `PUBLIC_API_URL` to point to your backend:
   ```env
   # For local backend (connected to real DB)
   PUBLIC_API_URL=http://localhost:3000

   # OR for deployed backend
   PUBLIC_API_URL=https://your-backend-url.com
   ```

### Step 4: Run the Frontend

1. You can run the frontend in dev mode (pointing to real/prod backend):
   ```bash
   npm run start
   ```
2. Or build and serve for production behavior:
   ```bash
   npm run build
   node dist/server/entry.mjs
   ```
