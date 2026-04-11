import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { getSessionUser } from "../lib/session";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/me", async (req, res) => {
  const session = getSessionUser(req);
  if (!session) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      balance: usersTable.balance,
      created_at: usersTable.created_at,
    })
    .from(usersTable)
    .where(eq(usersTable.id, session.userId))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  res.status(200).json({ user });
});

export default router;
