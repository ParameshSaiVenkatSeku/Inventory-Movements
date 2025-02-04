const express = require("express");
const router = express.Router();
const { fileUploadToTable, getDataFromTable } = require("./import.controller");

/**
 * @swagger
 * tags:
 *   name: Import
 *   description: File import operations
 */

/**
 * @swagger
 * /imports/upload-file:
 *   post:
 *     summary: Upload a file and store data in the table.
 *     tags: [Import]
 *     requestBody:
 *       description: File upload data.
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
 *         description: File uploaded and data stored successfully.
 *       400:
 *         description: Invalid file or data.
 */
router.post("/upload-file", fileUploadToTable);

/**
 * @swagger
 * /imports/getData/{id}:
 *   get:
 *     summary: Retrieve data from the table by ID.
 *     tags: [Import]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID to fetch data for.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Data retrieved successfully.
 *       404:
 *         description: Data not found.
 */
router.get("/getData/:id", getDataFromTable);

module.exports = router;
