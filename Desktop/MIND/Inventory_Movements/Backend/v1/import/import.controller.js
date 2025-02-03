const { insertFileDetails, parseExcelData } = require("./import.service");
const {
  getPendingFileNames,
  getFileUploadsByUser,
} = require("./import.queries");
const cron = require("node-cron");

// Run the cron job every minute.
cron.schedule("* * * * *", () => {
  console.log("Cron is executing...");
  startValidation();
});

const startValidation = async () => {
  try {
    const pendingFiles = await getPendingFileNames();
    if (pendingFiles && pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        console.log(`Processing file: ${file.file_name}`);
        // parseExcelData spawns worker threads for processing chunks.
        parseExcelData(file.file_path);
      }
    } else {
      console.log("No pending files to process.");
    }
  } catch (err) {
    console.error("Error during validation:", err);
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

const getDataFromTable = async (req, res) => {
  try {
    const userId = req.params.id;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 5;
    const offset = (page - 1) * limit;
    const data = await getFileUploadsByUser(userId, limit, offset);
    res.status(200).json({
      message: "Data retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
};

module.exports = { fileUploadToTable, getDataFromTable };
