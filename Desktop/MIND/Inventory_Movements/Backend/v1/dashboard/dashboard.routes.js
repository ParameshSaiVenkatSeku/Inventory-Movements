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

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard-related operations
 */

/**
 * @swagger
 * /dashboard/vendor:
 *   get:
 *     summary: Fetch vendor details.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Vendor details fetched successfully.
 */
dashboard.get("/vendor", vendor);

/**
 * @swagger
 * /dashboard/categories:
 *   get:
 *     summary: Fetch all categories.
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Categories fetched successfully.
 */
dashboard.get("/categories", categories);

/**
 * @swagger
 * /dashboard/cartData:
 *   get:
 *     summary: Get user cart data.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart data retrieved successfully.
 *       401:
 *         description: Unauthorized.
 */
dashboard.get("/cartData", authenticateToken, getCartData);

/**
 * @swagger
 * /dashboard/deleteItem/{id}:
 *   delete:
 *     summary: Delete item from cart.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: id
 *         description: The ID of the item to delete.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item deleted successfully.
 *       404:
 *         description: Item not found.
 */
dashboard.delete("/deleteItem/:id", deleteCartData);

/**
 * @swagger
 * /dashboard/product/updateImage:
 *   put:
 *     summary: Update product image.
 *     tags: [Dashboard]
 *     requestBody:
 *       description: Data for updating the product image.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               imageUrl:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product image updated successfully.
 */
dashboard.put("/product/updateImage", updateImage);

/**
 * @swagger
 * /dashboard/product/{productId}:
 *   delete:
 *     summary: Delete a product.
 *     tags: [Dashboard]
 *     parameters:
 *       - in: path
 *         name: productId
 *         description: The ID of the product to delete.
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product deleted successfully.
 *       404:
 *         description: Product not found.
 */
dashboard.delete("/product/:productId", deleteProduct);

/**
 * @swagger
 * /dashboard/filterProduct:
 *   get:
 *     summary: Get all products with filtering.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category.
 *       - in: query
 *         name: priceRange
 *         schema:
 *           type: string
 *         description: Filter by price range.
 *     responses:
 *       200:
 *         description: Products retrieved successfully.
 */
dashboard.get("/filterProduct", getAllProducts);

/**
 * @swagger
 * /dashboard/import-data:
 *   post:
 *     summary: Import bulk product data.
 *     tags: [Dashboard]
 *     requestBody:
 *       description: Import data payload.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *     responses:
 *       200:
 *         description: Bulk product data imported successfully.
 */
dashboard.post("/import-data", importData);

/**
 * @swagger
 * /dashboard/move-to-cart:
 *   post:
 *     summary: Move product to cart.
 *     tags: [Dashboard]
 *     requestBody:
 *       description: Details of the product to move to cart.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               userId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product moved to cart successfully.
 */
dashboard.post("/move-to-cart", moveToCart);

/**
 * @swagger
 * /dashboard/product:
 *   post:
 *     summary: Add a new product.
 *     tags: [Dashboard]
 *     requestBody:
 *       description: Product details.
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Product added successfully.
 *       400:
 *         description: Invalid product data.
 */
dashboard.post("/product", postProduct);

module.exports = dashboard;
