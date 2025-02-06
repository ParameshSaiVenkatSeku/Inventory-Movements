const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");
const setupSwagger = require("./utils/swagger");
const routes = require("./utils/routes");
// const socketSetup = require("./utils/socket"); // Correctly import the socket setup
const globalErrorHandler = require("./utils/errorController");
const logger = require("./middlewares/logger");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const knex = require("knex");
const knexConfig = require("./knexfile");
const db = knex(knexConfig);

dotenv.config();

const app = express();
setupSwagger(app);
app.use(express.json());
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000000, // Set a higher request limit if necessary
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

app.use("/api/v1", routes);

const server = http.createServer(app);

// socketSetup(server);

app.use(globalErrorHandler);

app.use(express.urlencoded({ extended: true }));

// Start the server
server.listen(PORT, () => {
  // Use server.listen instead of app.listen
  logger.info(`Server running on http://localhost:${PORT}`);
});

const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: { origin: "*" },
});

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("sendMessage", ({ sender_id, receiver_id, message }) => {
    console.log(`Message from ${sender_id} to ${receiver_id}: ${message}`);

    db("messages")
      .insert({
        sender_id: sender_id,
        receiver_id: receiver_id,
        message: message,
      })
      .then(() => {
        console.log("Message saved to DB");
      })
      .catch((err) => {
        console.error("DB error:", err);
      });

    io.to(receiver_id.toString()).emit("receiveMessage", {
      sender_id,
      message,
      created_at: new Date(),
    });
  });

  socket.on("joinChat", (user_id) => {
    socket.join(user_id.toString());
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
  socket.on("join_team", (teamId) => {
    socket.join(`team_${teamId}`);
    console.log(`User joined team ${teamId}`);
  });

  socket.on("send_message", ({ teamId, sender, text }) => {
    console.log(teamId, sender, text);
    io.to(`team_${teamId}`).emit("receive_message", { sender, text });
  });
});

module.exports = app;
