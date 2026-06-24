const { Router } = require("express");
const { getDB } = require("../db");
const router = Router();


router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { priority, minAmount, maxAmount, status, clientId } = req.query;

    const filter = {};

    if (priority)  filter.priority = priority;
    if (status)    filter.status   = status;
    if (clientId)  filter.clientId = clientId;

    //$gte & $lte
    if (minAmount || maxAmount) {
      filter.totalAmount = {};
      if (minAmount) filter.totalAmount.$gte = parseInt(minAmount);
      if (maxAmount) filter.totalAmount.$lte = parseInt(maxAmount);
    }

    const orders = await db
      .collection("orders")
      .find(filter)
      .sort({ orderDate: -1 })
      .toArray();

    res.json({ count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/stats", async (req, res) => {
  try {
    const db = getDB();

    const total     = await db.collection("orders").countDocuments();
    const pending   = await db.collection("orders").countDocuments({ status: "pending" });
    const delivered = await db.collection("orders").countDocuments({ status: "delivered" });
    const highPri   = await db.collection("orders").countDocuments({ priority: "high" });

    //$in
    const active = await db.collection("orders").countDocuments({
      status: { $in: ["pending", "processing"] }
    });

    res.json({ total, pending, delivered, highPri, active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$gt
router.get("/high-value", async (req, res) => {
  try {
    const db = getDB();
    const orders = await db.collection("orders").find({
      totalAmount: { $gt: 5000 }
    })
    .sort({ totalAmount: -1 })
    .toArray();

    res.json({ count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$elemMatch
router.get("/by-material/:material", async (req, res) => {
  try {
    const db = getDB();

    const orders = await db.collection("orders").find({
      items: {
        $elemMatch: { material: req.params.material }
      }
    }).toArray();

    res.json({ count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:orderId", async (req, res) => {
  try {
    const db = getDB();
    const order = await db.collection("orders").findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ data: order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$inc & $push
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { orderId, clientId, items, priority } = req.body;

    const totalAmount = items.reduce((sum, i) => sum + i.price, 0);

    //insertOne
    await db.collection("orders").insertOne({
      orderId,
      clientId,
      items,
      totalAmount,
      priority: priority || "medium",
      status: "pending",
      orderDate: new Date()
    });

    //$inc 
    await db.collection("clients").updateOne(
      { clientId },
      {
        $inc: { totalOrders: 1 },
        $currentDate: { lastOrderDate: true }
      }
    );

    //$push 
    if (items[0]) {
      await db.collection("clients").updateOne(
        { clientId },
        {
          $push: {
            supplyHistory: {
              month: new Date().toLocaleString("default", { month: "short" }),
              qty: items[0].qty,
              material: items[0].material
            }
          }
        }
      );
    }

    res.json({ message: "Order placed", totalAmount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$set
router.patch("/:orderId/status", async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.body;

    const result = await db.collection("orders").updateOne(
      { orderId: req.params.orderId },
      {
        $set: { status },
        $currentDate: { lastModified: true }
      }
    );
    res.json({ message: "Status updated", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$mul
router.patch("/apply-discount", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("orders").updateMany(
      { status: "pending", priority: "high" },
      { $mul: { totalAmount: 0.90 } }
    );
    res.json({ message: "10% discount applied", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:orderId", async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("orders").deleteOne({ orderId: req.params.orderId });
    res.json({ message: "Order deleted", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/old", async (req, res) => {
  try {
    const db = getDB();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const result = await db.collection("orders").deleteMany({
      status: "delivered",
      orderDate: { $lt: sixMonthsAgo }
    });
    res.json({ message: "Old orders deleted", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;