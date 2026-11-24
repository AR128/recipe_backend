import { cert, initializeApp } from "firebase-admin/app";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectId =
  process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
const adminEmails = (process.env.ADMIN_EMAIL || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccountClientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const serviceAccountPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId) {
  throw new Error(
    "FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID must be configured for Firebase Auth."
  );
}

if (adminEmails.length === 0) {
  throw new Error("ADMIN_EMAIL must be configured for Firebase admin access.");
}

let serviceAccount;

if (serviceAccountJson) {
  try {
    serviceAccount = JSON.parse(serviceAccountJson);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON must contain valid service-account JSON."
    );
  }
} else if (serviceAccountPath) {
  try {
    serviceAccount = JSON.parse(
      readFileSync(resolve(serviceAccountPath), "utf8")
    );
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_PATH must point to a readable service-account JSON file."
    );
  }
} else if (serviceAccountClientEmail || serviceAccountPrivateKey) {
  if (!serviceAccountClientEmail || !serviceAccountPrivateKey) {
    throw new Error(
      "Set both FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY for Firebase Admin credentials."
    );
  }

  serviceAccount = {
    project_id: projectId,
    client_email: serviceAccountClientEmail,
    private_key: serviceAccountPrivateKey.replace(/\\n/g, "\n"),
  };
}

if (serviceAccount) {
  const serviceAccountProjectId =
    serviceAccount.project_id || serviceAccount.projectId;
  const clientEmail = serviceAccount.client_email || serviceAccount.clientEmail;
  const privateKey = serviceAccount.private_key || serviceAccount.privateKey;

  if (
    serviceAccountProjectId !== projectId ||
    typeof clientEmail !== "string" ||
    typeof privateKey !== "string"
  ) {
    throw new Error(
      "Firebase service-account credentials must include a matching project ID, client email, and private key."
    );
  }

  serviceAccount = {
    projectId: serviceAccountProjectId,
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, "\n"),
  };
}

export const firebaseApp = initializeApp({
  projectId,
  ...(serviceAccount ? { credential: cert(serviceAccount) } : {}),
});
export const firebaseAdminEmails = adminEmails;
