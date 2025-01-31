const { insertFileDetails, parseExcelData } = require("./import.service");
const { getPendingFileNames } = require("./import.queries");
const cron = require("node-cron");

cron.schedule("* * * * *", () => {
  console.log("Cron is Executing.......");
  startValidation();
});

const startValidation = async () => {
  const pendingFiles = await getPendingFileNames();
  console.log("import controller js records - 12", pendingFiles);
  if (pendingFiles && pendingFiles.length > 0) {
    for (const file of pendingFiles) {
      const fileName = file.file_name;
      console.log(`Processing file: ${fileName}`);

      parseExcelData(file.file_path);
    }
  } else {
    console.log("No pending files to process.");
  }
};

const fileUploadToTable = async (req, res) => {
  const { userId, fileName } = req.body;
  if (!userId || !fileName) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const insertedFile = await insertFileDetails(userId, fileName);
    res.status(201).json({
      message: "File uploaded successfully",
      data: insertedFile,
    });
  } catch (error) {
    console.error("Error inserting file details:", error);
    res.status(500).json({ message: "Failed to upload file details" });
  }
};

module.exports = { fileUploadToTable };
