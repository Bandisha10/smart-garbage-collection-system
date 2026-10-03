import User from "../models/User.model.js";
import Panchayat from "../models/Panchayat.model.js";
import Employee from "../models/Employee.model.js";
import Household from "../models/Household.model.js";
import Company from "../models/company.model.js";
import { generateOTP, verifyOTP } from "../utils/otpService.js";
import { generateToken } from "../utils/jwt.js";

/**
 * Send OTP
 */
export const sendOtp = async (req, res) => {
  const { mobile, type, panchayatId } = req.body;

  if (!mobile) {
    return res.status(400).json({
      message: "Mobile number required",
      success: false,
    });
  }

  // 🔹 EMPLOYEE LOGIN CHECK
  if (type === "employee") {
    if (!panchayatId) {
      return res.status(400).json({
        message: "Panchayat selection is required",
        success: false,
      });
    }

    const employee = await Employee.findOne({
      phone: mobile,
      panchayat: panchayatId,
      status: "active"
    });

    if (!employee) {
      return res.status(404).json({
        message: "Active employee not found for this Panchayat",
        success: false,
      });
    }
  } else if (type === "household") {
    const household = await Household.findOne({ mobile, panchayat: panchayatId });
    if (!household) {
      return res.status(404).json({
        message: "Household not found for this mobile and Panchayat",
        success: false
      });
    }
    if (household.status === "Pending") {
      return res.status(403).json({
        message: "Your registration is pending approval. Please contact your Panchayat office to get your account activated.",
        success: false,
        statusCode: "PENDING"
      });
    }
    if (household.status === "Rejected") {
      return res.status(403).json({
        message: "Your registration was rejected. Please visit your Panchayat office for assistance.",
        success: false,
        statusCode: "REJECTED"
      });
    }
  } else if (type === "company") {
    const company = await Company.findOne({ contactPhone: mobile, panchayat: panchayatId });
    if (!company) {
      return res.status(404).json({
        message: "Company not found for this mobile and Panchayat",
        success: false
      });
    }
  }

  const otp = generateOTP(mobile);

  return res.status(200).json({
    message: "OTP sent successfully",
    success: true,
    otp, // 👈 Send OTP to frontend for toast
  });
};

/**
 * Verify OTP & Login
 */
export const verifyOtpAndLogin = async (req, res) => {
  const { mobile, otp, type, panchayatId } = req.body;

  // 1️⃣ Verify OTP (Ensure string comparison)
  if (!verifyOTP(String(mobile), String(otp))) {
    return res.status(401).json({
      message: "Invalid OTP",
      success: false,
    });
  }

  let user = null;
  let role = "USER"; // Default

  // 🔹 EMPLOYEE LOGIN
  if (type === "employee") {
    if (!panchayatId) {
      return res.status(400).json({ message: "Panchayat ID required" });
    }

    const employee = await Employee.findOne({
      phone: mobile,
      panchayat: panchayatId,
      status: "active"
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee not found or inactive" });
    }

    user = {
      _id: employee._id,
      name: employee.name,
      role: "EMPLOYEE", // Or employee.role if specific roles exist
      panchayatId: employee.panchayat,
      wards: employee.wards || (employee.ward ? [employee.ward] : [])
    };
    role = "EMPLOYEE";

  } else if (type === "household") {
    const household = await Household.findOne({ mobile, panchayat: panchayatId });
    if (!household) {
      return res.status(404).json({ message: "Household not found" });
    }
    user = {
      _id: household._id,
      name: household.ownerName,
      role: "HOUSEHOLD",
      panchayatId: household.panchayat
    };
    role = "HOUSEHOLD";
  } else if (type === "company") {
    const company = await Company.findOne({ contactPhone: mobile, panchayat: panchayatId });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    user = {
      _id: company._id,
      name: company.name,
      role: "COMPANY",
      panchayatId: company.panchayat
    };
    role = "COMPANY";
  } else {
    // 2️⃣ Try Normal User login
    user = await User.findOne({ mobile });

    if (user) {
      role = user.role;
    } else {
      // 3️⃣ Fallback → Panchayat ADMIN
      const panchayat = await Panchayat.findOne({
        contactPhone: mobile,
        status: "active",
      });

      if (panchayat) {
        user = {
          _id: panchayat._id,
          name: panchayat.name,
          role: "PANCHAYAT_ADMIN",
          panchayatId: panchayat._id,
        };
        role = "PANCHAYAT_ADMIN";
      }
    }
  }

  if (!user) {
    return res.status(404).json({
      message: "User not found",
      success: false,
    });
  }

  // 4️⃣ Generate JWT
  const token = generateToken({
    userId: user._id,
    role: role,
    panchayatId: user.panchayatId,
    wards: user.wards || []
  });

  // 5️⃣ Set cookie
  const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || process.env.RENDER_SERVICE_ID || Boolean(process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith("https"));
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd, // Secure only in production/render/HTTPS
    sameSite: isProd ? "none" : "lax", // none for cross-site prod, lax for localhost
    maxAge: 24 * 60 * 60 * 1000, // 1 day
  });

  // 6️⃣ Response
  return res.status(200).json({
    message: "Login successful",
    success: true,
    token, // Return token for mobile app
    user: {
      id: user._id,
      name: user.name,
      role: role,
      panchayatId: user.panchayatId,
    },
  });
};

/**
 * Logout
 */
export const logout = (req, res) => {
  const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true" || process.env.RENDER_SERVICE_ID || Boolean(process.env.BACKEND_URL && process.env.BACKEND_URL.startsWith("https"));
  return res
    .clearCookie("token", {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    })
    .status(200)
    .json({
      message: "Logout successful",
      success: true,
    });
};

/**
 * Check session
 */
export const checkSession = (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      role: req.user.role,
      panchayatId: req.user.panchayatId,
    },
  });
};

export const getProfile = async (req, res) => {
  const panchayat = await Panchayat.findById(req.user.panchayatId)
    .populate("subscriptionId");

  if (!panchayat) {
    return res.status(404).json({ message: "Profile not found" });
  }

  const sub = panchayat.subscriptionId;

  res.json({
    name: panchayat.name,
    contact: panchayat.contactPhone,
    email: panchayat.contactEmail,
    status: panchayat.status === "active",

    // 👇 subscription details
    subscription: sub
      ? {
        plan: sub.planName,
        status: new Date() > new Date(sub.endDate) ? "EXPIRED" : sub.status, // active | expired | cancelled
        startDate: sub.startDate,
        endDate: sub.endDate,
      }
      : "Contact your provider for subscription details",
    
    // Add full panchayat data for admin panel
    panchayat: panchayat
  });
};

/**
 * UPDATE PROFILE
 */
export const updateProfile = async (req, res) => {
  const { name, contact, email, status } = req.body;

  const panchayat = await Panchayat.findByIdAndUpdate(
    req.user.panchayatId,
    {
      name,
      contactPhone: contact,
      contactEmail: email,
      status: status ? "active" : "inactive",
    },
    { new: true }
  );

  res.json({
    success: true,
    message: "Profile updated",
    profile: panchayat,
  });
};
