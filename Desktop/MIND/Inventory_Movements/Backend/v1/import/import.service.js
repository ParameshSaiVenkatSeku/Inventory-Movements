const { insertFileData } = require("./import.queries");
const { getFileData } = require("../../AWS/aws.controller");
const ExcelJS = require("exceljs");
const Joi = require("joi");
const path = require("path");

const insertFileDetails = async (userId, fileName) => {
  try {
    const filePath = `https://akv-interns.s3.ap-south-1.amazonaws.com/AKV0779/imported-files/${userId}/${fileName}`;
    return await insertFileData(userId, fileName, filePath);
  } catch (error) {
    throw new Error("Error in inserting file details");
  }
};

const parseExcelData = async (fileUrl) => {
  const bufferData = await getFileData(fileUrl);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bufferData);
  const worksheet = workbook.worksheets[0];
  const rows = [];

  worksheet.eachRow((row) => {
    rows.push(row.values.slice(1));
  });

  return validateExcelData(rows);
};

const validateExcelData = async (rows) => {
  const schema = Joi.object({
    productName: Joi.string().required(),
    vendor: Joi.string().required(),
    category: Joi.string().required(),
    status: Joi.string().allow(""),
    quantity: Joi.number().required(),
    unitPrice: Joi.number().required(),
  });

  const formattedRows = rows.map((row) => ({
    productName: row[0],
    vendor: row[1],
    category: row[2],
    status: row[3] || "",
    quantity: row[4],
    unitPrice: row[5],
  }));

  const validRows = [];
  const invalidRows = [];

  formattedRows.forEach((row, index) => {
    const { error } = schema.validate(row, { abortEarly: false });
    if (error) {
      invalidRows.push({
        ...row,
        errors: error.details.map((err) => err.message),
      });
    } else {
      validRows.push(row);
    }
  });

  return generateErrorFile(
    invalidRows,
    validRows.length,
    invalidRows.length,
    formattedRows.length
  );
};

const generateErrorFile = async (
  invalidRows,
  successCount,
  failedCount,
  totalRecords
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Invalid Records");
  worksheet.addRow([
    "Product Name",
    "Vendor",
    "Category",
    "Status",
    "Quantity",
    "Unit Price",
    "Errors",
  ]);

  invalidRows.forEach((row) => {
    worksheet.addRow([
      ...Object.values(row).slice(0, 6),
      row.errors.join(", "),
    ]);
  });

  const errorFilePath = path.join(__dirname, `errors_${Date.now()}.xlsx`);
  await workbook.xlsx.writeFile(errorFilePath);

  return { successCount, failedCount, totalRecords, errorFilePath };
};

module.exports = { insertFileDetails, parseExcelData, validateExcelData };
