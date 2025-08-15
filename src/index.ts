import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import userRoutes from "./routes/userRoutes";
import { pool, initializeDatabase } from "./config/db";
import queRoute from "./routes/queRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.use("/api/users", userRoutes);
app.use("/api/queue", queRoute);

const waitForPostgres = async (retries = 10, delayMs = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query("SELECT 1");
      console.log("PostgreSQL is ready");
      return;
    } catch (err) {
      console.log(
        `⏳ Postgres not ready (${i + 1}/${retries}), retrying in ${delayMs}ms`
      );
      await new Promise((res) => setTimeout(res, delayMs));
    }
  }
  throw new Error(" PostgreSQL did not become ready in time");
};

const startServer = async () => {
  try {
    await waitForPostgres();
    console.log("Connected to PostgreSQL database");

    await pool.connect();
    console.log("Connected to PostgreSQL database");

    await initializeDatabase();
    console.log("Database schema initialized");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
