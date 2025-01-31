const AWS = require("aws-sdk");
const knex = require("knex");
const { Model } = require("objection");
const archiver = require("archiver");
const knexConfig = require("./../knexfile");
const db = knex(knexConfig);
Model.knex(db);
require("dotenv").config();

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const getUrl = async (req, res) => {
  let { fileName, fileType, userId, folderName } = req.body;
  console.log("aws 20", fileType);

  try {
    if (!fileName || !fileType) {
      return res.status(400).json({ message: "Missing fileName or fileType" });
    }
    if (userId === "-1") {
      folderName = "fileuploads";
    } else {
      if (
        fileType === "application/vnd.ms-excel" ||
        fileType ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      )
        folderName = `imported-files/${userId}`;
      else folderName = "profile-photos";
    }
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `AKV0779/${folderName}/${fileName}`,
      Expires: 60 * 60,
    };
    s3.getSignedUrl("putObject", s3Params, (err, url) => {
      if (err) {
        return res
          .status(500)
          .json({ error: "Error generating presigned URL" });
      }
      res.json({
        presignedUrl: url,
        fileName,
        userId,
        imageUrl: `${process.env.AWS_URL}${folderName}/${fileName}`,
      });
    });
  } catch (err) {
    console.error("Error occured in generating presigned url", err);
    res
      .status(500)
      .json({ message: "Error occured in generating presigned url" });
  }
};

const profileUpdate = async (req, res) => {
  const { userId, fileName } = req.body;
  const fileUrl = `${process.env.PROFILE_PICTURE_URL}${fileName}`;

  try {
    await db("users").where("user_id", userId).update({ profile_pic: fileUrl });
    res.json({ message: "Profile picture updated successfully", fileUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error updating profile picture" });
  }
};

const getFiles = async (req, res) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: "AKV0779/fileuploads/",
  };

  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.error("Error fetching files from S3:", err);
      return res.status(500).json({ message: "Error fetching files from S3" });
    }
    const files = data.Contents.map((file) => {
      const fileName = file.Key.replace("AKV0779/fileuploads/", "");
      return {
        fileName: fileName,
        fileSize: file.Size,
        fileType: __filename.split(".").pop(),
      };
    });

    res.json(files);
  });
};

const downloadZip = (req, res) => {
  const { selectedFiles } = req.body;

  if (!selectedFiles || selectedFiles.length === 0) {
    return res.status(400).json({ message: "No files selected" });
  }
  const folderPrefix = "AKV0779/profile-photos/";
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="files.zip"');

  archive.pipe(res);

  selectedFiles.forEach((fileName) => {
    const fileKey = folderPrefix + fileName;
    const params = {
      Bucket: "akv-interns",
      Key: fileKey,
    };

    s3.getObject(params, (err, data) => {
      if (err) {
        console.error(`Error fetching ${fileName} from S3`, err);
      } else {
        archive.append(data.Body, { name: fileName });
      }
    });
  });

  archive.finalize();
};

module.exports = { getUrl, profileUpdate, getFiles, downloadZip };
