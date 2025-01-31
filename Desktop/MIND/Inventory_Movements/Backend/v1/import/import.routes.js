const express = require("express");
const router = express.Router();
const { fileUploadToTable } = require("./import.controller");

router.post("/upload-file", fileUploadToTable);

module.exports = router;
