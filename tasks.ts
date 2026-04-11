import { Router, type IRouter } from "express";
import { db, tasksTable, usersTable } from "@workspace/db";
import { CreateTaskBody, SubmitTaskBody, ReviewTaskBody } from "@workspace/api-zod";
import { eq, sql } from "drizzle-orm";
import { getSessionUser } from "../lib/session";
import { requireAuth, requireAdmin, requireWorker } from "../middlewares/requireAuth";

const router: IRouter = Router();

// POST /tasks — create task (admin only)
router.post("/tasks", requireAdmin, async (req, res) => {
  const parsed = CreateTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const { title, description, amount } = parsed.data;

  const [task] = await db
    .insert(tasksTable)
    .values({ title, description, amount: String(amount) })
    .returning();

  res.status(201).json({ task });
});

// GET /tasks — list open tasks (authenticated)
router.get("/tasks", requireAuth, async (_req, res) => {
  const tasks = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.status, "open"));

  res.status(200).json({ tasks });
});

// POST /tasks/:id/accept — worker accepts an open task
router.post("/tasks/:id/accept", requireWorker, async (req, res) => {
  const session = getSessionUser(req)!;
  const taskId = Number(req.params.id);

  if (isNaN(taskId)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (task.status !== "open") {
    res.status(409).json({ error: "Task is already assigned or closed" });
    return;
  }

  const [updated] = await db
    .update(tasksTable)
    .set({ status: "assigned", assigned_to: session.userId })
    .where(eq(tasksTable.id, taskId))
    .returning();

  res.status(200).json({ task: updated });
});

// POST /tasks/:id/submit — assigned worker submits the task
router.post("/tasks/:id/submit", requireAuth, async (req, res) => {
  const session = getSessionUser(req)!;
  const taskId = Number(req.params.id);

  if (isNaN(taskId)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }

  const parsed = SubmitTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (task.status !== "assigned") {
    res.status(409).json({ error: "Task is not in assigned state" });
    return;
  }

  if (task.assigned_to !== session.userId) {
    res.status(403).json({ error: "Only the assigned worker can submit this task" });
    return;
  }

  const [updated] = await db
    .update(tasksTable)
    .set({ status: "submitted", submission_url: parsed.data.submission_url })
    .where(eq(tasksTable.id, taskId))
    .returning();

  res.status(200).json({ task: updated });
});

// POST /tasks/:id/review — admin approves or rejects a submitted task
router.post("/tasks/:id/review", requireAdmin, async (req, res) => {
  const taskId = Number(req.params.id);

  if (isNaN(taskId)) {
    res.status(400).json({ error: "Invalid task id" });
    return;
  }

  const parsed = ReviewTaskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
    return;
  }

  const [task] = await db
    .select()
    .from(tasksTable)
    .where(eq(tasksTable.id, taskId))
    .limit(1);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  if (task.status !== "submitted") {
    res.status(409).json({ error: "Task is not in submitted state" });
    return;
  }

  const newStatus = parsed.data.action === "approve" ? "approved" : "rejected";

  const [updated] = await db
    .update(tasksTable)
    .set({ status: newStatus })
    .where(eq(tasksTable.id, taskId))
    .returning();

  if (parsed.data.action === "approve" && task.assigned_to !== null) {
    await db
      .update(usersTable)
      .set({ balance: sql`${usersTable.balance} + ${task.amount}` })
      .where(eq(usersTable.id, task.assigned_to));
  }

  res.status(200).json({ task: updated });
});

export default router;
