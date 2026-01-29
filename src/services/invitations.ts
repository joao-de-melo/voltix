import {
  query,
  where,
  getDocs,
  serverTimestamp,
  writeBatch,
  collectionGroup,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  collections,
  docs,
  getDocument,
  getDocuments,
  createDocument,
  updateDocument,
  toTimestamp,
  orderBy,
} from "@/lib/firebase/firestore";
import type { Invitation, Membership, UserRole } from "@/types";

export interface CreateInvitationInput {
  orgId: string;
  orgName: string;
  role: UserRole;
  invitedBy: string;
  invitedByName: string;
  type: "email" | "link";
  email?: string;
  expirationDays?: number;
}

/**
 * Generate a cryptographically secure token for invitations
 */
function generateToken(): string {
  return crypto.randomUUID();
}

/**
 * Create a new invitation (email or link type)
 */
export async function createInvitation(
  input: CreateInvitationInput
): Promise<Invitation> {
  const { expirationDays = 7, ...rest } = input;

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expirationDays);

  const token = generateToken();

  const invitationData = {
    ...rest,
    token,
    status: "pending" as const,
    expiresAt: toTimestamp(expiresAt),
  };

  const id = await createDocument(
    collections.orgInvitations(input.orgId),
    invitationData
  );

  // Fetch and return the created invitation
  const invitation = await getDocument<Invitation>(
    docs.orgInvitation(input.orgId, id)
  );

  if (!invitation) {
    throw new Error("Failed to create invitation");
  }

  return invitation;
}

/**
 * Get all pending invitations for an organization
 */
export async function getPendingInvitations(orgId: string): Promise<Invitation[]> {
  return getDocuments<Invitation>(
    collections.orgInvitations(orgId),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );
}

/**
 * Get all invitations for an organization (any status)
 */
export async function getInvitations(orgId: string): Promise<Invitation[]> {
  return getDocuments<Invitation>(
    collections.orgInvitations(orgId),
    orderBy("createdAt", "desc")
  );
}

/**
 * Get a single invitation by ID
 */
export async function getInvitation(
  orgId: string,
  invitationId: string
): Promise<Invitation | null> {
  return getDocument<Invitation>(docs.orgInvitation(orgId, invitationId));
}

/**
 * Find an invitation by token (searches across all organizations)
 * Used for the public invite acceptance flow
 */
export async function getInvitationByToken(
  token: string
): Promise<Invitation | null> {
  // Query across all invitations subcollections using collectionGroup
  // Must include type='link' filter to satisfy Firestore security rules
  const invitationsQuery = query(
    collectionGroup(db, "invitations"),
    where("token", "==", token),
    where("status", "==", "pending"),
    where("type", "==", "link")
  );

  const snapshot = await getDocs(invitationsQuery);

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Invitation;
}

/**
 * Accept an invitation and create membership
 */
export async function acceptInvitation(
  invitation: Invitation,
  userId: string,
  userEmail: string,
  userName: string
): Promise<void> {
  const batch = writeBatch(db);

  // Update invitation status
  const invitationRef = docs.orgInvitation(invitation.orgId, invitation.id);
  batch.update(invitationRef, {
    status: "accepted",
    acceptedBy: userId,
    updatedAt: serverTimestamp(),
  });

  // Create membership in organization
  const orgMemberRef = docs.orgMember(invitation.orgId, userId);
  batch.set(orgMemberRef, {
    orgId: invitation.orgId,
    orgName: invitation.orgName,
    userId,
    userEmail,
    userName,
    role: invitation.role,
    joinedAt: serverTimestamp(),
    invitedBy: invitation.invitedBy,
  });

  // Create membership in user's memberships subcollection
  const userMembershipRef = docs.userMembership(userId, invitation.orgId);
  batch.set(userMembershipRef, {
    orgId: invitation.orgId,
    orgName: invitation.orgName,
    userId,
    userEmail,
    userName,
    role: invitation.role,
    joinedAt: serverTimestamp(),
    invitedBy: invitation.invitedBy,
  });

  await batch.commit();
}

/**
 * Revoke an invitation
 */
export async function revokeInvitation(
  orgId: string,
  invitationId: string
): Promise<void> {
  await updateDocument(docs.orgInvitation(orgId, invitationId), {
    status: "revoked",
  });
}

/**
 * Delete an invitation
 */
export async function deleteInvitation(
  orgId: string,
  invitationId: string
): Promise<void> {
  const { deleteDoc } = await import("firebase/firestore");
  await deleteDoc(docs.orgInvitation(orgId, invitationId));
}

/**
 * Check if a user is already a member of an organization
 */
export async function isUserMemberOfOrg(
  orgId: string,
  userId: string
): Promise<boolean> {
  const membership = await getDocument<Membership>(
    docs.orgMember(orgId, userId)
  );
  return membership !== null;
}

/**
 * Generate the full invitation URL for a link-type invitation
 */
export function getInvitationUrl(token: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/invite/${token}`;
}
