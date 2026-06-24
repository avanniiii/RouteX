const { Router } = require("express");
const { getDB } = require("../db");
const router = Router();

router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { category, maxPrice, warehouse } = req.query;

    const filter = {};
    if (category)  filter.category = category;
    if (maxPrice)  filter.pricePerUnit = { $lte: parseFloat(maxPrice) };
    if (warehouse) filter["stock.warehouse"]   = warehouse;

    const materials = await db.collection("rawMaterials")
      .find(filter)
      .sort({ name: 1 })
      .toArray();

    res.json({ count: materials.length, data: materials });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$lt
router.get("/low-stock", async (req, res) => {
  try {
    const db = getDB();
    const results = await db.collection("rawMaterials").find({
      "stock.qty": { $lt: 100 }  
    })
    .project({ name:1, category:1, stock:1, pricePerUnit:1, _id:0 })
    .toArray();

    res.json({ count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$elemMatch
router.get("/best-suppliers", async (req, res) => {
  try {
    const db = getDB();

    const results = await db.collection("rawMaterials").find({
      suppliers: {
        $elemMatch: {
          rating: { $gt: 4.2 },
          deliveryDays: { $lte: 3 }
        }
      }
    }).toArray();

    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$in
router.get("/by-categories", async (req, res) => {
  try {
    const db = getDB();
    const cats = ["Grain", "Pulses"]; // example

    const results = await db.collection("rawMaterials").find({
      category: { $in: cats }
    }).toArray();

    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$inc
//$currentDate
router.patch("/:materialId/restock", async (req, res) => {
  try {
    const db = getDB();
    const { qty } = req.body;

    const result = await db.collection("rawMaterials").updateOne(
      { materialId: req.params.materialId },
      {
        $inc: { "stock.qty": parseInt(qty) },    // embedded field via dot notation
        $currentDate: { lastUpdated: true }
      }
    );
    res.json({ message: "Stock updated", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$mul
router.patch("/price-hike", async (req, res) => {
  try {
    const db = getDB();
    const { category, factor } = req.body; // e.g. category:"Grain", factor:1.10

    const result = await db.collection("rawMaterials").updateMany(
      { category },
      { $mul: { pricePerUnit: parseFloat(factor) } }
    );
    res.json({ message: "Price updated", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$push
router.patch("/:materialId/add-supplier", async (req, res) => {
  try {
    const db = getDB();
    const { name, rating, deliveryDays } = req.body;

    const result = await db.collection("rawMaterials").updateOne(
      { materialId: req.params.materialId },
      {
        $push: {
          suppliers: { name, rating: parseFloat(rating), deliveryDays: parseInt(deliveryDays) }
        }
      }
    );
    res.json({ message: "Supplier added", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$pull
router.patch("/:materialId/remove-supplier", async (req, res) => {
  try {
    const db = getDB();
    const { supplierName } = req.body;

    const result = await db.collection("rawMaterials").updateOne(
      { materialId: req.params.materialId },
      {
        $pull: { suppliers: { name: supplierName } }
      }
    );
    res.json({ message: "Supplier removed", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;