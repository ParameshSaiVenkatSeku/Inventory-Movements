const express = require("express");
const router = express.Router();
const { fileUploadToTable, getDataFromTable } = require("./import.controller");

router.post("/upload-file", fileUploadToTable);
router.get("/getData/:id", getDataFromTable);

module.exports = router;
