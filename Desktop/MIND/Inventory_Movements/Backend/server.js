const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const authRouter = require("./v1/auth/auth.routes");
const userRouter = require("./v1/users/user.routes");
const awsRoutes = require("./AWS/S3/aws.routes");
const dashboardRoutes = require("./v1/dashboard/dashboard.routes");
const {
  moveToCart,
  getCartData,
  postproduct,
} = require("./v1/dashboard/product.controller");
const globalErrorHandler = require("./utils/errorController");
const logger = require("./middlewares/logger");
const encryptionMiddleware = require("./middlewares/encryptionMiddleware");
const helmet = require("helmet");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(fileUpload());

app.use((req, res, next) => {
  logger.info(`HTTP ${req.method} ${req.url}`);
  next();
});

app.use("/auth", encryptionMiddleware, authRouter);
app.use("/user", userRouter);
app.use("/api", awsRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/move-to-cart", moveToCart);
app.use("/get-cart", getCartData);
app.use("/dashboard/product", postproduct);

app.use(globalErrorHandler);

app.listen(3000, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
