const knex = require("knex");
const knexConfig = require("../knexfile");
const db = knex(knexConfig);

const socketIo = require("socket.io");

module.exports = (server) => {
  const io = socketIo(server, {
    cors: { origin: "*" },
  });

  let userSockets = {};

  io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`);

    socket.on("registerUser", (userId) => {
      console.log(`Registering user ${userId} with socket ID ${socket.id}`);
      userSockets[userId] = socket.id;
    });

    socket.on("getUsers", async () => {
      try {
        const users = await db("users").select(
          "user_id",
          "username",
          "first_name"
        );
        console.log(`Sending users list: ${JSON.stringify(users)}`);
        socket.emit("usersList", users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    });

    socket.on("sendMessage", async (data) => {
      const { senderId, receiverId, message } = data;
      console.log(`Message from ${senderId} to ${receiverId}: ${message}`);

      try {
        await db("chat_messages").insert({
          sender_id: senderId,
          receiver_id: receiverId,
          message,
          status: "sent",
        });

        if (userSockets[receiverId]) {
          console.log(`Receiver ${receiverId} is online, sending message`);
          io.to(userSockets[receiverId]).emit("receiveMessage", data);
        } else {
          console.log(`Receiver ${receiverId} is not connected.`);
        }
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    socket.on("disconnect", () => {
      for (const userId in userSockets) {
        if (userSockets[userId] === socket.id) {
          console.log(`User ${userId} disconnected`);
          delete userSockets[userId];
          break;
        }
      }
    });
  });
};
