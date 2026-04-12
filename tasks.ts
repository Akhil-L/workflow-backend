import { Router } from "express";

const router = Router();

// TEMP TASK STORAGE
let tasks: any[] = [];

// CREATE TASK
router.post("/tasks", (req, res) => {
  const { title, description, amount } = req.body;

  const newTask = {
    id: tasks.length + 1,
    title,
    description,
    amount,
    status: "open",
  };

  tasks.push(newTask);

  res.status(201).json({ task: newTask });
});

// GET TASKS
router.get("/tasks", (req, res) => {
  res.json({ tasks });
});

// ACCEPT TASK
router.post("/tasks/:id/accept", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = "assigned";

  res.json({ task });
});

// SUBMIT TASK
router.post("/tasks/:id/submit", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find(t => t.id === id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = "submitted";

  res.json({ task });
});

// REVIEW TASK
router.post("/tasks/:id/review", (req, res) => {
  const id = Number(req.params.id);
  const { action } = req.body;

  const task = tasks.find(t => t.id === id);

  if (!task) return res.status(404).json({ error: "Task not found" });

  task.status = action === "approve" ? "approved" : "rejected";

  res.json({ task });
});

export default router;
