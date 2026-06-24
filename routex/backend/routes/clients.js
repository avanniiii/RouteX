const { Router } = require("express");
const { getDB } = require("../db");
const router = Router();

//logical operators
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const { city, minCredit, active, tag } = req.query;

    const filter = {};

    if (city) filter["location.city"] = city;

    //$gte
    if (minCredit) filter.creditScore = { $gte: parseInt(minCredit) };

    //boolean
    if (active !== undefined) filter.isActive = active === "true";

    if (tag) filter.tags = tag;

    const clients = await db
      .collection("clients")
      .find(filter)
      //projection
      .project({ clientId:1, name:1, location:1, creditScore:1, totalOrders:1, isActive:1, tags:1, _id:0 })
      .sort({ creditScore: -1 })
      .toArray();

    res.json({ count: clients.length, data: clients });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/stats", async (req, res) => {
  try {
    const db = getDB();
    const total    = await db.collection("clients").countDocuments();
    const active   = await db.collection("clients").countDocuments({ isActive: true });
    const inactive = await db.collection("clients").countDocuments({ isActive: false });

    const highValue = await db.collection("clients").countDocuments({
      creditScore: { $gte: 80 }
    });

    res.json({ total, active, inactive, highValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$or
router.get("/search", async (req, res) => {
  try {
    const db = getDB();
    const { q } = req.query;
    if (!q) return res.json({ data: [] });

    const results = await db.collection("clients").find({
      name: { $regex: q, $options: "i" }
    })
    .project({ clientId:1, name:1, location:1, creditScore:1, isActive:1, _id:0 })
    .toArray();

    res.json({ count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/advanced-filter", async (req, res) => {
  try {
    const db = getDB();

    //$and + $or
    const results = await db.collection("clients").find({
      $and: [
        { isActive: true },
        {
          $or: [
            { creditScore:  { $gte: 80 } },
            { totalOrders:  { $gte: 20 } }
          ]
        }
      ]
    })
    .project({ clientId:1, name:1, creditScore:1, totalOrders:1, _id:0 })
    .toArray();

    res.json({ data: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//findOne
router.get("/:clientId", async (req, res) => {
  try {
    const db = getDB();
    const client = await db.collection("clients").findOne(
      { clientId: req.params.clientId },
      { projection: { _id: 0 } }
    );
    if (!client) return res.status(404).json({ error: "Client not found" });
    res.json({ data: client });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//insertOne
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { clientId, name, city, state, zip, mobile, email } = req.body;

    const newClient = {
      clientId,
      name,
      location: { city, state, zip },
      contactDetails: { mobile, email },
      supplyHistory: [],        
      tags: ["new"],
      isActive: true,
      creditScore: 60,       
      totalOrders: 0
    };

    const result = await db.collection("clients").insertOne(newClient);
    res.json({ message: "Client added", insertedId: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//update operators
router.patch("/:clientId/credit", async (req, res) => {
  try {
    const db = getDB();
    const { score } = req.body;

    const result = await db.collection("clients").updateOne(
      { clientId: req.params.clientId },
      {
        $set: { creditScore: parseInt(score) },
        $currentDate: { lastModified: true }
      }
    );
    res.json({ message: "Credit score updated", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$push & $pull
router.patch("/:clientId/tag", async (req, res) => {
  try {
    const db = getDB();
    const { action, tag } = req.body; 

    const update =
      action === "add"
        ? { $push: { tags: tag } }
        : { $pull: { tags: tag } };

    const result = await db.collection("clients").updateOne(
      { clientId: req.params.clientId },
      update
    );
    res.json({ message: `Tag ${action}ed`, modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//updateMany
router.patch("/bulk-activate", async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("clients").updateMany(
      { creditScore: { $gte: 70 } },
      {
        $set: { isActive: true },
        $currentDate: { lastModified: true }
      }
    );
    res.json({ message: "Bulk activation done", modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//deleteOne
router.delete("/:clientId", async (req, res) => {
  try {
    const db = getDB();
    const result = await db.collection("clients").deleteOne({
      clientId: req.params.clientId
    });
    res.json({ message: "Client deleted", deletedCount: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;