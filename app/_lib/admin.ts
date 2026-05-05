// src/lib/firebaseAdmin.ts

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import {getAuth, UserRecord} from "firebase-admin/auth";
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import {firestore} from "firebase-admin";

const app = !getApps().length
    ? initializeApp({
        credential: cert({
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            clientEmail: process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
    })
    : getApps()[0];

export const adminAuth = getAuth(app);
export const adminDb = getFirestore();