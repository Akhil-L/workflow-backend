import express, { type Express } from "express";
import cors from "cors";
import session from "express-session";
import router from "./routes";

const app: Express = express();

// ✅ CORS FIX
app.use(
  cors({
    origin: "https://chimerical-entremet-f7bdf1.netlify.app",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ SESSION FIX
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,          // 🔥 IMPORTANT (must be true in production)
      sameSite: "none",      // 🔥 IMPORTANT (for cross-origin)
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use("/api", router);

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

export default app;
