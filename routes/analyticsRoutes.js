import express from "express";
import ProductModel from "../models/product_model.js";
import HistoryModel from "../models/history_model.js";
import Product from "../models/product_model.js";

const analyticsRoutes = express.Router();

// Route to get expiring products
analyticsRoutes.get("/expiring", async (req, res) => {
  try {
    const { months = 0 } = req.query; // Default to 1 month if not specified
    const expiringProducts = await getExpiringProducts(parseInt(months));
    res.status(200).json(expiringProducts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to get expiring products
const getExpiringProducts = async (months) => {
  const futureDate = new Date();
  futureDate.setMonth(futureDate.getMonth() + months);

  const expiringProducts = await Product.find({
    $and: [
      {
        $expr: {
          $lte: [
            {
              $add: [
                "$dateOfPurchase",
                {
                  $multiply: ["$warrantyMonths", 30 * 24 * 60 * 60 * 1000], // Convert warranty months to milliseconds
                },
              ],
            },
            futureDate,
          ],
        },
      },
    ],
  })
    .populate("createdBy")
    .populate({
      path: "history",
      populate: {
        path: "location",
      },
    })
    .populate("manufacturer").sort({ dateOfPurchase: -1 });
  return expiringProducts;
};

analyticsRoutes.get("/", async (req, res) => {
  try {
    const useby = await getProductUsageByUser();
    const expiry = await getWarrantyStatus();
    const status = await getProductStatus();

    const analytics = { useby, expiry, status };

    res.status(200).json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Function to get product usage by user
const getProductUsageByUser = async () => {
  const result = await ProductModel.aggregate([
    {
      $group: {
        _id: "$user",
        count: { $sum: 1 },
      },
    },
  ]);

  const labels = result.map((item) => item._id);
  const data = result.map((item) => item.count);

  return { title: "Products used by", labels, data };
};

// Function to get warranty status
const getWarrantyStatus = async () => {
  const currentDate = new Date();
  
  const result = await Product.aggregate([
    {
      $project: {
        status: {
          $cond: [
            {
              $gte: [
                {
                  $add: [
                    "$dateOfPurchase",
                    {
                      $multiply: ["$warrantyMonths", 30 * 24 * 60 * 60 * 1000] // Convert warranty months to milliseconds
                    }
                  ]
                },
                currentDate
              ]
            },
            "in warranty",
            "not in warranty"
          ]
        }
      }
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);

  const labels = result.map((item) => item._id);
  const data = result.map((item) => item.count);

  return { title: "Warranty", labels, data };
};

// Function to get product status
const getProductStatus = async () => {
  const result = await HistoryModel.aggregate([
    {
      $unwind: "$status",
    },
    {
      $group: {
        _id: "$status.name",
        count: { $sum: 1 },
      },
    },
  ]);

  const labels = result.map((item) => item._id);
  const data = result.map((item) => item.count);

  return { title: "Product Status", labels, data };
};

export default analyticsRoutes;
