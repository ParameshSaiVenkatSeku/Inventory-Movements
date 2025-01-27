const express = require("express");
const dashboard = express.Router();
const multer = require("multer");
const vendor = require("./vendor.controller");
const categories = require("./categories");
const {
  updateimage,
  deleteProduct,
  getAllProducts,
  importData,
  getCartData,
  deleteCartData,
  decreaseCartQuantityAndUpdateStock,
} = require("./product.controller");
const upload = multer({ dest: "uploads/" });

dashboard.get("/vendor", vendor);
dashboard.get("/categories", categories);
dashboard.get("/cartData", getCartData);
dashboard.delete("/deleteItem/:id", deleteCartData);
dashboard.put("/product/updateimage", updateimage);
dashboard.delete("/product/:productId", deleteProduct);
dashboard.get("/filterProduct", getAllProducts);
dashboard.post("/import-data", importData);

module.exports = dashboard;
