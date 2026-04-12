import { Router } from "express";

const router = Router();

router.get("/me", (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  res.json({
    user: req.session.user,
  });
});

export default router;
