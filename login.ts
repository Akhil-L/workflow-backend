import { Router } from "express";
import bcrypt from "bcryptjs";

const router = Router();

// TEMP USERS (no DB for now)
const users: any[] = [
  {
    id: 1,
    name: "Test User",
    email: "test@gmail.com",
    password_hash: bcrypt.hashSync("123456", 10),
    role: "worker",
    created_at: new Date(),
  },
];

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const user = users.find((u) => u.email === email);

  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const match = await bcrypt.compare(password, user.password_hash);

  if (!match) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  req.session.user = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  res.json({
    message: "Login successful",
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export default router;
