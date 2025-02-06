const knex = require("knex");
const knexConfig = require("../../knexfile");
const db = knex(knexConfig);

const postProduct = async (req, res) => {
  const {
    productId,
    productName,
    category,
    quantity,
    unit,
    status,
    vendor,
    productImage,
  } = req.body;

  try {
    if (productId) {
      await db("products").where({ product_id: productId }).update({
        product_name: productName,
        category_id: category,
        quantity_in_stock: quantity,
        unit_price: unit,
        status: status,
      });
      await db("product_to_vendors").where({ product_id: productId }).del();
      const vendorData = vendor.map((v) => ({
        vendor_id: v,
        product_id: productId,
        status: "1",
      }));

      await db("product_to_vendors").insert(vendorData);
    } else {
      const [newProductId] = await db("products").insert(
        {
          product_name: productName,
          category_id: category,
          quantity_in_stock: quantity,
          unit_price: unit,
          status: status,
          product_image: productImage,
        },
        ["product_id"]
      );
      const vendorData = vendor.map((v) => ({
        vendor_id: v,
        product_id: newProductId,
        status: "1",
      }));

      await db("product_to_vendors").insert(vendorData);
    }

    const products = await db("products as p")
      .select(
        "p.product_id",
        "p.product_name",
        "p.status",
        "p.quantity_in_stock as quantity",
        "p.unit_price as unit",
        "c.category_name as category",
        db.raw('GROUP_CONCAT(v.vendor_name SEPARATOR ", ") as vendors')
      )
      .leftJoin("categories as c", "p.category_id", "c.category_id")
      .leftJoin("product_to_vendors as pv", "p.product_id", "pv.product_id")
      .leftJoin("vendors as v", "pv.vendor_id", "v.vendor_id")
      .where("p.status", "!=", 99)
      .groupBy("p.product_id");

    res.send({
      data: products,
    });
  } catch (error) {
    console.error("Error inserting/updating product and vendors:", error);
    res.status(500).send({ message: "Error processing the request" });
  }
};

const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  try {
    await db("products")
      .where("product_id", productId)
      .update({ status: "99" });

    await db("product_to_vendors")
      .where("product_id", productId)
      .update({ status: "99" });
    res.send({
      message: "Product soft deleted successfully",
    });
  } catch (error) {
    console.error("Error soft deleting product:", error);
    res.status(500).send({
      message: "Error deleting product",
    });
  }
};

const getAllProducts = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const {
      product_name,
      category_name,
      status,
      page = 1,
      limit = 5,
      searchText,
      filters,
    } = req.query;
    const offset = (page - 1) * limit;
    let selectedFilters = {};
    if (filters) {
      try {
        selectedFilters = JSON.parse(filters);
      } catch (error) {
        return res.status(400).json({ message: "Invalid filters format" });
      }
    }

    const productsData = db("products as p")
      .select(
        "p.product_id",
        "p.product_name",
        "p.product_image",
        "p.status",
        "p.quantity_in_stock",
        "p.unit_price",
        "c.category_name",
        db.raw("GROUP_CONCAT(v.vendor_name) as vendor_name")
      )
      .leftJoin("categories as c", "p.category_id", "c.category_id")
      .leftJoin("product_to_vendors as pv", "p.product_id", "pv.product_id")
      .leftJoin("vendors as v", "pv.vendor_id", "v.vendor_id")
      .groupBy("p.product_id");

    if (searchText) {
      productsData.where((qb) => {
        qb.where("p.product_name", "like", `%${searchText}%`)
          .orWhere("c.category_name", "like", `%${searchText}%`)
          .orWhere("v.vendor_name", "like", `%${searchText}%`);
      });
    }

    Object.keys(selectedFilters).forEach((key) => {
      if (selectedFilters[key] && key !== "filters") {
        if (key === "category_name") {
          productsData.where("c.category_name", "like", `%${category_name}%`);
        } else if (key === "product_name") {
          productsData.where("p.product_name", "like", `%${product_name}%`);
        } else if (key === "vendor_name") {
          productsData.where("v.vendor_name", "like", `%${searchText}%`);
        }
      }
    });

    if (status) {
      productsData.where("p.status", status);
    } else {
      productsData.whereIn("p.status", ["0", "1", "2"]);
    }
    productsData.limit(limit).offset(offset);
    productsData.groupBy("p.product_id");
    productsData.orderBy("c.category_name", "asc");

    const products = await productsData;
    for (const product of products) {
      if (product.quantity_in_stock === 0 && product.status !== "0") {
        await db("products")
          .where("product_id", product.product_id)
          .update({ status: "0" });
        product.status = "0";
      }
    }

    const paginationData = db("products as p")
      .leftJoin("categories as c", "p.category_id", "c.category_id")
      .leftJoin("product_to_vendors as pv", "p.product_id", "pv.product_id")
      .leftJoin("vendors as v", "pv.vendor_id", "v.vendor_id");

    if (product_name) {
      paginationData.where("p.product_name", "like", `%${product_name}%`);
    }
    if (category_name) {
      paginationData.where("c.category_name", "like", `%${category_name}%`);
    }
    if (status) {
      paginationData.where("p.status", status);
    } else {
      paginationData.whereIn("p.status", ["0", "1", "2"]);
    }
    paginationData.groupBy("p.product_id");
    const result = await paginationData
      .count("p.product_id as count")
      .whereIn("p.status", ["0", "1"]);

    const totalCount = result.length;

    const totalPage = Math.ceil(totalCount / limit);

    return res.status(200).json({
      data: products,
      pagination: {
        totalCount,
        currentPage: parseInt(page),
        totalPage,
        perPage: parseInt(limit),
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "interval server error",
    });
  }
};

const updateImage = async (req, res) => {
  const { id, image } = req.body;
  try {
    await db("products")
      .where({ product_id: id })
      .update({ product_image: image });
    res.send({ message: "Product image updated successfully" });
  } catch (error) {
    console.error("Error updating image:", error);
    res.status(500).send({ message: "Error updating product image" });
  }
};

const moveToCart = async (req, res) => {
  const { productId, quantity, vendorName, userId } = req.body;

  const trx = await db.transaction();
  try {
    const product = await trx("products")
      .where("product_id", productId)
      .first();
    if (!product) {
      throw new Error("Product not found");
    }
    if (product.quantity_in_stock < quantity) {
      throw new Error("Not enough stock");
    }

    const vendor = await trx("vendors")
      .select("vendor_id")
      .where("vendor_name", vendorName)
      .first();

    const vendorId = vendor.vendor_id;

    const existingCartItem = await trx("product_carts")
      .where("product_id", productId)
      .andWhere("vendor_id", vendorId)
      .andWhere("user_id", userId.user_id)
      .first();

    if (existingCartItem) {
      await trx("product_carts")
        .where("product_id", productId)
        .andWhere("vendor_id", vendorId)
        .andWhere("user_id", userId.user_id)
        .update({
          quantity: existingCartItem.quantity + quantity,
        });
    } else {
      await trx("product_carts").insert({
        product_id: productId,
        product_name: product.product_name,
        quantity: quantity,
        vendor_id: vendorId,
        vendor_name: vendorName,
        user_id: userId.user_id,
        status: 1,
      });
    }
    await trx("products")
      .where("product_id", productId)
      .update({
        quantity_in_stock: product.quantity_in_stock - quantity,
      });

    await trx.commit();
    res.status(200).send({ message: "Product successfully moved to cart" });
  } catch (error) {
    await trx.rollback();
    console.error("Error processing move:", error);
    res.status(500).send({ message: "Error moving product to cart" });
  }
};

const getCartData = async (req, res) => {
  const userId = req.params.id;
  try {
    const cartItems = await db("product_carts").select(
      "product_id",
      "product_name",
      "quantity",
      "vendor_name"
    );

    res.status(200).send({ data: cartItems });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).send({ message: "Error fetching cart data" });
  }
};

const deleteCartData = async (req, res) => {
  try {
    const itemId = req.params.id;
    const vendorName = req.body.vendorName;
    if (!itemId) {
      return res.status(400).send({ message: "Item ID is required" });
    }

    const cartItem = await db("product_carts")
      .where({ product_id: itemId, vendor_name: vendorName })
      .select("quantity")
      .first();

    if (!cartItem) {
      return res.status(404).send({ message: "Item not found in the cart" });
    }

    const itemQuantity = cartItem.quantity;

    const deletedCount = await db("product_carts")
      .where({ product_id: itemId, vendor_name: vendorName })
      .del();

    if (deletedCount === 0) {
      return res.status(404).send({ message: "Item not found" });
    }

    await db("products")
      .where("product_id", itemId)
      .increment("quantity_in_stock", itemQuantity);

    res
      .status(200)
      .send({ message: "Item deleted successfully and quantity restored" });
  } catch (error) {
    console.error("Error deleting cart data:", error);
    res.status(500).send({ message: "Error deleting cart data" });
  }
};

const importData = async (req, res) => {
  const { csvData } = req.body;

  if (!csvData || csvData.length === 0) {
    return res.status(400).json({ message: "No Excel data provided." });
  }

  try {
    for (const row of csvData) {
      const {
        product_name,
        category_name,
        vendor_name,
        quantity_in_stock,
        status,
        unit_price,
        product_image,
      } = row;

      if (!category_name) {
        return res.status(400).json({
          message: `Missing category_name for product_name: ${product_name}`,
        });
      }

      let category = await db("categories").where({ category_name }).first();
      if (!category) {
        const categoryInsert = await db("categories")
          .insert({ category_name, status: "1" })
          .returning("*");
        category = categoryInsert[0];
      }

      if (!vendor_name) {
        return res.status(400).json({
          message: `Missing vendor_name for product_name: ${product_name}`,
        });
      }

      const vendorNames = vendor_name.split(",").map((vendor) => vendor.trim());
      let vendorIds = [];

      for (const vendorName of vendorNames) {
        let vendor = await db("vendors")
          .where({ vendor_name: vendorName })
          .first();

        if (!vendor) {
          const vendorInsert = await db("vendors")
            .insert({ vendor_name: vendorName, status: "1" })
            .returning("*");
          vendor = vendorInsert[0];
        }
        vendorIds.push(vendor.vendor_id);
      }

      let existingProduct = await db("products")
        .where({ product_name })
        .first();

      if (existingProduct) {
        if (status === 0) {
          await db("products").where({ product_name }).update({ status: "1" });
        }

        if (existingProduct.status !== "99") {
          await db("products")
            .where({ product_name })
            .update({
              quantity_in_stock:
                existingProduct.quantity_in_stock + Number(quantity_in_stock),
            });
        }

        for (const vendorId of vendorIds) {
          const existingProductVendor = await db("product_to_vendors")
            .where({
              product_id: existingProduct.product_id,
              vendor_id: vendorId,
            })
            .first();

          if (!existingProductVendor) {
            await db("product_to_vendors").insert({
              product_id: existingProduct.product_id,
              vendor_id: vendorId,
              status: "1",
            });
          }
        }
      } else {
        const newProductId = await db("products")
          .insert({
            product_name,
            category_id: category.category_id,
            quantity_in_stock: Number(quantity_in_stock),
            status: status ? status.toString() : "1",
            unit_price,
            product_image,
          })
          .then((ids) => ids[0]);

        const newProduct = await db("products")
          .where({ product_id: newProductId })
          .first();

        for (const vendorId of vendorIds) {
          await db("product_to_vendors").insert({
            product_id: newProduct.product_id,
            vendor_id: vendorId,
            status: "1",
          });
        }
      }
    }

    res.status(200).json({ message: "Excel data processed successfully." });
  } catch (error) {
    console.error("Error processing Excel data:", error);
    res.status(500).json({ message: "Error processing Excel data." });
  }
};

module.exports = {
  postProduct,
  deleteProduct,
  getAllProducts,
  updateImage,
  moveToCart,
  getCartData,
  importData,
  deleteCartData,
};
