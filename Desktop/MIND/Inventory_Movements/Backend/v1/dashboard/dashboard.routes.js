const express = require("express");
const dashboard = express.Router();
const vendor = require("./vendor.controller");
const categories = require("./categories");
const authenticateToken = require("../../middlewares/authenticateToken");
const {
  updateImage,
  deleteProduct,
  getAllProducts,
  importData,
  getCartData,
  deleteCartData,
  moveToCart,
  postProduct,
} = require("./dashboard.controller");

dashboard.get("/vendor", vendor);
dashboard.get("/categories", categories);
dashboard.get("/cartData", authenticateToken, getCartData);
dashboard.delete("/deleteItem/:id", deleteCartData);
dashboard.put("/product/updateImage", updateImage);
dashboard.delete("/product/:productId", deleteProduct);
dashboard.get("/filterProduct", authenticateToken, getAllProducts);
dashboard.post("/import-data", importData);
dashboard.post("/move-to-cart", moveToCart);
dashboard.post("/product", postProduct);
module.exports = dashboard;
