import { and, desc, eq, gte, inArray, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  appointments,
  careGroupMembers,
  careGroups,
  documents,
  invitations,
  medicalLogs,
  notifications,
  tasks,
  timelineEvents,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUsersByIds(ids: number[]) {
  if (!ids.length) return [];
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(inArray(users.id, ids));
}

// ─── Care Groups ──────────────────────────────────────────────────────────────
export async function createCareGroup(data: {
  name: string;
  patientName: string;
  patientDob?: string;
  patientNotes?: string;
  createdByUserId: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(careGroups).values(data);
  return result.insertId as number;
}

export async function getCareGroupById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(careGroups).where(eq(careGroups.id, id)).limit(1);
  return result[0];
}

export async function updateCareGroup(
  id: number,
  data: Partial<{ name: string; patientName: string; patientDob: string; patientNotes: string }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(careGroups).set(data).where(eq(careGroups.id, id));
}

// ─── Care Group Members ───────────────────────────────────────────────────────
export async function addCareGroupMember(data: {
  careGroupId: number;
  userId: number;
  careRole: "family_member" | "patient" | "care_coordinator";
  displayName?: string;
  canEdit?: boolean;
  canInvite?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(careGroupMembers).values(data);
}

export async function getCareGroupsForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const memberships = await db
    .select()
    .from(careGroupMembers)
    .where(eq(careGroupMembers.userId, userId));
  if (!memberships.length) return [];
  const groupIds = memberships.map((m) => m.careGroupId);
  const groups = await db
    .select()
    .from(careGroups)
    .where(inArray(careGroups.id, groupIds));
  return groups.map((g) => ({
    ...g,
    membership: memberships.find((m) => m.careGroupId === g.id)!,
  }));
}

export async function getCareGroupMembers(careGroupId: number) {
  const db = await getDb();
  if (!db) return [];
  const members = await db
    .select()
    .from(careGroupMembers)
    .where(eq(careGroupMembers.careGroupId, careGroupId));
  if (!members.length) return [];
  const userIds = members.map((m) => m.userId);
  const userList = await getUsersByIds(userIds);
  return members.map((m) => ({
    ...m,
    user: userList.find((u) => u.id === m.userId),
  }));
}

export async function getMembership(careGroupId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(careGroupMembers)
    .where(
      and(
        eq(careGroupMembers.careGroupId, careGroupId),
        eq(careGroupMembers.userId, userId)
      )
    )
    .limit(1);
  return result[0];
}

export async function updateMemberRole(
  memberId: number,
  data: { careRole?: "family_member" | "patient" | "care_coordinator"; canEdit?: boolean; canInvite?: boolean }
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(careGroupMembers).set(data).where(eq(careGroupMembers.id, memberId));
}

export async function removeMember(memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(careGroupMembers).where(eq(careGroupMembers.id, memberId));
}

// ─── Invitations ──────────────────────────────────────────────────────────────
export async function createInvitation(data: {
  careGroupId: number;
  invitedByUserId: number;
  email: string;
  careRole: "family_member" | "patient" | "care_coordinator";
  token: string;
  expiresAt: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.insert(invitations).values(data);
}

export async function getInvitationByToken(token: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(invitations)
    .where(eq(invitations.token, token))
    .limit(1);
  return result[0];
}

export async function acceptInvitation(token: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(invitations).set({ accepted: true }).where(eq(invitations.token, token));
}

// ─── Appointments ─────────────────────────────────────────────────────────────
export async function createAppointment(data: {
  careGroupId: number;
  createdByUserId: number;
  title: string;
  category: "doctor" | "home_care" | "physiotherapy" | "pharmacy" | "hospital" | "other";
  description?: string;
  location?: string;
  startAt: number;
  endAt?: number;
  allDay?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(appointments).values(data);
  return result.insertId as number;
}

export async function getAppointments(careGroupId: number, fromMs?: number, toMs?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(appointments.careGroupId, careGroupId)];
  if (fromMs) conditions.push(gte(appointments.startAt, fromMs));
  if (toMs) conditions.push(lte(appointments.startAt, toMs));
  return db
    .select()
    .from(appointments)
    .where(and(...conditions))
    .orderBy(appointments.startAt);
}

export async function updateAppointment(
  id: number,
  data: Partial<{
    title: string;
    category: string;
    description: string;
    location: string;
    startAt: number;
    endAt: number;
    allDay: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(appointments).set(data as any).where(eq(appointments.id, id));
}

export async function deleteAppointment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(appointments).where(eq(appointments.id, id));
}

// ─── Medical Logs ─────────────────────────────────────────────────────────────
export async function createMedicalLog(data: {
  careGroupId: number;
  loggedByUserId: number;
  entryType: "medication" | "symptom" | "vital" | "wellbeing" | "note";
  title: string;
  body?: string;
  vitalSystolic?: number;
  vitalDiastolic?: number;
  vitalPulse?: number;
  vitalTemp?: string;
  vitalWeight?: string;
  vitalOxygen?: number;
  medicationName?: string;
  medicationDose?: string;
  medicationGiven?: boolean;
  severity?: number;
  recordedAt: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(medicalLogs).values(data);
  return result.insertId as number;
}

export async function getMedicalLogs(careGroupId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(medicalLogs)
    .where(eq(medicalLogs.careGroupId, careGroupId))
    .orderBy(desc(medicalLogs.recordedAt))
    .limit(limit);
}

export async function deleteMedicalLog(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(medicalLogs).where(eq(medicalLogs.id, id));
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function createTask(data: {
  careGroupId: number;
  createdByUserId: number;
  assignedToUserId?: number;
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueAt?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(tasks).values(data);
  return result.insertId as number;
}

export async function getTasks(careGroupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.careGroupId, careGroupId))
    .orderBy(desc(tasks.createdAt));
}

export async function updateTask(
  id: number,
  data: Partial<{
    title: string;
    description: string;
    assignedToUserId: number | null;
    priority: "low" | "medium" | "high";
    status: "pending" | "in_progress" | "done";
    dueAt: number | null;
    completedAt: number | null;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(tasks).set(data as any).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ─── Documents ────────────────────────────────────────────────────────────────
export async function createDocument(data: {
  careGroupId: number;
  uploadedByUserId: number;
  title: string;
  category: "prescription" | "power_of_attorney" | "medical_report" | "lab_result" | "referral" | "other";
  description?: string;
  fileName: string;
  fileKey: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(documents).values(data);
  return result.insertId as number;
}

export async function getDocuments(careGroupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(documents)
    .where(eq(documents.careGroupId, careGroupId))
    .orderBy(desc(documents.createdAt));
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(documents).where(eq(documents.id, id));
}

// ─── Timeline Events ──────────────────────────────────────────────────────────
export async function createTimelineEvent(data: {
  careGroupId: number;
  createdByUserId: number;
  eventType:
    | "diagnosis"
    | "treatment"
    | "surgery"
    | "hospitalization"
    | "medication_start"
    | "medication_stop"
    | "test_result"
    | "milestone"
    | "note";
  title: string;
  body?: string;
  provider?: string;
  icdCode?: string;
  eventDate: number;
  isKeyEvent?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const [result] = await db.insert(timelineEvents).values(data);
  return result.insertId as number;
}

export async function getTimelineEvents(careGroupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.careGroupId, careGroupId))
    .orderBy(desc(timelineEvents.eventDate));
}

export async function updateTimelineEvent(
  id: number,
  data: Partial<{
    title: string;
    body: string;
    provider: string;
    icdCode: string;
    eventDate: number;
    isKeyEvent: boolean;
    eventType: string;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(timelineEvents).set(data as any).where(eq(timelineEvents.id, id));
}

export async function deleteTimelineEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
}

// ─── Notifications ────────────────────────────────────────────────────────────
export async function createNotification(data: {
  userId: number;
  careGroupId?: number;
  type: "appointment" | "task_assigned" | "medical_log" | "document" | "invitation" | "general";
  title: string;
  body?: string;
  linkPath?: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotifications(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result.length;
}

// ─── Bulk helpers for notifications to all group members ─────────────────────
export async function notifyGroupMembers(
  careGroupId: number,
  excludeUserId: number,
  notification: {
    type: "appointment" | "task_assigned" | "medical_log" | "document" | "invitation" | "general";
    title: string;
    body?: string;
    linkPath?: string;
  }
) {
  const db = await getDb();
  if (!db) return;
  const members = await db
    .select()
    .from(careGroupMembers)
    .where(eq(careGroupMembers.careGroupId, careGroupId));
  const targets = members.filter((m) => m.userId !== excludeUserId);
  if (!targets.length) return;
  await db.insert(notifications).values(
    targets.map((m) => ({
      userId: m.userId,
      careGroupId,
      ...notification,
    }))
  );
}
