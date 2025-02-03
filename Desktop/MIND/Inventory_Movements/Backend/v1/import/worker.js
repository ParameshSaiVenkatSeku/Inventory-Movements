const { parentPort, workerData } = require("worker_threads");
const Joi = require("joi");

const { chunkRows, headerMapping, VALID_VENDORS, VALID_CATEGORIES } =
  workerData;

const rowSchema = Joi.object({
  productName: Joi.string()
    .regex(/^[a-zA-Z0-9\s\-_,.]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Product Name must only contain letters, numbers, spaces, hyphens, underscores, commas, or periods.",
      "string.empty": "Product Name cannot be empty.",
      "any.required": "Product Name is required.",
    }),
  vendors: Joi.string()
    .required()
    .custom((value, helpers) => {
      const vendors = value.split(",").map((v) => v.trim());
      if (!vendors.length) return helpers.error("string.empty");
      for (let v of vendors) {
        if (!VALID_VENDORS.includes(v)) return helpers.error("any.invalid");
      }
      return value;
    })
    .messages({
      "any.invalid": `Vendor is invalid. Allowed vendors are: ${VALID_VENDORS.join(
        ", "
      )}.`,
      "string.empty": "Vendor field cannot be empty.",
      "any.required": "Vendor field is required.",
    }),
  category: Joi.string()
    .valid(...VALID_CATEGORIES)
    .required()
    .messages({
      "any.only": `Category is invalid. Allowed categories are: ${VALID_CATEGORIES.join(
        ", "
      )}.`,
      "string.empty": "Category cannot be empty.",
      "any.required": "Category is required.",
    }),
  status: Joi.string().allow("").messages({
    "string.base": "Status must be a string.",
  }),
  quantity: Joi.number().min(0).required().messages({
    "number.base": "Quantity must be a number.",
    "number.min": "Quantity must be at least 0.",
    "any.required": "Quantity is required.",
  }),
  unitPrice: Joi.number().min(0).required().messages({
    "number.base": "Unit Price must be a number.",
    "number.min": "Unit Price must be at least 0.",
    "any.required": "Unit Price is required.",
  }),
});

const processRow = (rowValues) => {
  const dataObj = {
    productName: rowValues[headerMapping.productName]
      ? rowValues[headerMapping.productName].toString().trim()
      : "",
    vendors: rowValues[headerMapping.vendors]
      ? rowValues[headerMapping.vendors].toString().trim()
      : "",
    category: rowValues[headerMapping.category]
      ? rowValues[headerMapping.category].toString().trim()
      : "",
    status:
      headerMapping.status !== undefined && rowValues[headerMapping.status]
        ? rowValues[headerMapping.status].toString().trim()
        : "",
    quantity:
      rowValues[headerMapping.quantity] !== undefined &&
      !isNaN(Number(rowValues[headerMapping.quantity]))
        ? Number(rowValues[headerMapping.quantity])
        : null,
    unitPrice:
      rowValues[headerMapping.unitPrice] !== undefined &&
      !isNaN(Number(rowValues[headerMapping.unitPrice]))
        ? Number(rowValues[headerMapping.unitPrice])
        : null,
  };

  const { error } = rowSchema.validate(dataObj, { abortEarly: false });
  let errorMessages = [];
  if (error) {
    errorMessages = error.details.map((e) => e.message);
  } else {
    dataObj.vendors = dataObj.vendors.split(",").map((v) => v.trim());
  }
  return { dataObj, errorMessages };
};

let validRecords = [];
let invalidRecords = [];

for (const rowValues of chunkRows) {
  const { dataObj, errorMessages } = processRow(rowValues);
  if (errorMessages.length > 0) {
    invalidRecords.push({ ...dataObj, errors: errorMessages });
  } else {
    validRecords.push(dataObj);
  }
}

parentPort.postMessage({ validRecords, invalidRecords });
