const express = require("express");
const { CreateUser, loginUser, RefreshToken } = require("./auth.controller");
const router = express.Router();

router.post("/signup", CreateUser);
router.post("/login", loginUser);
router.post("/refresh", RefreshToken);

module.exports = router;
