import dotenv from "dotenv";
dotenv.config();
import app from "./app.js";
import compression from "compression";
import connectDB from "./utils/db.js";
import initializeCronJobs from "./cron/attendance.cron.js";

connectDB();

app.use(compression());

initializeCronJobs();

const PORT = process.env.PORT || 2035;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} bound to 0.0.0.0`);
});
