const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const authRoutes = require("./v1/auth/auth.routes");
const userRoutes = require("./v1/users/user.routes");
const awsRoutes = require("./AWS/aws.routes");
const dashboardRoutes = require("./v1/dashboard/dashboard.routes");
const globalErrorHandler = require("./utils/errorController");
const logger = require("./middlewares/logger");
const encryptionMiddleware = require("./middlewares/encryptionMiddleware");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(fileUpload());

app.use((req, res, next) => {
  logger.info(`HTTP ${req.method} ${req.url}`);
  next();
});

app.use("/auth", encryptionMiddleware, authRoutes);
app.use("/user", userRoutes);
app.use("/api", awsRoutes);
app.use("/dashboard", dashboardRoutes);

app.use(globalErrorHandler);

app.listen(3000, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
