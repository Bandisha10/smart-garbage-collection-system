import Route from "../models/Route.model.js";
import { notifyRouteAssigned } from "../services/notification.service.js";

// CREATE
export const createRoute = async (req, res) => {
  try {
    const { routeName, stops, details, assignedDriver, assignedVehicle } = req.body;

    // Auto-generate Route Code
    const lastRoute = await Route.findOne({ panchayat: req.user.panchayatId }).sort({ createdAt: -1 });
    let nextCode = 1001;
    if (lastRoute && lastRoute.routeCode) {
      const codePart = parseInt(lastRoute.routeCode.split('-')[1]);
      if (!isNaN(codePart)) {
        nextCode = codePart + 1;
      }
    }
    const routeCode = `RT-${nextCode}`;

    const route = await Route.create({
      panchayat: req.user.panchayatId,
      routeName,
      routeCode,
      stops: stops || [],
      details,
      assignedDriver: assignedDriver || null,
      assignedVehicle,
    });

    if (route.assignedDriver) {
      notifyRouteAssigned({
        driverId: route.assignedDriver,
        routeName: route.routeName,
        routeCode: route.routeCode,
        routeId: route._id,
      }).catch((err) => console.error("Route Assigned Push Error:", err.message));
    }

    res.status(201).json(route);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// LIST
export const getRoutes = async (req, res) => {
  try {
    const routes = await Route.find({ panchayat: req.user.panchayatId })
      .populate("assignedDriver", "name employeeCode")
      .sort({ createdAt: -1 });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch routes" });
  }
};

// GET SINGLE
export const getRouteById = async (req, res) => {
  try {
    const route = await Route.findOne({ _id: req.params.id, panchayat: req.user.panchayatId });
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json(route);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch route" });
  }
};

// UPDATE
export const updateRoute = async (req, res) => {
  try {
    const prevRoute = await Route.findOne({ _id: req.params.id, panchayat: req.user.panchayatId });
    const route = await Route.findOneAndUpdate(
      { _id: req.params.id, panchayat: req.user.panchayatId },
      req.body,
      { new: true }
    );
    if (!route) return res.status(404).json({ message: "Route not found" });

    // If driver is assigned or changed
    if (
      route.assignedDriver &&
      (!prevRoute?.assignedDriver || prevRoute.assignedDriver.toString() !== route.assignedDriver.toString())
    ) {
      notifyRouteAssigned({
        driverId: route.assignedDriver,
        routeName: route.routeName,
        routeCode: route.routeCode,
        routeId: route._id,
      }).catch((err) => console.error("Route Assigned Push Error:", err.message));
    }

    res.json(route);
  } catch (err) {
    res.status(500).json({ message: "Failed to update route" });
  }
};

// DELETE (Soft delete or Hard delete)
export const deleteRoute = async (req, res) => {
  try {
    const route = await Route.findOneAndDelete({ _id: req.params.id, panchayat: req.user.panchayatId });
    if (!route) return res.status(404).json({ message: "Route not found" });
    res.json({ message: "Route deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete route" });
  }
};
