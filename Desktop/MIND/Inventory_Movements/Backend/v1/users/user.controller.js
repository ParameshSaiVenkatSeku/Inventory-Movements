const bcrypt = require("bcryptjs");
const knex = require("knex");
const jwt = require("jsonwebtoken");
const { Model } = require("objection");
const knexConfig = require("./../../knexfile");
const db = knex(knexConfig);
Model.knex(db);
const JWT_SECRET = "AkriviaHCM";

const getUser = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(userId);

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
  const { first_name, last_name, email, password, profile_pic, thumbnail } =
    req.body;

  try {
    const user = await db("users").where({ user_id: userId }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let updatedFields = {
      first_name,
      last_name,
      email,
      profile_pic,
      thumbnail,
    };

    if (password) {
      updatedFields.password = await bcrypt.hash(password, 10);
    }

    await db("users").where({ user_id: userId }).update(updatedFields);

    res.status(200).json({ message: "User updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const deleteUser = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await db("users").where({ user_id: userId }).first();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await db("users").where({ user_id: userId }).del();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await db("users").select(
      "user_id",
      "first_name",
      "username",
      "email",
      "status"
    );
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { getAllUsers, updateUser, deleteUser, getUser };
