const knex = require("knex");
const knexConfig = require("../../knexfile");
const db = knex(knexConfig);

const insertFileData = async (userId, fileName, filePath) => {
  const insertedIds = await db("file_uploads").insert({
    user_id: userId,
    file_name: fileName,
    file_path: filePath,
    status: "pending",
  });
  return { id: insertedIds[0], file_name: fileName, file_path: filePath };
};

const getPendingFileNames = async () => {
  return await db("file_uploads")
    .select("id", "file_name", "file_path")
    .where("status", "pending")
    .orWhere("status", "processing");
};

const getFileDetailsByUrl = async (fileUrl) => {
  return await db("file_uploads").where({ file_path: fileUrl }).first();
};

const updateFileProcessingSummary = async (fileId) => {
  return await db("file_uploads")
    .where("id", fileId)
    .update("status", "processing");
};

const updateFileSummary = async (fileId, summary) => {
  await db("file_uploads").where("id", fileId).update({
    total_records: summary.totalRecords,
    success_records: summary.successRecords,
    failed_records: summary.failedRecords,
    error_file_url: summary.errorFileUrl,
    status: "completed",
  });
};

const getFileUploadsByUser = async (user_id, limit, offset) => {
  return await db("file_uploads")
    .select(
      "file_name",
      "success_records",
      "failed_records",
      "status",
      "error_file_url"
    )
    .where("user_id", user_id)
    .orderBy("created_at", "desc")
    .limit(limit)
    .offset(offset);
};

const getFileDetailsByFileName = async (userId, fileName) => {
  return await db("file_uploads")
    .where({ user_id: userId, file_name: fileName })
    .first();
};

const getCategoryByName = async (name) => {
  return await db("categories").where("category_name", name).first();
};

const getVendorByName = async (name) => {
  return await db("vendors").where("vendor_name", name).first();
};

const insertProduct = async (productData, trx = db) => {
  const insertedIds = await trx("products").insert(productData);
  console.log("import queries -  74", insertedIds[0]);
  return insertedIds[0];
};

const insertProductToVendor = async (productId, vendorId, trx = db) => {
  return await trx("product_to_vendors").insert({
    vendor_id: vendorId,
    product_id: productId,
    status: "0",
  });
};

const insertProductWithVendors = async (record, trx = db) => {
  const category = await getCategoryByName(record.category);
  if (!category) throw new Error("Invalid category");
  const productData = {
    product_name: record.productName,
    category_id: category.category_id,
    quantity_in_stock: record.quantity,
    unit_price: record.unitPrice,
    status:
      record.status && ["0", "1", "2", "99"].includes(record.status)
        ? record.status
        : "1",
  };
  const productId = await insertProduct(productData, trx);
  // console.log("import queries - 99", productId);
  for (const vendorName of record.vendors) {
    const vendor = await getVendorByName(vendorName);
    if (!vendor) throw new Error("Invalid vendor");
    await insertProductToVendor(productId, vendor.vendor_id, trx);
  }
  return productId;
};

const getAllVendorNames = async () => {
  const vendors = await db("vendors").select("vendor_name");
  return vendors.map((v) => v.vendor_name);
};

const getAllCategoryNames = async () => {
  const categories = await db("categories").select("category_name");
  return categories.map((c) => c.category_name);
};

const getAllVendorMapping = async (trx = db) => {
  const vendors = await trx("vendors").select("vendor_name", "vendor_id");
  return vendors.reduce((acc, cur) => {
    acc[cur.vendor_name] = cur.vendor_id;
    return acc;
  }, {});
};

const getAllCategoryMapping = async (trx = db) => {
  const categories = await trx("categories").select(
    "category_name",
    "category_id"
  );
  return categories.reduce((acc, cur) => {
    acc[cur.category_name] = cur.category_id;
    return acc;
  }, {});
};

module.exports = {
  insertFileData,
  getPendingFileNames,
  getFileDetailsByUrl,
  updateFileProcessingSummary,
  updateFileSummary,
  getFileUploadsByUser,
  getFileDetailsByFileName,
  getCategoryByName,
  getVendorByName,
  insertProduct,
  insertProductToVendor,
  insertProductWithVendors,
  getAllVendorNames,
  getAllCategoryNames,
  getAllVendorMapping,
  getAllCategoryMapping,
  db,
};
