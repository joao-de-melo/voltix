import { writeBatch, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  collections,
  docs,
  getDocument,
  getDocuments,
} from "@/lib/firebase/firestore";
import type { Membership, UserRole } from "@/types";

/**
 * Get all members of an organization
 */
export async function getMembers(orgId: string): Promise<Membership[]> {
  return getDocuments<Membership>(collections.orgMembers(orgId));
}

/**
 * Get a single member
 */
export async function getMember(
  orgId: string,
  userId: string
): Promise<Membership | null> {
  return getDocument<Membership>(docs.orgMember(orgId, userId));
}

/**
 * Update a member's role
 */
export async function updateMemberRole(
  orgId: string,
  userId: string,
  newRole: UserRole
): Promise<void> {
  const batch = writeBatch(db);

  // Update in organization members
  const orgMemberRef = docs.orgMember(orgId, userId);
  batch.update(orgMemberRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });

  // Update in user's memberships
  const userMembershipRef = docs.userMembership(userId, orgId);
  batch.update(userMembershipRef, {
    role: newRole,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
}

/**
 * Remove a member from an organization
 */
export async function removeMember(
  orgId: string,
  userId: string
): Promise<void> {
  const batch = writeBatch(db);

  // Delete from organization members
  const orgMemberRef = docs.orgMember(orgId, userId);
  batch.delete(orgMemberRef);

  // Delete from user's memberships
  const userMembershipRef = docs.userMembership(userId, orgId);
  batch.delete(userMembershipRef);

  await batch.commit();
}

/**
 * Count the number of members in an organization
 */
export async function getMemberCount(orgId: string): Promise<number> {
  const members = await getMembers(orgId);
  return members.length;
}

/**
 * Check if a user can be removed (prevent removing last owner)
 */
export async function canRemoveMember(
  orgId: string,
  userId: string
): Promise<{ canRemove: boolean; reason?: string }> {
  const member = await getMember(orgId, userId);

  if (!member) {
    return { canRemove: false, reason: "Member not found" };
  }

  // If not an owner, they can be removed
  if (member.role !== "owner") {
    return { canRemove: true };
  }

  // Count other owners
  const members = await getMembers(orgId);
  const ownerCount = members.filter((m) => m.role === "owner").length;

  if (ownerCount <= 1) {
    return {
      canRemove: false,
      reason: "Cannot remove the last owner of the organization",
    };
  }

  return { canRemove: true };
}

/**
 * Check if a user's role can be changed (prevent demoting last owner)
 */
export async function canChangeRole(
  orgId: string,
  userId: string,
  newRole: UserRole
): Promise<{ canChange: boolean; reason?: string }> {
  const member = await getMember(orgId, userId);

  if (!member) {
    return { canChange: false, reason: "Member not found" };
  }

  // If demoting from owner
  if (member.role === "owner" && newRole !== "owner") {
    const members = await getMembers(orgId);
    const ownerCount = members.filter((m) => m.role === "owner").length;

    if (ownerCount <= 1) {
      return {
        canChange: false,
        reason: "Cannot demote the last owner of the organization",
      };
    }
  }

  return { canChange: true };
}
