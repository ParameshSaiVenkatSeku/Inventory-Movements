const { insertFileDetails, parseExcelData } = require("./import.service");
const {
  getPendingFileNames,
  getFileUploadsByUser,
} = require("./import.queries");
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

const getDataFromTable = async (req, res) => {
  try {
    const id = req.params.id,
      page = 1,
      limit = 3,
      offset = (page - 1) * limit;
    const data = await getFileUploadsByUser(id, limit, offset);
    res.status(200).json({
      message: "Data retrieved successfully",
      data: data,
    });
  } catch (error) {
    console.error("Error fetching data from table:", error);
    res.status(500).json({ message: "Failed to fetch data" });
  }
};

module.exports = { fileUploadToTable, getDataFromTable };
