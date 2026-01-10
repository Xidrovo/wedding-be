// This file MUST be imported before anything else
// It loads .env and sets up environment variables for the Firebase emulator

import * as dotenv from 'dotenv';

// Load .env FIRST - this must happen before any Firebase imports
dotenv.config();

// Ensure FIRESTORE_EMULATOR_HOST uses 127.0.0.1 (not localhost) for Windows compatibility
if (process.env.NODE_ENV === 'development') {
    // Force 127.0.0.1 for windows compatibility if needed
    if (process.env.FIRESTORE_EMULATOR_HOST) {
        process.env.FIRESTORE_EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST.replace('localhost', '127.0.0.1');
    }
}
