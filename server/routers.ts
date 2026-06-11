import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { storagePut } from "./storage";
import * as db from "./db";

// ─── Auth ─────────────────────────────────────────────────────────────────────
const authRouter = router({
  me: publicProcedure.query((opts) => opts.ctx.user),
  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    return { success: true } as const;
  }),
});

// ─── Care Groups ──────────────────────────────────────────────────────────────
const careGroupsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getCareGroupsForUser(ctx.user.id);
  }),

  get: protectedProcedure
    .input(z.object({ careGroupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      const group = await db.getCareGroupById(input.careGroupId);
      if (!group) throw new TRPCError({ code: "NOT_FOUND" });
      return { group, membership };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        patientName: z.string().min(1).max(255),
        patientDob: z.string().optional(),
        patientNotes: z.string().optional(),
        myRole: z.enum(["family_member", "patient", "care_coordinator"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const groupId = await db.createCareGroup({
        name: input.name,
        patientName: input.patientName,
        patientDob: input.patientDob,
        patientNotes: input.patientNotes,
        createdByUserId: ctx.user.id,
      });
      await db.addCareGroupMember({
        careGroupId: groupId,
        userId: ctx.user.id,
        careRole: input.myRole,
        displayName: ctx.user.name ?? undefined,
        canEdit: true,
        canInvite: true,
      });
      return { careGroupId: groupId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        name: z.string().min(1).max(255).optional(),
        patientName: z.string().min(1).max(255).optional(),
        patientDob: z.string().optional(),
        patientNotes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const { careGroupId, ...data } = input;
      await db.updateCareGroup(careGroupId, data);
      return { success: true };
    }),

  members: protectedProcedure
    .input(z.object({ careGroupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getCareGroupMembers(input.careGroupId);
    }),

  updateMember: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        memberId: z.number(),
        careRole: z.enum(["family_member", "patient", "care_coordinator"]).optional(),
        canEdit: z.boolean().optional(),
        canInvite: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const { memberId, careGroupId: _cg, ...data } = input;
      await db.updateMemberRole(memberId, data);
      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(z.object({ careGroupId: z.number(), memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      await db.removeMember(input.memberId);
      return { success: true };
    }),

  invite: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        email: z.string().email(),
        careRole: z.enum(["family_member", "patient", "care_coordinator"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canInvite) throw new TRPCError({ code: "FORBIDDEN" });
      const token = nanoid(32);
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await db.createInvitation({
        careGroupId: input.careGroupId,
        invitedByUserId: ctx.user.id,
        email: input.email,
        careRole: input.careRole,
        token,
        expiresAt,
      });
      return { token, expiresAt };
    }),

  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invitation = await db.getInvitationByToken(input.token);
      if (!invitation) throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      if (invitation.accepted) throw new TRPCError({ code: "BAD_REQUEST", message: "Already accepted" });
      if (new Date(invitation.expiresAt) < new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation expired" });
      const existing = await db.getMembership(invitation.careGroupId, ctx.user.id);
      if (!existing) {
        await db.addCareGroupMember({
          careGroupId: invitation.careGroupId,
          userId: ctx.user.id,
          careRole: invitation.careRole,
          displayName: ctx.user.name ?? undefined,
        });
      }
      await db.acceptInvitation(input.token);
      return { careGroupId: invitation.careGroupId };
    }),
});

// ─── Appointments ─────────────────────────────────────────────────────────────
const appointmentsRouter = router({
  list: protectedProcedure
    .input(z.object({ careGroupId: z.number(), fromMs: z.number().optional(), toMs: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getAppointments(input.careGroupId, input.fromMs, input.toMs);
    }),

  create: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        title: z.string().min(1).max(255),
        category: z.enum(["doctor", "home_care", "physiotherapy", "pharmacy", "hospital", "other"]),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.number(),
        endAt: z.number().optional(),
        allDay: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await db.createAppointment({ ...input, createdByUserId: ctx.user.id });
      await db.notifyGroupMembers(input.careGroupId, ctx.user.id, {
        type: "appointment",
        title: `Ny avtale: ${input.title}`,
        body: `Lagt til av ${ctx.user.name ?? "et teammedlem"}`,
        linkPath: `/group/${input.careGroupId}/calendar`,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        careGroupId: z.number(),
        title: z.string().min(1).max(255).optional(),
        category: z.enum(["doctor", "home_care", "physiotherapy", "pharmacy", "hospital", "other"]).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.number().optional(),
        endAt: z.number().optional(),
        allDay: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, careGroupId: _cg, ...data } = input;
      await db.updateAppointment(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), careGroupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteAppointment(input.id);
      return { success: true };
    }),
});

// ─── Medical Logs ─────────────────────────────────────────────────────────────
const medicalLogsRouter = router({
  list: protectedProcedure
    .input(z.object({ careGroupId: z.number(), limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getMedicalLogs(input.careGroupId, input.limit);
    }),

  create: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        entryType: z.enum(["medication", "symptom", "vital", "wellbeing", "note"]),
        title: z.string().min(1).max(255),
        body: z.string().optional(),
        vitalSystolic: z.number().optional(),
        vitalDiastolic: z.number().optional(),
        vitalPulse: z.number().optional(),
        vitalTemp: z.string().optional(),
        vitalWeight: z.string().optional(),
        vitalOxygen: z.number().optional(),
        medicationName: z.string().optional(),
        medicationDose: z.string().optional(),
        medicationGiven: z.boolean().optional(),
        severity: z.number().min(1).max(5).optional(),
        recordedAt: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await db.createMedicalLog({ ...input, loggedByUserId: ctx.user.id });
      await db.notifyGroupMembers(input.careGroupId, ctx.user.id, {
        type: "medical_log",
        title: `Ny loggoppføring: ${input.title}`,
        body: `Registrert av ${ctx.user.name ?? "et teammedlem"}`,
        linkPath: `/group/${input.careGroupId}/log`,
      });
      return { id };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), careGroupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteMedicalLog(input.id);
      return { success: true };
    }),
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
const tasksRouter = router({
  list: protectedProcedure
    .input(z.object({ careGroupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getTasks(input.careGroupId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        assignedToUserId: z.number().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        dueAt: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await db.createTask({ ...input, createdByUserId: ctx.user.id });
      if (input.assignedToUserId && input.assignedToUserId !== ctx.user.id) {
        await db.createNotification({
          userId: input.assignedToUserId,
          careGroupId: input.careGroupId,
          type: "task_assigned",
          title: `Ny oppgave tildelt: ${input.title}`,
          body: `Tildelt av ${ctx.user.name ?? "et teammedlem"}`,
          linkPath: `/group/${input.careGroupId}/tasks`,
        });
      }
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        careGroupId: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        assignedToUserId: z.number().nullable().optional(),
        priority: z.enum(["low", "medium", "high"]).optional(),
        status: z.enum(["pending", "in_progress", "done"]).optional(),
        dueAt: z.number().nullable().optional(),
        completedAt: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, careGroupId: _cg, ...data } = input;
      await db.updateTask(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), careGroupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteTask(input.id);
      return { success: true };
    }),
});

// ─── Documents ────────────────────────────────────────────────────────────────
const documentsRouter = router({
  list: protectedProcedure
    .input(z.object({ careGroupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getDocuments(input.careGroupId);
    }),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        title: z.string(),
        category: z.enum(["prescription", "power_of_attorney", "medical_report", "lab_result", "referral", "other"]),
        description: z.string().optional(),
        fileData: z.string(), // base64
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const buffer = Buffer.from(input.fileData, "base64");
      const fileKey = `care-groups/${input.careGroupId}/docs/${nanoid()}-${input.fileName}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      const docId = await db.createDocument({
        careGroupId: input.careGroupId,
        uploadedByUserId: ctx.user.id,
        title: input.title,
        category: input.category,
        description: input.description,
        fileName: input.fileName,
        fileKey,
        fileUrl: url,
        mimeType: input.mimeType,
        fileSize: input.fileSize,
      });
      await db.notifyGroupMembers(input.careGroupId, ctx.user.id, {
        type: "document",
        title: `Nytt dokument: ${input.title}`,
        body: `Lastet opp av ${ctx.user.name ?? "et teammedlem"}`,
        linkPath: `/group/${input.careGroupId}/documents`,
      });
      return { id: docId, url };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), careGroupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteDocument(input.id);
      return { success: true };
    }),
});

// ─── Timeline ─────────────────────────────────────────────────────────────────
const timelineRouter = router({
  list: protectedProcedure
    .input(z.object({ careGroupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership) throw new TRPCError({ code: "FORBIDDEN" });
      return db.getTimelineEvents(input.careGroupId);
    }),

  create: protectedProcedure
    .input(
      z.object({
        careGroupId: z.number(),
        eventType: z.enum([
          "diagnosis", "treatment", "surgery", "hospitalization",
          "medication_start", "medication_stop", "test_result", "milestone", "note",
        ]),
        title: z.string().min(1).max(255),
        body: z.string().optional(),
        provider: z.string().optional(),
        icdCode: z.string().optional(),
        eventDate: z.number(),
        isKeyEvent: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const id = await db.createTimelineEvent({ ...input, createdByUserId: ctx.user.id });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        careGroupId: z.number(),
        title: z.string().optional(),
        body: z.string().optional(),
        provider: z.string().optional(),
        icdCode: z.string().optional(),
        eventDate: z.number().optional(),
        isKeyEvent: z.boolean().optional(),
        eventType: z.enum([
          "diagnosis", "treatment", "surgery", "hospitalization",
          "medication_start", "medication_stop", "test_result", "milestone", "note",
        ]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      const { id, careGroupId: _cg, ...data } = input;
      await db.updateTimelineEvent(id, data);
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number(), careGroupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const membership = await db.getMembership(input.careGroupId, ctx.user.id);
      if (!membership?.canEdit) throw new TRPCError({ code: "FORBIDDEN" });
      await db.deleteTimelineEvent(input.id);
      return { success: true };
    }),
});

// ─── Notifications ────────────────────────────────────────────────────────────
const notificationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return db.getNotifications(ctx.user.id);
  }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    return db.getUnreadNotificationCount(ctx.user.id);
  }),

  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markNotificationsRead(ctx.user.id);
    return { success: true };
  }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  careGroups: careGroupsRouter,
  appointments: appointmentsRouter,
  medicalLogs: medicalLogsRouter,
  tasks: tasksRouter,
  documents: documentsRouter,
  timeline: timelineRouter,
  notifications: notificationsRouter,
});

export type AppRouter = typeof appRouter;
