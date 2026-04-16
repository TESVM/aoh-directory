"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFirebaseClientConfig, hasFirebaseClientConfig } from "@/lib/firebase/config";

export function getFirebaseClientApp() {
  if (!hasFirebaseClientConfig()) {
    throw new Error("Firebase client environment variables are not configured.");
  }

  return getApps().length ? getApp() : initializeApp(getFirebaseClientConfig());
}

export function getFirebaseClientAuth() {
  return getAuth(getFirebaseClientApp());
}

export function getFirebaseClientDb() {
  return getFirestore(getFirebaseClientApp());
}
