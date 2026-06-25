# Periodic Updates — Reference

Scope: any recurring or scheduled work for this site (digests, refreshes, cleanups, end-user-defined schedules, periodic notifications).

Forbidden: `setInterval`, `node-cron`, or any in-process timer. Cloud Run terminates idle instances; in-process timers will not survive.

---

## 1. Pick the right cron type

Two flavors. The difference is what runs at trigger time:

- **Heartbeat (HTTP cron).** Platform POSTs directly to `/api/scheduled/*` on this site. Your handler runs and returns. No agent spawned.
- **AGENT cron.** Platform spawns a fresh, isolated Manus session that runs the prompt you wrote at create time.

Decision: AGENT cron only if the trigger genuinely needs **agentic capabilities**. End-user-defined schedules are **always** Heartbeat.

Both flavors hit the **same** `/api/scheduled/*` endpoint with **same** auth shape: `sdk.authenticateRequest(req)` returns `user.isCron === true` with `user.taskUid` set.

---

## 2. Facts (apply to BOTH flavors)

1. Callback path **MUST** start with `/api/scheduled/`.
2. Add a `schedule_cron_task_uid varchar(65)` column (indexed, nullable) to business rows owning the job.
3. The site **must be deployed** before scheduling.
4. Wrap handler logic in try/catch and JSON-encode the error on 500.
5. Cron is **6-field** (with seconds): `sec min hour dom mon dow`, UTC, min interval 60s.
6. Handlers must be **idempotent**.
7. Handler timeout is 2 minutes per call.

---

## 3. End-user-driven Heartbeat

1. tRPC mutation calls `createHeartbeatJob(...)` and persists `taskUid`.
2. Express handler at `/api/scheduled/<name>` authenticates via `sdk.authenticateRequest`.
3. Mount with explicit `app.post("/api/scheduled/<name>", handler)` in `server/_core/index.ts`.

---

## 4. Variants

### 4a. Project-level Heartbeat (no end-user)
```bash
manus-heartbeat create --name nightly-cleanup --cron "0 0 3 * * *" --path /api/scheduled/cleanup
```

### 4b. AGENT cron
Created via the `schedule` tool inside this Manus session.

---

## 5. References

### 5a. Site SDK — `server/_core/heartbeat.ts`

```ts
createHeartbeatJob(job: HeartbeatJob, userSession: string)
getHeartbeatJob(taskUid: string, userSession: string)
updateHeartbeatJob(taskUid: string, patch: HeartbeatJobUpdate, userSession: string)
deleteHeartbeatJob(taskUid: string, userSession: string)
listHeartbeatJobs(userSession: string, pagination?)
```

### 5b. Sandbox CLI — `manus-heartbeat`

| Command | What |
| --- | --- |
| `create` | Create cron under project owner identity |
| `update` | Mutate cron by `--task-uid` |
| `delete` | Remove cron by `--task-uid` |
| `list` | List crons |
| `logs` | Recent execution history |
