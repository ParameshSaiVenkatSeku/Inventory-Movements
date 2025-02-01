const {
  insertFileData,
  updateFileSummary,
  updateFileProcessingSummary,
  getFileDetailsByUrl,
  getFileDetailsByFileName,
} = require("./import.queries");
const { getFileData, uploadBufferToS3 } = require("../../AWS/aws.controller");
const ExcelJS = require("exceljs");
const Joi = require("joi");

const insertFileDetails = async (userId, fileName) => {
  console.log("[insertFileDetails] Inserting file details for:", {
    userId,
    fileName,
  });

  let existingFile = await getFileDetailsByFileName(userId, fileName);
  let counter = 1;
  let originalFileName = fileName;
  while (existingFile) {
    const parts = originalFileName.split(".");
    if (parts.length > 1) {
      const ext = parts.pop();
      fileName = parts.join(".") + `(${counter}).` + ext;
    } else {
      fileName = originalFileName + `(${counter})`;
    }
    counter++;
    existingFile = await getFileDetailsByFileName(userId, fileName);
  }

  const filePath = `https://akv-interns.s3.ap-south-1.amazonaws.com/AKV0779/imported-files/${userId}/${fileName}`;
  const result = await insertFileData(userId, fileName, filePath);
  console.log("[insertFileDetails] File details inserted:", result);
  return result;
};

const parseExcelData = async (fileUrl) => {
  console.log("[parseExcelData] Starting Excel parsing for fileUrl:", fileUrl);
  const fileDetails = await getFileDetailsByUrl(fileUrl);
  if (!fileDetails) throw new Error("File details not found for given URL");
  console.log("[parseExcelData] Retrieved file details:", fileDetails);

  const {
    id: fileId,
    user_id: userId,
    file_name: originalFileName,
  } = fileDetails;
  await updateFileProcessingSummary(Math.trunc(fileId));
  console.log(
    "[parseExcelData] Updated file status to processing for fileId:",
    fileId
  );

  const bufferData = await getFileData(fileUrl);
  console.log("[parseExcelData] Retrieved file data from S3.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bufferData);
  console.log("[parseExcelData] Workbook loaded from buffer.");
  const worksheet = workbook.worksheets[0];
  console.log(
    "[parseExcelData] Worksheet extracted. Total rows:",
    worksheet.rowCount
  );

  const headerRow = worksheet.getRow(1);
  const headerMapping = buildHeaderMapping(headerRow);
  console.log("[parseExcelData] Header mapping:", headerMapping);
  if (!headerMapping) throw new Error("Required columns not found in header");

  const totalRows = worksheet.rowCount;
  let validRecords = [];
  let invalidRecords = [];
  const chunkSize = 100;
  console.log(`[parseExcelData] Processing ${totalRows - 1} rows in chunks...`);

  for (let i = 2; i <= totalRows; i += chunkSize) {
    const chunkEnd = Math.min(i + chunkSize - 1, totalRows);
    console.log(`[parseExcelData] Processing rows ${i} to ${chunkEnd}`);
    for (let r = i; r <= chunkEnd; r++) {
      const row = worksheet.getRow(r);
      const rowValues = row.values.slice(1); // remove first undefined element
      const { dataObj, errorMessages } = mapRowToObject(
        rowValues,
        headerMapping
      );

      if (errorMessages.length > 0) {
        invalidRecords.push({ ...dataObj, errors: errorMessages });
      } else {
        validRecords.push(dataObj);
      }
    }
  }
  console.log("[parseExcelData] Validation complete:", {
    totalRecords: totalRows - 1,
    successRecords: validRecords.length,
    failedRecords: invalidRecords.length,
  });

  let errorFileUrl = "";
  if (invalidRecords.length > 0) {
    console.log(
      "[parseExcelData] Generating error Excel file for invalid records..."
    );
    errorFileUrl = await generateAndUploadErrorExcel(
      invalidRecords,
      originalFileName,
      userId
    );
    console.log("[parseExcelData] Error file uploaded to S3 at:", errorFileUrl);
  }

  const summary = {
    totalRecords: totalRows - 1,
    successRecords: validRecords.length,
    failedRecords: invalidRecords.length,
    errorFileUrl,
  };
  console.log("[parseExcelData] Summary of processing:", summary);

  await updateFileSummary(fileId, summary);
  console.log(
    "[parseExcelData] Updated file summary in DB for fileId:",
    fileId
  );
  return { ...summary, validRecords, invalidRecords };
};

const buildHeaderMapping = (headerRow) => {
  console.log("[buildHeaderMapping] Building header mapping...");
  const expected = [
    { key: "productName", match: "product" },
    { key: "vendors", match: "vendor" },
    { key: "category", match: "category" },
    { key: "status", match: "status" },
    { key: "quantity", match: "quantity" },
    { key: "unitPrice", match: "unit" },
  ];
  const mapping = {};
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const headerText = cell.text.toString().toLowerCase().replace(/\s+/g, "");
    expected.forEach((exp) => {
      if (headerText.includes(exp.match)) {
        // Use colNumber-1 because we are later slicing row.values from index 1.
        mapping[exp.key] = colNumber - 1;
      }
    });
  });
  console.log("[buildHeaderMapping] Mapping result:", mapping);
  if (
    mapping.productName === undefined ||
    mapping.vendors === undefined ||
    mapping.category === undefined ||
    mapping.quantity === undefined ||
    mapping.unitPrice === undefined
  ) {
    console.error("[buildHeaderMapping] Missing required columns.");
    return null;
  }
  return mapping;
};

// Updated Joi Schema with more detailed custom messages
const rowSchema = Joi.object({
  productName: Joi.string()
    .regex(/^[a-zA-Z0-9\s\-_,.]+$/)
    .required()
    .label("Product Name")
    .messages({
      "string.empty": "Product Name is required.",
      "any.required": "Product Name is required.",
      "string.pattern.base":
        "Product Name contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, commas, and periods are allowed.",
    }),
  vendors: Joi.string()
    .regex(/^[a-zA-Z0-9\s\-_,.]+$/)
    .required()
    .label("Vendor")
    .messages({
      "string.empty": "Vendor is required.",
      "any.required": "Vendor is required.",
      "string.pattern.base":
        "Vendor contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, commas, and periods are allowed.",
    }),
  category: Joi.string()
    .regex(/^[a-zA-Z0-9\s\-_,.]+$/)
    .required()
    .label("Category")
    .messages({
      "string.empty": "Category is required.",
      "any.required": "Category is required.",
      "string.pattern.base":
        "Category contains invalid characters. Only letters, numbers, spaces, hyphens, underscores, commas, and periods are allowed.",
    }),
  status: Joi.string().allow("").optional().label("Status").messages({
    "string.base": "Status must be a string.",
  }),
  quantity: Joi.number().min(0).required().label("Quantity").messages({
    "number.base": "Quantity must be a number.",
    "number.min": "Quantity must be a positive number or zero.",
    "any.required": "Quantity is required.",
  }),
  unitPrice: Joi.number().min(0).required().label("Unit Price").messages({
    "number.base": "Unit Price must be a number.",
    "number.min": "Unit Price must be a positive number or zero.",
    "any.required": "Unit Price is required.",
  }),
});

// Updated error formatting function to simply return Joi's message
const formatJoiError = (err) => {
  return err.message;
};

// In your mapRowToObject, ensure that error messages are gathered directly:
const mapRowToObject = (rowValues, mapping) => {
  const isEmpty = (value) => {
    return (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    );
  };
  const dataObj = {
    productName: rowValues[mapping.productName]
      ? rowValues[mapping.productName].toString().trim()
      : "",
    vendors: rowValues[mapping.vendors]
      ? rowValues[mapping.vendors].toString().trim()
      : "",
    category: rowValues[mapping.category]
      ? rowValues[mapping.category].toString().trim()
      : "",
    status:
      mapping.status !== undefined && rowValues[mapping.status]
        ? rowValues[mapping.status].toString().trim()
        : "",
    quantity:
      !isEmpty(rowValues[mapping.quantity]) &&
      !isNaN(Number(rowValues[mapping.quantity]))
        ? Number(rowValues[mapping.quantity])
        : null,
    unitPrice:
      !isEmpty(rowValues[mapping.unitPrice]) &&
      !isNaN(Number(rowValues[mapping.unitPrice]))
        ? Number(rowValues[mapping.unitPrice])
        : null,
  };

  console.log("Mapped Row Data:", dataObj);

  const { error } = rowSchema.validate(dataObj, { abortEarly: false });
  if (error) {
    console.log("Validation Errors:", error.details);
    // Directly use error.details.map(...) to get custom messages
    const errorMessages = error.details.map((err) => err.message);
    return { dataObj, errorMessages };
  } else {
    return { dataObj, errorMessages: [] };
  }
};

// Generates an error Excel file in memory and uploads it directly to S3.
const generateAndUploadErrorExcel = async (
  invalidRecords,
  originalFileName,
  userId
) => {
  console.log(
    "[generateAndUploadErrorExcel] Generating error Excel for",
    invalidRecords.length,
    "invalid records."
  );
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Invalid Records");

  // Add header row.
  worksheet.addRow([
    "product_name",
    "vendor_name",
    "category_name",
    "status",
    "quantity_in_stock",
    "unit_price",
    "Errors",
  ]);

  // Add a row for each invalid record.
  invalidRecords.forEach((record) => {
    worksheet.addRow([
      record.productName,
      record.vendors,
      record.category,
      record.status,
      record.quantity,
      record.unitPrice,
      record.errors.join(", "),
    ]);
  });

  // Generate the Excel file buffer.
  const buffer = await workbook.xlsx.writeBuffer();
  console.log("[generateAndUploadErrorExcel] Error Excel buffer generated.");

  // Build the S3 key.
  const s3Key = `AKV0779/imported-files/${userId}/error_${originalFileName}`;
  console.log(
    `[generateAndUploadErrorExcel] Uploading error Excel to S3 with key: ${s3Key}`
  );

  // Upload the buffer to S3.
  const s3Url = await uploadBufferToS3(
    buffer,
    `error_${originalFileName}`,
    `imported-files/${userId}`
  );
  console.log(
    "[generateAndUploadErrorExcel] Error Excel uploaded to S3 at:",
    s3Url
  );

  return s3Url;
};

module.exports = { insertFileDetails, parseExcelData };
