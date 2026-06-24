const { Router } = require("express");
const { getDB } = require("../db");
const router = Router();


router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { status, driverId, driverName } = req.query;

    const filter = {};

    if (status)     filter.status         = status;
    //dot and []-> embeded doc
    if (driverId)   filter["driver.id"]   = driverId;
    if (driverName) filter["driver.name"] = { $regex: driverName, $options: "i" };

    const deliveries = await db
      .collection("deliveries")
      .find(filter)
      .sort({ scheduledDate: -1 })
      .toArray();

    res.json({ count: deliveries.length, data: deliveries });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/stats", async (req, res) => {
  try {
    const db = getDB();
    const total     = await db.collection("deliveries").countDocuments();
    const delivered = await db.collection("deliveries").countDocuments({ status: "delivered" });
    const pending   = await db.collection("deliveries").countDocuments({ status: "pending" });
    const transit   = await db.collection("deliveries").countDocuments({ status: "in-transit" });

    //$ne 
    const active = await db.collection("deliveries").countDocuments({
      status: { $ne: "delivered" }
    });

    res.json({ total, delivered, pending, transit, active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$gt
router.get("/long-routes", async (req, res) => {
  try {
    const db = getDB();
    const results = await db.collection("deliveries").find({
      totalKm: { $gt: 15 }
    })
    .sort({ totalKm: -1 })
    .toArray();

    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$elemMatch
router.get("/route-stop", async (req, res) => {
  try {
    const db = getDB();

    const results = await db.collection("deliveries").find({
      route: {
        $elemMatch: { distKm: { $gt: 10 } }
      }
    }).toArray();

    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:deliveryId", async (req, res) => {
  try {
    const db = getDB();
    const delivery = await db.collection("deliveries").findOne({
      deliveryId: req.params.deliveryId
    });
    if (!delivery) return res.status(404).json({ error: "Delivery not found" });
    res.json({ data: delivery });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$set
router.patch("/:deliveryId/status", async (req, res) => {
  try {
    const db = getDB();
    const { status } = req.body;

    const result = await db.collection("deliveries").updateOne(
      { deliveryId: req.params.deliveryId },
      {
        $set: { status },
        $currentDate: { lastModified: true }
      }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$push
router.patch("/:deliveryId/add-stop", async (req, res) => {
  try {
    const db = getDB();
    const { location, distKm, eta } = req.body;

    const delivery = await db.collection("deliveries").findOne(
      { deliveryId: req.params.deliveryId },
      { projection: { route: 1 } }
    );
    const stopNo = delivery.route.length + 1;

    const result = await db.collection("deliveries").updateOne(
      { deliveryId: req.params.deliveryId },
      {
        $push: {
          route: { stopNo, location, distKm, eta, status: "pending" }
        },
        $inc: { totalKm: distKm }
      }
    );
    res.json({ message: "Stop added", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$pop
router.patch("/:deliveryId/remove-last-stop", async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("deliveries").updateOne(
      { deliveryId: req.params.deliveryId },
      { $pop: { route: 1 } } 
    );
    res.json({ message: "Last stop removed", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/complete-all", async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("deliveries").updateMany(
      { status: "in-transit" },
      {
        $set: { status: "delivered" },
        $currentDate: { completedAt: true }
      }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;