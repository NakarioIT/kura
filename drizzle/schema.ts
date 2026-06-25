import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Care Groups ──────────────────────────────────────────────────────────────
export const careGroups = mysqlTable("care_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  patientName: varchar("patientName", { length: 255 }).notNull(),
  patientDob: varchar("patientDob", { length: 20 }),
  patientNotes: text("patientNotes"),
  createdByUserId: int("createdByUserId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CareGroup = typeof careGroups.$inferSelect;
export type InsertCareGroup = typeof careGroups.$inferInsert;

// ─── Care Group Members ───────────────────────────────────────────────────────
export const careGroupMembers = mysqlTable("care_group_members", {
  id: int("id").autoincrement().primaryKey(),
  careGroupId: int("careGroupId").notNull(),
  userId: int("userId").notNull(),
  careRole: mysqlEnum("careRole", ["family_member", "patient", "care_coordinator"]).notNull(),
  displayName: varchar("displayName", { length: 255 }),
  canEdit: boolean("canEdit").default(true).notNull(),
  canInvite: boolean("canInvite").default(false).notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type CareGroupMember = typeof careGroupMembers.$inferSelect;
export type InsertCareGroupMember = typeof careGroupMembers.$inferInsert;

// ─── Invitations ─────────────────────────────────────────────────────────────
export const invitations = mysqlTable("invitations", {
  id: int("id").autoincrement().primaryKey(),
  careGroupId: int("careGroupId").notNull(),
  invitedByUserId: int("invitedByUserId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  careRole: mysqlEnum("careRole", ["family_member", "patient", "care_coordinator"]).notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  accepted: boolean("accepted").default(false).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Invitation = typeof invitations.$inferSelect;
export type InsertInvitation = typeof invitations.$inferInsert;

// ─── Appointments ─────────────────────────────────────────────────────────────
export const appointments = mysqlTable("appointments", {
  id: int("id").autoincrement().primaryKey(),
  careGroupId: int("careGroupId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["doctor", "home_care", "physiotherapy", "pharmacy", "hospital", "other"]).notNull(),
  description: text("description"),
  location: varchar("location", { length: 255 }),
  startAt: bigint("startAt", { mode: "number" }).notNull(),
  endAt: bigint("endAt", { mode: "number" }),
  allDay: boolean("allDay").default(false).notNull(),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

// ─── Medical Log ──────────────────────────────────────────────────────────────
export const medicalLogs = mysqlTable("medical_logs", {
  id: int("id").autoincrement().primaryKey(),
  careGroupId: int("careGroupId").notNull(),
  loggedByUserId: int("loggedByUserId").notNull(),
  entryType: mysqlEnum("entryType", ["medication", "symptom", "vital", "wellbeing", "note"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  vitalSystolic: int("vitalSystolic"),
  vitalDiastolic: int("vitalDiastolic"),
  vitalPulse: int("vitalPulse"),
  vitalTemp: varchar("vitalTemp", { length: 10 }),
  vitalWeight: varchar("vitalWeight", { length: 10 }),
  vitalOxygen: int("vitalOxygen"),
  medicationName: varchar("medicationName", { length: 255 }),
  medicationDose: varchar("medicationDose", { length: 100 }),
  medicationGiven: boolean("medicationGiven"),
  severity: int("severity"),
  recordedAt: bigint("recordedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MedicalLog = typeof medicalLogs.$inferSelect;
export type InsertMedicalLog = typeof medicalLogs.$inferInsert;

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  careGroupId: int("careGroupId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  assignedToUserId: int("assignedToUserId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "done"]).default("pending").notNull(),
  dueAt: bigint("dueAt", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Documents ────────────────────────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  careGroupId: int("careGroupId").notNull(),
  uploadedByUserId: int("uploadedByUserId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["prescription", "power_of_attorney", "medical_report", "lab_result", "referral", "other"]).notNull(),
  description: text("description"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 1024 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── Timeline Events ──────────────────────────────────────────────────────────
export const timelineEvents = mysqlTable("timeline_events", {
  id: int("id").autoincrement().primaryKey(),
  careGroupId: int("careGroupId").notNull(),
  createdByUserId: int("createdByUserId").notNull(),
  eventType: mysqlEnum("eventType", ["diagnosis", "treatment", "surgery", "hospitalization", "medication_start", "medication_stop", "test_result", "milestone", "note"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  provider: varchar("provider", { length: 255 }),
  icdCode: varchar("icdCode", { length: 20 }),
  eventDate: bigint("eventDate", { mode: "number" }).notNull(),
  isKeyEvent: boolean("isKeyEvent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = typeof timelineEvents.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  careGroupId: int("careGroupId"),
  type: mysqlEnum("type", ["appointment", "task_assigned", "medical_log", "document", "invitation", "general"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  linkPath: varchar("linkPath", { length: 512 }),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
