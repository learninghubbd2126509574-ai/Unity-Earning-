import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs/promises";
import { Submission } from "./src/types";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const DATA_FILE = path.join(process.cwd(), "data", "submissions.json");

  // Ensure data directory exists
  try {
    await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
    try {
      await fs.access(DATA_FILE);
    } catch {
      await fs.writeFile(DATA_FILE, JSON.stringify([]));
    }
  } catch (err) {
    console.error("Error creating data directory", err);
  }

  // API Routes
  app.post("/api/check-limit", async (req, res) => {
    const { whatsappNumber } = req.body;
    if (whatsappNumber) {
      try {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        const submissions: Submission[] = JSON.parse(data);
        
        // Check 24h limit by WhatsApp Number
        const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recentSubmissions = submissions.filter(s => 
          s.userInfo.whatsappNumber === whatsappNumber && 
          new Date(s.submittedAt!).getTime() > oneDayAgo
        );

        if (recentSubmissions.length >= 2) {
          return res.status(403).json({ 
            allowed: false, 
            message: "আপনি ২৪ ঘন্টার মধ্যে সর্বোচ্চ ২ বার কাজ জমা দিতে পারবেন। দয়া করে ২৪ ঘন্টা পর আবার চেষ্টা করুন।" 
          });
        }

        res.json({ allowed: true });
      } catch (err) {
        res.status(500).json({ allowed: false, message: "Server error." });
      }
    } else {
      res.status(400).json({ allowed: false, message: "WhatsApp number is required." });
    }
  });

  app.post("/api/submit", async (req, res) => {
    try {
      const submission: Submission = req.body;
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const submissions: Submission[] = JSON.parse(data);
      
      // Check 24h limit again on submission by WhatsApp Number
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const recentSubmissions = submissions.filter(s => 
        s.userInfo.whatsappNumber === submission.userInfo.whatsappNumber && 
        new Date(s.submittedAt!).getTime() > oneDayAgo
      );

      if (recentSubmissions.length >= 2) {
        return res.status(403).json({ 
          message: "আপনি ২৪ ঘন্টার মধ্যে সর্বোচ্চ ২ বার কাজ জমা দিতে পারবেন। দয়া করে ২৪ ঘন্টা পর আবার চেষ্টা করুন।" 
        });
      }

      submissions.push({
        ...submission,
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        status: "Pending"
      });

      await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to save submission." });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { id, password } = req.body;
    if (id === "admin" && password === "666999") {
      res.json({ success: true, token: "mock-token-123" });
    } else {
      res.status(401).json({ message: "Invalid credentials." });
    }
  });

  app.get("/api/admin/submissions", async (req, res) => {
    try {
      const data = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(data));
    } catch (err) {
      res.status(500).json({ message: "Failed to load submissions." });
    }
  });

  app.post("/api/admin/update-status", async (req, res) => {
    try {
      const { id, status, reason } = req.body;
      const data = await fs.readFile(DATA_FILE, "utf-8");
      const submissions: Submission[] = JSON.parse(data);
      
      const index = submissions.findIndex(s => s.id === id);
      if (index !== -1) {
        submissions[index].status = status;
        if (reason) submissions[index].rejectionReason = reason;
        await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2));
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Submission not found." });
      }
    } catch (err) {
      res.status(500).json({ message: "Failed to update status." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
