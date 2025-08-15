
import express, { Request, Response } from "express";
import { getQueueStats, emailQueue } from "../services/queueService";

const router = express.Router();

router.get("/stats", async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getQueueStats();
    console.log("Queue stats:", stats);
    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching queue stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/email-status/:userId", async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    console.log(`📧 Checking real email status for user: ${userId}`);
    const completedJobs = await emailQueue.getCompleted();
    
    const userEmailJob = completedJobs.find(job => 
      job.data.userId === userId && job.data.email
    );

    const emailSent = !!userEmailJob;
  
    let emailSentAt: string | null = null;
    if (userEmailJob) {
      const timestamp = userEmailJob.finishedOn || userEmailJob.processedOn;
      if (timestamp) {
        emailSentAt = new Date(timestamp).toISOString();
      }
    }

    console.log(`Email status for user ${userId}:`, { emailSent, emailSentAt });

    res.json({
      userId,
      emailSent,
      emailSentAt,
      jobId: userEmailJob?.id || null,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error checking email status:", error);
    res.status(500).json({ message: "Failed to check email status" });
  }
});


router.post("/test-email", async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, username, userId } = req.body;
    
    if (!email || !username || !userId) {
      res.status(400).json({ 
        message: "Missing required fields: email, username, userId" 
      });
      return;
    }

    console.log(`🧪 Adding test email job for ${email}`);
    
    const job = await emailQueue.add("welcome-email", {
      email,
      username,
      userId
    }, {
      delay: 1000,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });

    res.json({
      message: "Test email job added to queue",
      jobId: job.id,
      email,
      userId,
      queuedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding test email job:", error);
    res.status(500).json({ message: "Failed to add test email job" });
  }
});

router.get("/health", async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await getQueueStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      queues: {
        email: 'operational',
        files: 'operational'
      },
      stats
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Queue health check failed:", error);
    res.status(500).json({
      status: 'unhealthy',
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;