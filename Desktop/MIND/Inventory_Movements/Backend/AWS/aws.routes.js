const express = require("express");
const {
  getUrl,
  profileUpdate,
  getFiles,
  downloadZip,
} = require("./aws.controller");
const router = express.Router();

router.post("/get-presigned-url", getUrl);
router.post("/update-profile-pic", profileUpdate);
router.get("/getfiles/:id", getFiles);
router.get("/download-zip", downloadZip);

module.exports = router;
