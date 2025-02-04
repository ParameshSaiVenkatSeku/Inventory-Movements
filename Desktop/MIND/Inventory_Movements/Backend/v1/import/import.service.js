const {
  insertFileData,
  updateFileSummary,
  updateFileProcessingSummary,
  getFileDetailsByUrl,
  getFileDetailsByFileName,
  getAllVendorNames,
  getAllCategoryNames,
  db,
} = require("./import.queries");
const { getFileData, uploadBufferToS3 } = require("../../AWS/aws.controller");
const ExcelJS = require("exceljs");
const { Worker } = require("worker_threads");
const path = require("path");
const os = require("os");
const _ = require("underscore");

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

  const allRows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      allRows.push(row.values.slice(1));
    }
  });
  const chunks = _.chunk(allRows, 500);

  const validVendorNames = await getAllVendorNames();
  const validCategoryNames = await getAllCategoryNames();

  const maxWorkers = os.cpus().length;
  let totalValidCount = 0;
  let allInvalidRecords = [];

  let index = 0;
  async function workerRunner() {
    while (index < chunks.length) {
      const currentIndex = index++;
      try {
        const { validCount, invalidRecords } = await processChunkAndInsert(
          chunks[currentIndex],
          headerMapping,
          validVendorNames,
          validCategoryNames
        );
        totalValidCount += validCount;
        allInvalidRecords = allInvalidRecords.concat(invalidRecords);
      } catch (err) {
        console.error("Error processing chunk:", err);
      }
    }
  }
  const runners = [];
  for (let i = 0; i < maxWorkers; i++) {
    runners.push(workerRunner());
  }
  await Promise.all(runners);

  let errorFileUrl = "";
  if (allInvalidRecords.length > 0) {
    errorFileUrl = await generateAndUploadErrorExcel(
      allInvalidRecords,
      originalFileName,
      userId
    );
  }
  const summary = {
    totalRecords: allRows.length,
    successRecords: totalValidCount,
    failedRecords: allInvalidRecords.length,
    errorFileUrl,
  };

  await updateFileSummary(fileId, summary);
  return {
    ...summary,
    validRecordsInserted: totalValidCount,
    invalidRecords: allInvalidRecords,
  };
};

const processChunkAndInsert = async (
  chunkRows,
  headerMapping,
  validVendorNames,
  validCategoryNames
) => {
  const result = await processChunk(
    chunkRows,
    headerMapping,
    validVendorNames,
    validCategoryNames
  );
  let validCount = 0;
  if (result.validRecords.length > 0) {
    await insertValidRecords(result.validRecords);
    validCount = result.validRecords.length;
  }
  return { validCount, invalidRecords: result.invalidRecords };
};

const processChunk = (
  chunkRows,
  headerMapping,
  validVendorNames,
  validCategoryNames
) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(path.join(__dirname, "worker.js"), {
      workerData: {
        chunkRows,
        headerMapping,
        validVendorNames,
        validCategoryNames,
      },
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
    try {
      const {
        getAllCategoryMapping,
        getAllVendorMapping,
      } = require("./import.queries");
      const categoryMapping = await getAllCategoryMapping(trx);
      const vendorMapping = await getAllVendorMapping(trx);

      const productInserts = validRecords.map((record) => ({
        product_name: record.productName,
        category_id: categoryMapping[record.category],
        quantity_in_stock: record.quantity,
        unit_price: record.unitPrice,
        status:
          record.status && ["0", "1", "2", "99"].includes(record.status)
            ? record.status
            : "1",
      }));

      const insertedProductIds = await trx("products")
        .insert(productInserts)
        .returning("id");

      const productToVendorInserts = [];
      validRecords.forEach((record, idx) => {
        const productId = insertedProductIds[idx];
        record.vendors.forEach((vendorName) => {
          const vendorId = vendorMapping[vendorName];
          if (vendorId) {
            productToVendorInserts.push({
              product_id: productId,
              vendor_id: vendorId,
              status: "0",
            });
          }
        });
      });

      if (productToVendorInserts.length > 0) {
        await trx("product_to_vendors").insert(productToVendorInserts);
      }
      await trx.commit();
    } catch (error) {
      await trx.rollback();
      console.error("Error during batch insert:", error);
      throw error;
    }
  });
};

module.exports = { insertFileDetails, parseExcelData };
