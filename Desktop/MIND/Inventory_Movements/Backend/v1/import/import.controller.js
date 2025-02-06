const { insertFileDetails, parseExcelData } = require("./import.service");
const {
  getPendingFileNames,
  getFileUploadsByUser,
} = require("./import.queries");
const cron = require("node-cron");

cron.schedule("* * * * *", () => {
  // console.log("Cron is executing...");
  startValidation();
});

const startValidation = async () => {
  try {
    const pendingFiles = await getPendingFileNames();
    if (pendingFiles && pendingFiles.length > 0) {
      for (const file of pendingFiles) {
        console.log(`Processing file: ${file.file_name}`);
        parseExcelData(file.file_path).catch((err) =>
          console.error("Error processing file:", err)
        );
      }
    } else {
      // console.log("No pending files to process.");
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 5;
    const offset = (page - 1) * limit;

    const userId = req.params.id;
    const data = await getFileUploadsByUser(userId, limit, offset);

    res.status(200).json({
      message: "Data retrieved successfully",
      data: data,
      pagination: { page, limit, offset },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
};

module.exports = { fileUploadToTable, getDataFromTable };
