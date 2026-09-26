import express, { application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import { protect } from "./middleware/auth.middleware.js";
import panchayatRoutes from "./routes/panchayat.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import companyRoutes from "./routes/company.routes.js";
import path from "path";
import employeeRoutes from "./routes/employee.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import dustbinRoutes from "./routes/dustbin.routes.js";
import householdRoutes from "./routes/household.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import routeRoutes from "./routes/route.routes.js";
import contentRoutes from "./routes/content.routes.js";
import wasteDataRoutes from "./routes/wasteData.routes.js";
import reportRoutes from "./routes/report.routes.js";
import wardRoutes from "./routes/ward.routes.js";
import searchRoutes from "./routes/search.routes.js";
import userRoutes from "./routes/user.routes.js";
import employeeAppRoutes from "./routes/employee.app.routes.js";
import contactQueryRoutes from "./routes/contactQuery.routes.js";
import scheduleBookingRoutes from "./routes/scheduleBooking.routes.js";
import notificationRoutes from "./routes/notification.routes.js";


const app = express();
app.set("trust proxy", 1); // Allow secure cookies behind proxy (e.g., Render)
app.use(express.json());
app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const corsOptions = {
  origin: true,
  credentials: true,
}
app.use(cors(corsOptions));

app.get("/", (req, res) => {
  return res.status(200).json({
    message: "API is running...",
    success: true
  });
});
app.use("/api/panchayat", panchayatRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/dustbins", dustbinRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/households", householdRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/waste-data", wasteDataRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", userRoutes);
app.use("/api/employee", employeeAppRoutes);
app.use("/api/contact-queries", contactQueryRoutes);
app.use("/api/schedule-bookings", scheduleBookingRoutes);
app.use("/api/notifications", notificationRoutes);



export default app;
