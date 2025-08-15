// src/services/queueService.ts - TypeScript error düzeltilmiş
import Queue from "bull";

export const emailQueue = new Queue("email processing", {
  redis: {
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "localhost",
  },
});

export const fileProcessingQueue = new Queue("file processing", {
  redis: {
    port: parseInt(process.env.REDIS_PORT || "6379"),
    host: process.env.REDIS_HOST || "localhost",
  },
});

// Email worker - welcome email işleme
emailQueue.process("welcome-email", async (job) => {
  const { email, username, userId } = job.data;

  console.log(`📧 Processing welcome email for ${email} (User: ${username})`);

  // Email sending simulation (gerçekte SendGrid, Nodemailer vs. kullanırız)
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(`✅ Welcome email sent to ${email} for user ${username} (ID: ${userId})`);

  return {
    status: "sent",
    recipient: email,
    username,
    userId,
    timestamp: new Date().toISOString(),
  };
});

// File worker - dosya yükleme işleme
fileProcessingQueue.process("file-upload", async (job) => {
  const { fileName, userId, fileSize, fileType } = job.data;

  console.log(`📄 Processing file upload for user ${userId}: ${fileName} (${fileSize} bytes)`);

  // File processing simulation
  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(`✅ File ${fileName} uploaded successfully for user ${userId}`);

  return {
    status: "processed",
    fileName,
    fileSize,
    fileType,
    userId,
    timestamp: new Date().toISOString(),
  };
});

// Queue event handlers
emailQueue.on("completed", (job, result) => {
  console.log(`📧 Email job ${job.id} completed:`, {
    recipient: result.recipient,
    status: result.status,
    completedAt: result.timestamp
  });
});

emailQueue.on("failed", (job, err) => {
  console.error(`❌ Email job ${job.id} failed:`, err.message);
});

emailQueue.on("active", (job) => {
  console.log(`⚡ Email job ${job.id} started processing for ${job.data.email}`);
});

fileProcessingQueue.on("completed", (job, result) => {
  console.log(`📄 File processing job ${job.id} completed:`, {
    fileName: result.fileName,
    status: result.status,
    completedAt: result.timestamp
  });
});

fileProcessingQueue.on("failed", (job, err) => {
  console.error(`❌ File processing job ${job.id} failed:`, err.message);
});

fileProcessingQueue.on("active", (job) => {
  console.log(`⚡ File job ${job.id} started processing: ${job.data.fileName}`);
});

// Queue istatistikleri fonksiyonu
export const getQueueStats = async () => {
  try {
    // Email queue stats
    const emailStats = {
      waiting: await emailQueue.getWaiting(),
      active: await emailQueue.getActive(),
      completed: await emailQueue.getCompleted(),
      failed: await emailQueue.getFailed(),
    };

    // File queue stats
    const fileStats = {
      waiting: await fileProcessingQueue.getWaiting(),
      active: await fileProcessingQueue.getActive(),
      completed: await fileProcessingQueue.getCompleted(),
      failed: await fileProcessingQueue.getFailed(),
    };

    const stats = {
      email: {
        waiting: emailStats.waiting.length,
        active: emailStats.active.length,
        completed: emailStats.completed.length,
        failed: emailStats.failed.length,
      },
      files: {
        waiting: fileStats.waiting.length,
        active: fileStats.active.length,
        completed: fileStats.completed.length,
        failed: fileStats.failed.length,
      },
    };

    console.log("📊 Queue stats generated:", stats);
    return stats;
    
  } catch (error) {
    console.error("❌ Error getting queue stats:", error);
    throw error;
  }
};

// Kullanıcı email durumunu kontrol et - TypeScript error fix
export const getUserEmailStatus = async (userId: string) => {
  try {
    const completedJobs = await emailQueue.getCompleted();
    
    const userEmailJob = completedJobs.find(job => 
      job.data.userId === userId
    );

    // TypeScript error fix: finishedOn/processedOn undefined olabilir
    let emailSentAt: string | null = null;
    if (userEmailJob) {
      const timestamp = userEmailJob.finishedOn || userEmailJob.processedOn;
      if (timestamp) {
        emailSentAt = new Date(timestamp).toISOString();
      }
    }

    return {
      emailSent: !!userEmailJob,
      emailSentAt,
      jobId: userEmailJob?.id || null
    };
    
  } catch (error) {
    console.error("❌ Error checking user email status:", error);
    return {
      emailSent: false,
      emailSentAt: null,
      jobId: null
    };
  }
};

// File job ekle helper
export const addFileJob = async (fileData: {
  fileName: string;
  userId: string;
  fileSize: number;
  fileType: string;
}) => {
  try {
    const job = await fileProcessingQueue.add("file-upload", fileData, {
      delay: 500,
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 1000,
      },
    });

    console.log(`📄 File job added: ${fileData.fileName}, Job ID: ${job.id}`);
    return job;
    
  } catch (error) {
    console.error("❌ Error adding file job:", error);
    throw error;
  }
};