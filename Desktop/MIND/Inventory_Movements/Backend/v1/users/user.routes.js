const express = require("express");
const {
  getUser,
  updateUser,
  deleteUser,
  getAllUsers,
  forgotPassword,
  resetPassword,
  chatHistory,
} = require("./user.controller");
const authenticateToken = require("../../middlewares/authenticateToken");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User management and password operations
 */

/**
 * @swagger
 * /userdata:
 *   get:
 *     summary: Get the current user's data.
 *     description: Retrieve the data of the authenticated user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully retrieved user data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized access.
 */
router.get("/userdata/", authenticateToken, getUser);

/**
 * @swagger
 * /update/{id}:
 *   put:
 *     summary: Update user information.
 *     description: Update the user's details using the provided ID.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The ID of the user to be updated.
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: User object with updated information.
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
 *       200:
 *         description: Successfully updated user data.
 *       400:
 *         description: Invalid request data.
 *       401:
 *         description: Unauthorized access.
 */
router.put("/update/:id", authenticateToken, updateUser);

/**
 * @swagger
 * /delete/{id}:
 *   delete:
 *     summary: Delete a user.
 *     description: Delete a user by their ID.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The ID of the user to be deleted.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successfully deleted user.
 *       404:
 *         description: User not found.
 *       401:
 *         description: Unauthorized access.
 */
router.delete("/delete/:id", authenticateToken, deleteUser);

router.get("/getAllData", getAllUsers);

router.get("/chat-history/:sendId/:recvId", chatHistory);

module.exports = router;
