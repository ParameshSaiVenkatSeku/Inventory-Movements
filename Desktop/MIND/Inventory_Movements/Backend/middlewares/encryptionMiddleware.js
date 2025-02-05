const CryptoJS = require("crypto-js");

const encryptionMiddleware = (req, res, next) => {
  const secretKey = "akriviaautomation";
  try {
    // console.log("body", req.body);

    if (!req.body.email || !req.body.password) {
      // console.log(req.body.email, req.body.password);
      throw new Error("Email or Password missing in the request body");
    }
    console.log(req.body, "fghjuyfcvytfcvgvbgvbhgv");
    const decryptedEmail = CryptoJS.AES.decrypt(
      req.body.email,
      secretKey
    ).toString(CryptoJS.enc.Utf8);
    const decryptedPassword = CryptoJS.AES.decrypt(
      req.body.password,
      secretKey
    ).toString(CryptoJS.enc.Utf8);

    console.log(decryptedEmail, decryptedPassword);
    if (!decryptedEmail || !decryptedPassword) {
      throw new Error("Decryption resulted in empty values");
    }

    req.body.email = decryptedEmail;
    req.body.password = decryptedPassword;

    next();
  } catch (err) {
    console.error("Decryption Error:", err.message);
    return res
      .status(400)
      .json({ message: "Decryption failed", error: err.message });
  }
};

module.exports = encryptionMiddleware;
