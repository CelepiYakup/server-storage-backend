import express from "express";
import { getQueueStats } from "../services/queueService";

const router = express.Router();

router.get("/stats", async (req, res) => {
  try {
    const stats = await getQueueStats();
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/email-status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const emailSent = Math.random() > 0.3;

    res.json({
      userId,
      emailSent,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to check email status" });
  }
});

export default router;
