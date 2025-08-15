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

emailQueue.process("welcome-email", async (job) => {
  const { email, username, userId } = job.data;

  console.log(`processing welcome email for (${email})`);

  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log(
    `Welcome email sent to ${email} for user ${username} (ID: ${userId})`
  );

  return {
    status: 200,
    recipient: email,
    timestamp: new Date().toISOString(),
  };
});

fileProcessingQueue.process("file-upload", async (job) => {
  const { fileName, userId } = job.data;

  console.log(`Processing file upload for user ${userId}: ${fileName}`);

  await new Promise((resolve) => setTimeout(resolve, 3000));

  console.log(`File ${fileName} uploaded successfully for user ${userId}`);
  return {
    status: 200,
    message: `File ${fileName} uploaded successfully`,
    userId,
    timestamp: new Date().toISOString(),
  };
});

emailQueue.on("completed", (job, result) => {
  console.log(`Job completed with result: ${JSON.stringify(result)}`);
});

emailQueue.on("failed", (job, err) => {
  console.error(`Job failed with error: ${err.message}`);
});

fileProcessingQueue.on("completed", (job, result) => {
  console.log(`File processing job completed: ${JSON.stringify(result)}`);
});

fileProcessingQueue.on("failed", (job, err) => {
  console.error(`File processing job failed: ${err.message}`);
});

export const getQueueStats = async () => {
  const emailStats = {
    waiting: await emailQueue.getWaiting(),
    active: await emailQueue.getActive(),
    completed: await emailQueue.getCompleted(),
    failed: await emailQueue.getFailed(),
  };

  const fileStats = {
    waiting: await fileProcessingQueue.getWaiting(),
    active: await fileProcessingQueue.getActive(),
    completed: await fileProcessingQueue.getCompleted(),
    failed: await fileProcessingQueue.getFailed(),
  };

  return {
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
};
