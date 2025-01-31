const knex = require("knex");
const knexConfig = require("../../knexfile");
const db = knex(knexConfig);

const insertFileData = async (userId, fileName, filePath) => {
  try {
    console.log("queries.js - 7", userId, fileName, filePath);
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
    .select("file_name", "file_path")
    .where("status", "pending");
  // console.log(query);
  return query;
};

module.exports = { insertFileData, getPendingFileNames };
