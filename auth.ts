import { Router } from "express";
import bcrypt from "bcryptjs";

const router = Router();

// TEMP USERS (shared in-memory)
const users: any[] = [];

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const existingUser = users.find((u) => u.email === email);

  if (existingUser) {
    return res.status(409).json({ error: "Email already exists" });
  }

  const password_hash = await bcrypt.hash(password, 10);

  const newUser = {
    id: users.length + 1,
    name,
    email,
    password_hash,
    role: role || "worker",
    created_at: new Date(),
  };

  users.push(newUser);

  res.status(201).json({
    message: "User created successfully",
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  });
});

export default router;
