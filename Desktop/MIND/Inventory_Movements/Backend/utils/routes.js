const authRoutes = require("../v1/auth/auth.routes");
const userRoutes = require("../v1/users/user.routes");
const awsRoutes = require("../AWS/aws.routes");
const dashboardRoutes = require("../v1/dashboard/dashboard.routes");
const importRoutes = require("../v1/import/import.routes");
const encryptionMiddleware = require("../middlewares/encryptionMiddleware");
const express = require("express");
const app = express();

app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/aws", awsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/imports", importRoutes);

module.exports = app;
