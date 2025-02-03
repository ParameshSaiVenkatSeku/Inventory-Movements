const {
  insertFileData,
  updateFileSummary,
  updateFileProcessingSummary,
  getFileDetailsByUrl,
  getFileDetailsByFileName,
  insertProductWithVendors,
  db,
} = require("./import.queries");
const { getFileData, uploadBufferToS3 } = require("../../AWS/aws.controller");
const ExcelJS = require("exceljs");
const Joi = require("joi");

const VALID_VENDORS = ["Zomato", "Swiggy", "Amazon", "Flipkart", "Blinkit"];
const VALID_CATEGORIES = [
  "Electronics",
  "Furniture",
  "Clothing",
  "Food & Beverages",
  "Health & Beauty",
  "Sports & Outdoors",
  "Toys & Games",
  "Office Supplies",
  "Books & Stationery",
];

const insertFileDetails = async (userId, fileName) => {
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
  return await insertFileData(userId, fileName, filePath);
};

const parseExcelData = async (fileUrl) => {
  const fileDetails = await getFileDetailsByUrl(fileUrl);
  if (!fileDetails) throw new Error("File details not found");
  const {
    id: fileId,
    user_id: userId,
    file_name: originalFileName,
  } = fileDetails;
  await updateFileProcessingSummary(Math.trunc(fileId));
  const bufferData = await getFileData(fileUrl);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bufferData);
  const worksheet = workbook.worksheets[0];
  const headerMapping = buildHeaderMapping(worksheet.getRow(1));
  if (!headerMapping) throw new Error("Required columns not found");
  const totalRows = worksheet.rowCount;
  let validRecords = [];
  let invalidRecords = [];
  const chunkSize = 100;
  for (let i = 2; i <= totalRows; i += chunkSize) {
    const chunkEnd = Math.min(i + chunkSize - 1, totalRows);
    for (let r = i; r <= chunkEnd; r++) {
      const rowValues = worksheet.getRow(r).values.slice(1);
      const { dataObj, errorMessages } = mapRowToObject(
        rowValues,
        headerMapping
      );
      if (errorMessages.length)
        invalidRecords.push({ ...dataObj, errors: errorMessages });
      else validRecords.push(dataObj);
    }
  }
  let errorFileUrl = "";
  if (invalidRecords.length) {
    errorFileUrl = await generateAndUploadErrorExcel(
      invalidRecords,
      originalFileName,
      userId
    );
  }
  const summary = {
    totalRecords: totalRows - 1,
    successRecords: validRecords.length,
    failedRecords: invalidRecords.length,
    errorFileUrl,
  };
  await updateFileSummary(fileId, summary);
  await insertValidRecords(validRecords);
  return { ...summary, validRecords, invalidRecords };
};

const buildHeaderMapping = (headerRow) => {
  const expected = [
    { key: "productName", match: "product" },
    { key: "vendors", match: "vendor" },
    { key: "category", match: "category" },
    { key: "status", match: "status" },
    { key: "quantity", match: "quantity" },
    { key: "unitPrice", match: "price" },
  ];
  const mapping = {};
  headerRow.eachCell((cell, colNumber) => {
    const headerText = cell.text.toString().toLowerCase().replace(/\s+/g, "");
    expected.forEach((exp) => {
      if (headerText.includes(exp.match)) mapping[exp.key] = colNumber - 1;
    });
  });
  if (
    mapping.productName === undefined ||
    mapping.vendors === undefined ||
    mapping.category === undefined ||
    mapping.quantity === undefined ||
    mapping.unitPrice === undefined
  )
    return null;
  return mapping;
};

const rowSchema = Joi.object({
  productName: Joi.string()
    .regex(/^[a-zA-Z0-9\s\-_,.]+$/)
    .required(),
  vendors: Joi.string()
    .required()
    .custom((value, helpers) => {
      const vendors = value.split(",").map((v) => v.trim());
      for (let v of vendors) {
        if (!VALID_VENDORS.includes(v)) return helpers.error("any.invalid");
      }
      return value;
    }),
  category: Joi.string()
    .valid(...VALID_CATEGORIES)
    .required(),
  status: Joi.string().allow(""),
  quantity: Joi.number().min(0).required(),
  unitPrice: Joi.number().min(0).required(),
});

const mapRowToObject = (rowValues, mapping) => {
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
      rowValues[mapping.quantity] !== undefined &&
      !isNaN(Number(rowValues[mapping.quantity]))
        ? Number(rowValues[mapping.quantity])
        : null,
    unitPrice:
      rowValues[mapping.unitPrice] !== undefined &&
      !isNaN(Number(rowValues[mapping.unitPrice]))
        ? Number(rowValues[mapping.unitPrice])
        : null,
  };
  const { error } = rowSchema.validate({ ...dataObj }, { abortEarly: false });
  let errorMessages = [];
  if (error) errorMessages = error.details.map((e) => e.message);
  else dataObj.vendors = dataObj.vendors.split(",").map((v) => v.trim());
  return { dataObj, errorMessages };
};

const generateAndUploadErrorExcel = async (
  invalidRecords,
  originalFileName,
  userId
) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Invalid Records");
  worksheet.addRow([
    "product_name",
    "vendor_name",
    "category_name",
    "status",
    "quantity_in_stock",
    "unit_price",
    "Errors",
  ]);
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
  const buffer = await workbook.xlsx.writeBuffer();
  return await uploadBufferToS3(
    buffer,
    `error_${originalFileName}`,
    `imported-files/${userId}`
  );
};

const insertValidRecords = async (validRecords) => {
  await db.transaction(async (trx) => {
    for (const record of validRecords) {
      try {
        console.log(record);
        await insertProductWithVendors(record, trx);
      } catch (e) {}
    }
  });
};

module.exports = { insertFileDetails, parseExcelData };
