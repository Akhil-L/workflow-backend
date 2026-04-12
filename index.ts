import { Router } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import loginRouter from "./login";
import meRouter from "./me";
import logoutRouter from "./logout";
import tasksRouter from "./tasks";

const router = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(loginRouter);
router.use(meRouter);
router.use(logoutRouter);
router.use(tasksRouter);

export default router;
