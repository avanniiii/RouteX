//AGGREGATION
const { Router } = require("express");
const { getDB } = require("../db");
const router = Router();


router.get("/dashboard", async (req, res) => {
  try {
    const db = getDB();

    const [
      totalClients, activeClients,
      totalOrders, pendingOrders,
      totalDeliveries, activeDeliveries,
      lowStock
    ] = await Promise.all([
      db.collection("clients").countDocuments(),
      db.collection("clients").countDocuments({ isActive: true }),
      db.collection("orders").countDocuments(),
      db.collection("orders").countDocuments({ status: "pending" }),
      db.collection("deliveries").countDocuments(),
      db.collection("deliveries").countDocuments({ status: { $ne: "delivered" } }),
      db.collection("rawMaterials").countDocuments({ "stock.qty": { $lt: 100 } })
    ]);

    //$group with $sum
    const revenueResult = await db.collection("orders").aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
    ]).toArray();

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;

    res.json({
      totalClients, activeClients,
      totalOrders, pendingOrders,
      totalDeliveries, activeDeliveries,
      lowStock, totalRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//$match -> $group -> $sort -> $project
router.get("/clients-by-city", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("clients").aggregate([
      //Only active clients
      { $match: { isActive: true } },

      //Group by city
      { $group: {
        _id: "$location.city",
        clientCount:    { $sum: 1 },
        totalOrders:    { $sum: "$totalOrders" },
        avgCreditScore: { $avg: "$creditScore" },
        maxCredit:      { $max: "$creditScore" },
        minCredit:      { $min: "$creditScore" }
      }},

      //Sort
      { $sort: { totalOrders: -1 } },

      //Reshape output
      { $project: {
        city:           "$_id",
        clientCount:    1,
        totalOrders:    1,
        avgCreditScore: { $round: ["$avgCreditScore", 1] },
        maxCredit:      1,
        minCredit:      1,
        _id:            0
      }}
    ]).toArray();

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//$unwind -> $group -> $sort
router.get("/revenue-by-material", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("orders").aggregate([
      //Only delivered orders
      { $match: { status: "delivered" } },

      //Unwind items array
      { $unwind: "$items" },

      //Group by material
      { $group: {
        _id:          "$items.material",
        totalRevenue: { $sum: "$items.price" },
        totalQty:     { $sum: "$items.qty" },
        orderCount:   { $sum: 1 },
        avgPrice:     { $avg: "$items.price" }
      }},

      //Sort by revenue
      { $sort: { totalRevenue: -1 } },

      //Rename _id
      { $project: {
        material:     "$_id",
        totalRevenue: 1,
        totalQty:     1,
        orderCount:   1,
        avgPrice:     { $round: ["$avgPrice", 0] },
        _id:          0
      }}
    ]).toArray();

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// $lookup 
router.get("/orders-with-clients", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("orders").aggregate([
      //Pending orders only
      { $match: { status: { $in: ["pending", "processing"] } } },

      //join with clients on clientId
      { $lookup: {
        from:         "clients",
        localField:   "clientId",
        foreignField: "clientId",
        as:           "clientInfo"
      }},

      //$unwind the joined array
      { $unwind: "$clientInfo" },

      //Project needed fields
      { $project: {
        orderId:      1,
        totalAmount:  1,
        priority:     1,
        status:       1,
        orderDate:    1,
        clientName:   "$clientInfo.name",
        clientCity:   "$clientInfo.location.city",
        creditScore:  "$clientInfo.creditScore",
        _id:          0
      }},

      { $sort: { totalAmount: -1 } }
    ]).toArray();

    res.json({ count: result.length, data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// $unwind -> $group -> $addFields 
router.get("/supply-forecast", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("clients").aggregate([
      { $match: { isActive: true } },

      //Unwind 
      { $unwind: { path: "$supplyHistory", preserveNullAndEmptyArrays: true } },

      //Group per client
      { $group: {
        _id:         "$clientId",
        clientName:  { $first: "$name" },
        city:        { $first: "$location.city" },
        totalSupply: { $sum:   "$supplyHistory.qty" },
        avgMonthly:  { $avg:   "$supplyHistory.qty" },
        monthCount:  { $sum:   1 }
      }},

      //Add projected demand = avgMonthly * 1.15
      { $addFields: {
        projectedNextMonth: {
          $round: [{ $multiply: ["$avgMonthly", 1.15] }, 0]
        },
        trend: {
          $cond: {
            if:   { $gte: ["$avgMonthly", 150] },
            then: "high",
            else: {
              $cond: {
                if:   { $gte: ["$avgMonthly", 80] },
                then: "medium",
                else: "low"
              }
            }
          }
        }
      }},

      { $sort: { totalSupply: -1 } },

      { $project: {
        _id:                0,
        clientId:           "$_id",
        clientName:         1,
        city:               1,
        totalSupply:        1,
        avgMonthly:         { $round: ["$avgMonthly", 0] },
        projectedNextMonth: 1,
        trend:              1,
        monthCount:         1
      }}
    ]).toArray();

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// $group + $sort + $limit
//top 3 clients by total orders
router.get("/top-clients", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("clients").aggregate([
      { $match: { isActive: true } },
      { $sort: { totalOrders: -1 } },
      { $limit: 3 },
      { $project: {
        _id:          0,
        clientId:     1,
        name:         1,
        totalOrders:  1,
        creditScore:  1,
        city:         "$location.city"
      }}
    ]).toArray();

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;