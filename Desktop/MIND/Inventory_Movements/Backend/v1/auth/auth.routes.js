const express = require("express");
const { CreateUser, loginUser, RefreshToken } = require("./auth.controller");
const router = express.Router();
const authenticateToken = require("../../middlewares/authenticateToken");

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication operations
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user account.
 *     tags: [Auth]
 *     requestBody:
 *       description: User information for signup.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Bad request.
 */
router.post("/signup", CreateUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and get JWT token.
 *     tags: [Auth]
 *     requestBody:
 *       description: User login credentials.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       401:
 *         description: Unauthorized.
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Refresh user authentication token.
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *       403:
 *         description: Forbidden.
 */
router.post("/refresh", authenticateToken, RefreshToken);

module.exports = router;
