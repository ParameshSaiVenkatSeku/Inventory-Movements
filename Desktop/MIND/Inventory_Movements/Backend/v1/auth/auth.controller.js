const bcrypt = require("bcryptjs");
const knex = require("knex");
const jwt = require("jsonwebtoken");
const { Model } = require("objection");
const knexConfig = require("./../../knexfile");
const { signupUserSchema, loginUserSchema } = require("./auth.utils");
const { getUserByEmail } = require("./auth.queries");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const CustomError = require("../../utils/CustomError");
const nodemailer = require("nodemailer");
const db = knex(knexConfig);
Model.knex(db);

const JWT_SECRET = "AkriviaHCM";
const REFRESH_SECRET = "AkriviaAutomation";

function generateAccessToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    {
      user_id: user.user_id,
      username: user.username,
      email: user.email,
    },
    REFRESH_SECRET,
    { expiresIn: "7d" }
  );
}

const createUser = asyncErrorHandler(async (req, res) => {
  const { first_name, last_name, email, password, branch } = req.body;
  const { error } = signupUserSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ message: error.details[0].message });
  }

  const existingUser = await db("users").where({ email }).first();
  if (existingUser) {
    return res.status(400).json({ message: "Email already exists" });
  }

  const username = `${first_name.toLowerCase()}_${last_name.toLowerCase()}`;
  const existingUserName = await db("users").where({ username }).first();
  if (existingUserName) {
    return res.status(400).json({
      message:
        "The username combination already exists; try modifying your first name or last name",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const [user_id] = await db("users").insert({
    first_name,
    username,
    password: hashedPassword,
    email,
    branch,
    role_id: "3",
    status: "0",
  });

  res.status(201).json({
    message: "User created successfully",
    user_id,
    first_name,
    last_name,
    email,
  });
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

const refreshToken = asyncErrorHandler(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) {
    return res.status(401).json({ message: "Refresh token is required" });
  }

  jwt.verify(refresh_token, REFRESH_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    const newAccessToken = generateAccessToken(decoded);
    const newRefreshToken = generateRefreshToken(decoded);
    res.status(200).json({
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
    });
  });
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const forgotEmail = async (req, res, next) => {
  try {
    const email = req.params.email;
    // console.log(req.params);
    // console.log(email);
    const user = await getUserByEmail(email);
    // console.log(user);
    if (!user || user === undefined) {
      return res.status(400).send({ message: "User Not Found" });
    }
    console.log(user);
    const token = jwt.sign({ id: user.user_id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "15m",
    });
    console.log(`${process.env.URL}`);
    const resetLink = `${process.env.URL}/auth/reset?token=${token}`;
    console.log("hello");
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Password Reset",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
    });
    return res.status(200).send({ message: "Email Sent Successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).send({ message: "Error Occured in sending the request" });
  }
};

const resetPassword = async (req, res) => {
  try {
    console.log(req.body);
    const { password, token } = req.body;
    console.log("toek", token);
    console.log("hello yeswanth");
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log(decoded, "decodes");
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("dhojhd", hashedPassword);
    await db("users")
      .where({ user_id: decoded.id })
      .update({ password: hashedPassword });

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Invalid or expired token" });
  }
};

const userPermissions = async (req, res) => {
  try {
    const userId = req.params.id;
    const permissions = await db("users")
      .join("roles", "users.role_id", "roles.id")
      .join("role_permissions", "roles.id", "role_permissions.role_id")
      .join("permissions", "role_permissions.permission_id", "permissions.id")
      .where("users.user_id", userId)
      .select("permissions.permission_name");
    // console.log(permissions);
    res.status(200).json(permissions);
  } catch (error) {
    console.error(error);
    res.status(400).json(error);
  }
};

module.exports = {
  createUser,
  loginUser,
  refreshToken,
  forgotEmail,
  resetPassword,
  userPermissions,
};
