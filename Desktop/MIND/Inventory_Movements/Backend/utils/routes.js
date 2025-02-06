const authRoutes = require("../v1/auth/auth.routes");
const userRoutes = require("../v1/users/user.routes");
const awsRoutes = require("../AWS/aws.routes");
const dashboardRoutes = require("../v1/dashboard/dashboard.routes");
const importRoutes = require("../v1/import/import.routes");

const express = require("express");
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/aws", awsRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/imports", importRoutes);
module.exports = router;
