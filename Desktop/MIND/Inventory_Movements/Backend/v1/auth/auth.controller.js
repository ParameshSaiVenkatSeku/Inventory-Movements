const bcrypt = require("bcryptjs");
const knex = require("knex");
const jwt = require("jsonwebtoken");
const { Model } = require("objection");
const knexConfig = require("./../../knexfile");
const { signupUserSchema, loginUserSchema } = require("./auth.utils");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/CustomError");
const db = knex(knexConfig);
Model.knex(db);
const JWT_SECRET = "AkriviaHCM";
const Refresh_secret = "AkriviaAutomation";

function generateAccessToken(user) {
  return jwt.sign(
    { user_id: user.user_id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { user_id: user.user_id, username: user.username, email: user.email },
    Refresh_secret,
    { expiresIn: "7d" }
  );
}

const CreateUser = asyncErrorHandler(async (req, res) => {
  const { first_name, last_name, email, password } = req.body;
  const { error } = signupUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  try {
    const existingUser = await db("users").where({ email }).first();
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const username = `${first_name.toLowerCase()} ${last_name.toLowerCase()}`;
    const existingUserName = await db("users").where({ username }).first();
    if (existingUserName) {
      return res.status(400).json({
        message:
          "The combination already exists; try changing firstname or lastname",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [user_id] = await db("users").insert({
      first_name,
      username,
      password: hashedPassword,
      email,
      status: "0",
    });

    res.status(201).json({
      message: "User created successfully",
      user_id,
      first_name,
      last_name,
      email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

const loginUser = asyncErrorHandler(async (req, res) => {
  const { email, password } = req.body;
  const { error } = loginUserSchema.validate({ email, password });
  if (error) {
    throw new CustomError(error.details[0].message, 400);
  }

  const user = await db("users")
    .where({ email })
    .orWhere({ username: email })
    .first();
  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  res.status(200).json({
    message: "Login successful",
    access_token: accessToken,
    refresh_token: refreshToken,
  });
});

const RefreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(401).json({ message: "Refresh token is required" });
  }
  jwt.verify(refresh_token, Refresh_secret, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }
    const newAccessToken = generateAccessToken(decoded);
    const refreshToken = generateRefreshToken(decoded);
    res.json({ access_token: newAccessToken, refresh_token: refreshToken });
  });
};
module.exports = { CreateUser, loginUser, RefreshToken };
