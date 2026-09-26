import mongoose from "mongoose";
import Complaint from "../models/Complaint.model.js";
import { notifyIssueUpdated } from "../services/notification.service.js";

// @desc    Submit a complaint (Public)
// @route   POST /api/complaints
// @access  Public
export const createComplaint = async (req, res) => {
  try {
    const { panchayatId, reporterName, reporterMobile, type, description, lat, lng, ward } = req.body;

    // Handle file upload
    const photo = req.file ? req.file.path.replace(/\\/g, "/") : null;

    // Auto-generate Complaint ID
    // Check globally for the last ID to ensure uniqueness across all panchayats
    const lastComplaint = await Complaint.findOne({ complaintId: { $exists: true } }, { complaintId: 1 })
      .sort({ createdAt: -1 })
      .lean();

    let nextId = "COM001";
    if (lastComplaint && lastComplaint.complaintId) {
      const match = lastComplaint.complaintId.match(/^COM(\d+)$/);
      if (match) {
        const nextNum = parseInt(match[1], 10) + 1;
        nextId = `COM${String(nextNum).padStart(3, "0")}`;
      }
    }

    const complaint = await Complaint.create({
      panchayat: panchayatId,
      complaintId: nextId,
      reporterName,
      reporterMobile,
      type,
      description,
      ward,
      photo,
      geo: { lat, lng },
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all complaints for panchayat
// @route   GET /api/complaints
// @access  Private (Admin/Supervisor)
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ panchayat: req.user.panchayatId })
      .populate("assignedTo", "name phone")
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's complaints
// @route   GET /api/complaints/me
// @access  Private
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({
      reporterMobile: req.user.mobile,
      panchayat: req.user.panchayatId
    }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update complaint status
// @route   PATCH /api/complaints/:id
// @access  Private (Admin/Supervisor)
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    let complaint;
    // Check if valid ObjectId, otherwise search by readable complaintId
    if (mongoose.Types.ObjectId.isValid(req.params.id)) {
      complaint = await Complaint.findById(req.params.id);
    }

    if (!complaint) {
      complaint = await Complaint.findOne({ complaintId: req.params.id });
    }

    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    if (complaint.panchayat.toString() !== req.user.panchayatId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    if (status) complaint.status = status;
    if (assignedTo) complaint.assignedTo = assignedTo;

    if (status === "Resolved") {
      complaint.resolvedAt = new Date();

      const created = new Date(complaint.createdAt);
      const resolved = new Date(complaint.resolvedAt);
      const diffMs = resolved - created;

      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffDays = Math.floor(diffHrs / 24);

      let duration = "";
      if (diffDays > 0) duration += `${diffDays} days `;
      if (diffHrs % 24 > 0) duration += `${diffHrs % 24} hours `;
      if (diffMins > 0) duration += `${diffMins} minutes`;

      complaint.resolutionTime = duration.trim() || "< 1 minute";
    }

    await complaint.save();

    if (complaint.assignedTo) {
      notifyIssueUpdated({
        recipientId: complaint.assignedTo,
        complaintId: complaint.complaintId || complaint._id,
        status: complaint.status,
      }).catch((e) => console.error("Complaint Push Error:", e.message));
    }

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get complaint stats
// @route   GET /api/complaints/stats
// @access  Private (Admin/Supervisor)
export const getComplaintStats = async (req, res) => {
  try {
    const panchayatId = req.user.panchayatId;
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newComplaints = await Complaint.countDocuments({
      panchayat: panchayatId,
      createdAt: { $gte: twentyFourHoursAgo }
    });

    const pendingComplaints = await Complaint.countDocuments({
      panchayat: panchayatId,
      status: 'Received'
    });

    const resolvedComplaints = await Complaint.countDocuments({
      panchayat: panchayatId,
      status: 'Resolved',
      resolvedAt: { $gte: startOfMonth }
    });

    res.json({
      newComplaints,
      pendingComplaints,
      resolvedComplaints
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
