const knex = require("knex");
const knexConfig = require("../../knexfile");
const db = knex(knexConfig);

const insertFileData = async (userId, fileName, filePath) => {
  try {
    const [insertedFile] = await db("file_uploads")
      .insert({
        user_id: userId,
        file_name: fileName,
        file_path: filePath,
        status: "pending",
      })
      .returning("*");
    return insertedFile;
  } catch (error) {
    throw new Error("Error inserting file data into the database");
  }
};

const getPendingFileNames = async () => {
  const query = await db("file_uploads")
    .select("id", "file_name", "file_path")
    .where("status", "pending");
  return query;
};

const getFileDetailsByUrl = async (fileUrl) => {
  return await db("file_uploads").where({ file_path: fileUrl }).first();
};

const updateFileProcessingSummary = async (fileId) => {
  const updatedStatus = await db("file_uploads")
    .where("id", fileId)
    .update("status", "processing");
  return updatedStatus;
};

const updateFileSummary = async (fileId, summary) => {
  const updated = await db("file_uploads")
    .where("id", fileId)
    .update({
      total_records: summary.totalRecords,
      success_records: summary.successRecords,
      failed_records: summary.failedRecords,
      error_file_url: summary.errorFileUrl,
      status: "completed",
    })
    .returning("*");
  return updated;
};

const getFileDetailsByFileName = async (userId, fileName) => {
  try {
    const file = await db("file_uploads")
      .where({ user_id: userId, file_name: fileName })
      .first();
    return file;
  } catch (error) {
    console.error("Error querying file by fileName:", error);
    throw error;
  }
};

module.exports = {
  insertFileData,
  getPendingFileNames,
  updateFileProcessingSummary,
  updateFileSummary,
  getFileDetailsByUrl,
  getFileDetailsByFileName,
};
