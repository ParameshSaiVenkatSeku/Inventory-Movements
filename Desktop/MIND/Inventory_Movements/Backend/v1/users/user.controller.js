const bcrypt = require("bcryptjs");
const knex = require("knex");
const jwt = require("jsonwebtoken");
const { Model } = require("objection");
const knexConfig = require("./../../knexfile");
const db = knex(knexConfig);
Model.knex(db);

const getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await db("users").where({ user_id: userId }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      profilePic: user.profile_pic,
      thumbnail: user.thumbnail,
    });
  } catch (err) {
    console.error("Error fetching user data:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const updateUser = async (req, res) => {
  const userId = req.params.id;
  const {
    first_name,
    username,
    email,
    branch,
    role, // Frontend sends role_name instead of role_id
  } = req.body;

  // console.log("update-request", req.body);

  try {
    const user = await db("users").where({ user_id: userId }).first();
    // console.log("hit1");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // console.log("hit2");
    let updatedFields = {};
    if (first_name) updatedFields.first_name = first_name;
    if (username) updatedFields.username = username;
    if (email) updatedFields.email = email;
    if (branch) updatedFields.branch = branch;
    // console.log("hit3");
    if (role) {
      const roles = await db("roles").where("role_name", role).first();
      // console.log("hit4");
      if (!roles) {
        return res.status(400).json({ message: "Invalid role name" });
      }
      // console.log("hit5", roles.id);
      updatedFields.role_id = roles.id;
    }
    // console.log("hit6");
    await db("users").where({ user_id: userId }).update(updatedFields);

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ DELETE USER - Prevent Admin Deletion
const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await db("users").where({ user_id: userId }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role_id === 1) {
      return res.status(403).json({ message: "Admin users cannot be deleted" });
    }

    await db("users").where({ user_id: userId }).del();
    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ GET ALL USERS - Exclude Super Admins (role_id = 1)
const getAllUsers = async (req, res) => {
  try {
    const users = await db("users")
      .join("roles", "users.role_id", "roles.id")
      .select(
        "users.user_id",
        "users.first_name",
        "users.username",
        "users.email",
        "users.branch",
        "users.status",
        "roles.role_name",
        "users.created_at",
        "users.updated_at"
      )
      .whereNot("users.role_id", 1); // Exclude super admins

    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const chatHistory = async (req, res) => {
  const sender = req.params.sendId,
    receiver = req.params.recvId;
  const messages = await db("messages")
    .select("message")
    .where("sender_id", sender)
    .andWhere("receiver_id", receiver);

  console.log(messages);

  return messages;
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser,
  getUser,
  chatHistory,
};
