const express = require("express");
const {
  getUrl,
  profileUpdate,
  getFiles,
  downloadZip,
} = require("./aws.controller");
const { authorizePermission } = require("../middlewares/authenticateToken");
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AWS
 *   description: AWS-related operations
 */

/**
 * @swagger
 * /api/get-presigned-url:
 *   post:
 *     summary: Get a pre-signed URL for file upload.
 *     tags: [AWS]
 *     requestBody:
 *       description: Data required to generate a pre-signed URL.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName:
 *                 type: string
 *               fileType:
 *                 type: string
 *     responses:
 *       200:
 *         description: Pre-signed URL generated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 */
router.post("/get-presigned-url", getUrl);

/**
 * @swagger
 * /api/update-profile-pic:
 *   post:
 *     summary: Update user profile picture.
 *     tags: [AWS]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: New profile picture file data.
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile picture updated successfully.
 */
router.post("/update-profile-pic", profileUpdate);

/**
 * @swagger
 * /api/getfiles/{id}:
 *   get:
 *     summary: Get all files for a user.
 *     tags: [AWS]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: User ID whose files are to be fetched.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Files retrieved successfully.
 */
router.get("/getfiles/:id", getFiles);

/**
 * @swagger
 * /api/download-zip:
 *   get:
 *     summary: Download multiple files as a ZIP archive.
 *     tags: [AWS]
 *     responses:
 *       200:
 *         description: ZIP archive downloaded successfully.
 */
router.get("/download-zip", authorizePermission("file_download"), downloadZip);

module.exports = router;
