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
const { Worker } = require("worker_threads");
const path = require("path");
const os = require("os");

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
  const originalFileName = fileName;
  while (existingFile) {
    const parts = originalFileName.split(".");
    if (parts.length > 1) {
      const ext = parts.pop();
      fileName = parts.join(".") + `(${counter}).` + ext;
    } else {
      fileName = originalFileName + `(${counter})`;
    } //remove code
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
  if (!headerMapping) throw new Error("Required columns not found"); //

  const totalRows = worksheet.rowCount;
  const chunkSize = 1000;
  let chunks = [];

  for (let i = 2; i <= totalRows; i += chunkSize) {
    const chunkEnd = Math.min(i + chunkSize - 1, totalRows);
    let chunkRows = [];
    for (let r = i; r <= chunkEnd; r++) {
      chunkRows.push(worksheet.getRow(r).values.slice(1));
    }
    chunks.push(chunkRows);
  }

  const results = await processChunksConcurrently(chunks, headerMapping);
  let validRecords = [];
  let invalidRecords = [];
  results.forEach((result) => {
    validRecords = validRecords.concat(result.validRecords);
    invalidRecords = invalidRecords.concat(result.invalidRecords);
  });

  let errorFileUrl = "";
  if (invalidRecords.length > 0) {
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

  await insertValidRecords(validRecords);
  await updateFileSummary(fileId, summary);
  return { ...summary, validRecords, invalidRecords };
};

const processChunksConcurrently = async (chunks, headerMapping) => {
  const maxWorkers = os.cpus().length;
  // console.log("MAXWORKERS = ", maxWorkers);
  let results = new Array(chunks.length);
  let index = 0;

  async function workerRunner() {
    while (index < chunks.length) {
      const currentIndex = index++;
      try {
        const result = await processChunk(chunks[currentIndex], headerMapping);
        results[currentIndex] = result;
      } catch (err) {
        results[currentIndex] = { validRecords: [], invalidRecords: [] };
        console.error("Worker error:", err);
      }
    }
  }

  let runners = [];
  for (let i = 0; i < maxWorkers; i++) {
    runners.push(workerRunner());
  }
  await Promise.all(runners);
  return results;
};

const processChunk = (chunkRows, headerMapping) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "worker.js"), {
      workerData: { chunkRows, headerMapping, VALID_VENDORS, VALID_CATEGORIES },
    });
    worker.on("message", (result) => resolve(result));
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
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
  let mapping = {};
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
  ) {
    return null;
  }
  return mapping;
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
      record.errors.join(" | "),
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
        await insertProductWithVendors(record, trx);
      } catch (e) {
        console.error("Error inserting record:", e);
      }
    }
  });
};

module.exports = { insertFileDetails, parseExcelData };
