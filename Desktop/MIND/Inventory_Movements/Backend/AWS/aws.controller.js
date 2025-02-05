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

const getFileData = async (fileUrl) => {
  console.log("[getFileData] Fetching file data for URL:", fileUrl);
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileUrl.split(".amazonaws.com/")[1],
  };

  try {
    const data = await s3.getObject(params).promise();
    console.log("[getFileData] Retrieved file data successfully.");
    return data.Body;
  } catch (error) {
    console.error("[getFileData] Error fetching file from S3:", error);
    throw error;
  }
};

const getUrl = async (req, res) => {
  let { fileName, fileType, userId, folderName } = req.body;
  console.log("[getUrl] Request received:", { fileName, fileType, userId });
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
      ) {
        folderName = `imported-files/${userId}`;
      } else {
        folderName = "profile-photos";
      }
    }
    const s3Params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `AKV0779/${folderName}/${fileName}`,
      Expires: 60 * 60,
    };

    s3.getSignedUrl("putObject", s3Params, (err, url) => {
      if (err) {
        console.error("[getUrl] Error generating presigned URL:", err);
        return res
          .status(500)
          .json({ error: "Error generating presigned URL" });
      }
      console.log("[getUrl] Presigned URL generated successfully.");
      res.json({
        presignedUrl: url,
        fileName,
        userId,
        imageUrl: `${process.env.AWS_URL}${folderName}/${fileName}`,
      });
    });
  } catch (err) {
    console.error("[getUrl] Error occurred in generating presigned URL", err);
    res
      .status(500)
      .json({ message: "Error occurred in generating presigned URL" });
  }
};

const profileUpdate = async (req, res) => {
  const { userId, fileName } = req.body;
  const fileUrl = `${process.env.PROFILE_PICTURE_URL}${fileName}`;
  try {
    await db("users").where("user_id", userId).update({ profile_pic: fileUrl });
    console.log("[profileUpdate] Profile updated for user:", userId, fileUrl);
    res.json({ message: "Profile picture updated successfully", fileUrl });
  } catch (err) {
    console.error("[profileUpdate] Error updating profile picture:", err);
    res.status(500).json({ error: "Error updating profile picture" });
  }
};

const getFiles = async (req, res) => {
  const id = req.params.id;
  let folderName = id == -1 ? "fileuploads" : `imported-files/${id}`;
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Prefix: `AKV0779/${folderName}`,
  };
  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.error("[getFiles] Error fetching files from S3:", err);
      return res.status(500).json({ message: "Error fetching files from S3" });
    }
    const files = data.Contents.map((file) => {
      const fileName = file.Key.replace(`AKV0779/${folderName}/`, "");
      return {
        fileName,
        fileSize: file.Size,
        fileType: __filename.split(".").pop(),
      };
    });
    console.log("[getFiles] Files retrieved successfully.");
    res.json(files);
  });
};

const downloadZip = (req, res) => {
  const { selectedFiles } = req.body;
  if (!selectedFiles || selectedFiles.length === 0) {
    return res.status(400).json({ message: "No files selected" });
  }
  const folderPrefix = "AKV0779/fileuploads/";
  const archive = archiver("zip", { zlib: { level: 9 } });
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="files.zip"');
  archive.pipe(res);
  selectedFiles.forEach((fileName) => {
    const fileKey = folderPrefix + fileName;
    const params = { Bucket: "akv-interns", Key: fileKey };
    s3.getObject(params, (err, data) => {
      if (err)
        console.error(`[downloadZip] Error fetching ${fileName} from S3:`, err);
      else archive.append(data.Body, { name: fileName });
    });
  });
  archive.finalize();
};

const uploadBufferToS3 = async (buffer, fileName, folderName) => {
  console.log(
    `[uploadBufferToS3] Uploading buffer with fileName: ${fileName} to folder: ${folderName}`
  );
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `AKV0779/${folderName}/${fileName}`,
    Body: buffer,
    ContentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
  try {
    const uploadResult = await s3.upload(params).promise();
    console.log("[uploadBufferToS3] Upload successful:", uploadResult.Location);
    return uploadResult.Location;
  } catch (error) {
    console.error("[uploadBufferToS3] Error uploading file to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
};

module.exports = {
  getFileData,
  getUrl,
  profileUpdate,
  getFiles,
  downloadZip,
  uploadBufferToS3,
};
