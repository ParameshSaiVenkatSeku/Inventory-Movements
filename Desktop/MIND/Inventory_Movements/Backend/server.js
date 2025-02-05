const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const setupSwagger = require("./utils/swagger");
const routes = require("./utils/routes");

const globalErrorHandler = require("./utils/errorController");
const logger = require("./middlewares/logger");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

dotenv.config();

const app = express();
setupSwagger(app);
app.use(express.json());
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100000000,
  message: "Too many requests from this IP, please try again after 15 minutes",
});

app.use(limiter);

app.use(cors());
app.use(helmet());

app.use(fileUpload());

app.use((req, res, next) => {
  logger.info(`HTTP ${req.method} ${req.url}`);
  next();
});
// console.log(typeof routes);
app.use("/api/v1", routes);

app.use(globalErrorHandler);

app.use(express.urlencoded({ extended: true }));

app.listen(3000, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
