import * as admin from "firebase-admin";

admin.initializeApp();

// Export callable functions
export { generateQuotePDF } from "./callable/quotes";

// Export triggers
export { onUserCreate } from "./triggers/auth";
