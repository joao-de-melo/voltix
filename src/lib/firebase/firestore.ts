import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type CollectionReference,
  type QueryDocumentSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

// ============================================
// Collection References
// ============================================

export const collections = {
  users: () => collection(db, "users"),
  userMemberships: (userId: string) =>
    collection(db, "users", userId, "memberships"),
  organizations: () => collection(db, "organizations"),
  orgMembers: (orgId: string) =>
    collection(db, "organizations", orgId, "members"),
  orgInvitations: (orgId: string) =>
    collection(db, "organizations", orgId, "invitations"),
  productCategories: (orgId: string) =>
    collection(db, "organizations", orgId, "productCategories"),
  products: (orgId: string) =>
    collection(db, "organizations", orgId, "products"),
  customers: (orgId: string) =>
    collection(db, "organizations", orgId, "customers"),
  customerSites: (orgId: string, customerId: string) =>
    collection(db, "organizations", orgId, "customers", customerId, "sites"),
  customerEnergyProfiles: (orgId: string, customerId: string) =>
    collection(db, "organizations", orgId, "customers", customerId, "energyProfiles"),
  quotes: (orgId: string) =>
    collection(db, "organizations", orgId, "quotes"),
  auditLogs: (orgId: string) =>
    collection(db, "organizations", orgId, "auditLogs"),
  regions: () => collection(db, "regions"),
};

// ============================================
// Document References
// ============================================

export const docs = {
  user: (userId: string) => doc(db, "users", userId),
  userMembership: (userId: string, orgId: string) =>
    doc(db, "users", userId, "memberships", orgId),
  organization: (orgId: string) => doc(db, "organizations", orgId),
  orgMember: (orgId: string, userId: string) =>
    doc(db, "organizations", orgId, "members", userId),
  orgInvitation: (orgId: string, invitationId: string) =>
    doc(db, "organizations", orgId, "invitations", invitationId),
  productCategory: (orgId: string, categoryId: string) =>
    doc(db, "organizations", orgId, "productCategories", categoryId),
  product: (orgId: string, productId: string) =>
    doc(db, "organizations", orgId, "products", productId),
  customer: (orgId: string, customerId: string) =>
    doc(db, "organizations", orgId, "customers", customerId),
  customerSite: (orgId: string, customerId: string, siteId: string) =>
    doc(db, "organizations", orgId, "customers", customerId, "sites", siteId),
  customerEnergyProfile: (orgId: string, customerId: string, profileId: string) =>
    doc(db, "organizations", orgId, "customers", customerId, "energyProfiles", profileId),
  quote: (orgId: string, quoteId: string) =>
    doc(db, "organizations", orgId, "quotes", quoteId),
  region: (regionCode: string) => doc(db, "regions", regionCode),
};

// ============================================
// Generic CRUD Helpers
// ============================================

export async function getDocument<T>(
  docRef: DocumentReference<DocumentData>
): Promise<T | null> {
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as T;
}

export async function getDocuments<T>(
  collectionRef: CollectionReference<DocumentData>,
  ...queryConstraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collectionRef, ...queryConstraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as T));
}

export async function createDocument<T extends DocumentData>(
  collectionRef: CollectionReference<DocumentData>,
  data: Omit<T, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function setDocument<T extends DocumentData>(
  docRef: DocumentReference<DocumentData>,
  data: Omit<T, "id" | "createdAt" | "updatedAt">,
  merge: boolean = false
): Promise<void> {
  await setDoc(
    docRef,
    {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge }
  );
}

export async function updateDocument(
  docRef: DocumentReference<DocumentData>,
  data: Partial<DocumentData>
): Promise<void> {
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(
  docRef: DocumentReference<DocumentData>
): Promise<void> {
  await deleteDoc(docRef);
}

// ============================================
// Pagination Helper
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export async function getPaginatedDocuments<T>(
  collectionRef: CollectionReference<DocumentData>,
  pageSize: number,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  ...queryConstraints: QueryConstraint[]
): Promise<PaginatedResult<T>> {
  const constraints: QueryConstraint[] = [...queryConstraints, limit(pageSize + 1)];

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);

  const hasMore = snapshot.docs.length > pageSize;
  const docs = hasMore ? snapshot.docs.slice(0, -1) : snapshot.docs;

  return {
    data: docs.map((doc) => ({ id: doc.id, ...doc.data() } as T)),
    lastDoc: docs.length > 0 ? docs[docs.length - 1] : null,
    hasMore,
  };
}

// ============================================
// Timestamp Helpers
// ============================================

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}

export function fromTimestamp(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function now(): Timestamp {
  return Timestamp.now();
}

export { serverTimestamp, where, orderBy, limit, Timestamp };
