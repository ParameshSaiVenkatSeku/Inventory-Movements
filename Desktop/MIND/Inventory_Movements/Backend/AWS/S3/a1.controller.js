const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const knex = require("knex");
const { Model } = require("objection");
const knexConfig = require("./../../knexfile");
require('dotenv').config()
 
const db = knex(knexConfig);
Model.knex(db);
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const getUrl = async (req, res) => {
  const { fileName, fileType, userId } = req.body;
 
  try {
    if (!fileName || !fileType || !userId) {
      return res
        .status(400)
        .json({ message: "Missing fileName, fileType, or userId" });
    }
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `${process.env.AWS_KEY}${fileName}`,
      ContentType: fileType,
    });
 
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 60,
    });
    res.json({
      presignedUrl,
      fileName,
      userId,
      image: `${process.env.PROFILE_PICTURE_URL}${fileName}`,
    });
  } catch (error) {
    console.error("Error occurred in generating presigned URL", error);
    res
      .status(500)
      .json({ message: "Error occurred in generating presigned URL" });
  }
};
 
const profileUpdate = async (req, res) => {
  const { userid, filename } = req.body;
  const fileUrl = `${process.env.PROFILE_PICTURE_URL}${filename}`;
 
  try {
    await db("users").where("user_id", userid).update({ profile_pic: fileUrl });
 
    res.json({ message: "Profile picture updated successfully" });
  } catch (error) {
    console.error("Error updating profile picture", error);
    res.status(500).json({ error: "Error updating profile picture" });
  }
};
 
module.exports = { getUrl, profileUpdate };