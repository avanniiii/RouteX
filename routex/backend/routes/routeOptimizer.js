//finds optimal delivery order using
//Nearest Neighbor greedy algorithm on client coordinates.

const { Router } = require("express");
const { getDB } = require("../db");
const router = Router();

//Haversine formula -> distance between two lat/lng points
function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

//Nearest Neighbor Algorithm
//Given a start point and list of stops, returns stops
//reordered so total travel distance is minimized.
function nearestNeighbor(start, stops) {
  const unvisited = [...stops];
  const route = [];
  let current = start;

  while (unvisited.length > 0) {
    let minDist = Infinity;
    let nearestIdx = 0;

    unvisited.forEach((stop, idx) => {
      const dist = haversine(current, stop.coords);
      if (dist < minDist) {
        minDist = dist;
        nearestIdx = idx;
      }
    });

    const nearest = unvisited.splice(nearestIdx, 1)[0];
    route.push({ ...nearest, distFromPrev: +minDist.toFixed(2) });
    current = nearest.coords;
  }

  return route;
}


router.post("/optimize", async (req, res) => {
  try {
    const db = getDB();
    const { clientIds, date, warehouse } = req.body;

    if (!clientIds || clientIds.length === 0) {
      return res.status(400).json({ error: "No clients provided" });
    }

    //Warehouse starting point 
    const warehouseCoords = warehouse || { lat: 31.634, lng: 74.872 };

    //Step 1: Fetch all requested clients
    //$in
    const clients = await db.collection("clients").find(
      { clientId: { $in: clientIds } },
      { projection: { clientId: 1, name: 1, "location.coords": 1, "location.city": 1, _id: 0 } }
    ).toArray();

    //Step 2: Build stops list
    const stops = clients.map(c => ({
      clientId: c.clientId,
      name:     c.name,
      city:     c.location.city,
      coords:   c.location.coords || randomCoords(warehouseCoords)
    }));

    //Step 3: Calculate naive route distance 
    const naiveRoute = stops;
    const naiveDist  = calcTotalDistance(warehouseCoords, naiveRoute);

    //Step 4: Run nearest neighbor optimization
    const optimizedStops = nearestNeighbor(warehouseCoords, stops);
    const optimizedDist  = calcTotalDistance(warehouseCoords, optimizedStops);

    const kmSaved     = +(naiveDist - optimizedDist).toFixed(2);
    const percentSaved = naiveDist > 0 ? +((kmSaved / naiveDist) * 100).toFixed(1) : 0;

    //Step 5: Build route array with cumulative distance
    let cumulative = 0;
    const routeArray = [
      { stopNo: 1, location: "Warehouse (Start)", distKm: 0, cumKm: 0, eta: "08:00", status: "done", isWarehouse: true }
    ];

    optimizedStops.forEach((stop, i) => {
      cumulative = +(cumulative + stop.distFromPrev).toFixed(2);
      const minsFromStart = (i + 1) * 30 + Math.round(cumulative * 2);
      const etaH = Math.floor(8 + minsFromStart / 60);
      const etaM = minsFromStart % 60;
      const eta  = `${String(etaH).padStart(2,"0")}:${String(etaM).padStart(2,"0")}`;

      routeArray.push({
        stopNo:    i + 2,
        location:  `${stop.name}, ${stop.city}`,
        clientId:  stop.clientId,
        distKm:    stop.distFromPrev,
        cumKm:     cumulative,
        coords:    stop.coords,
        eta,
        status:    "pending"
      });
    });

    //Step 6: Save optimized delivery to DB
    const deliveryId = `DEL${Date.now().toString().slice(-6)}`;
    await db.collection("deliveries").insertOne({
      deliveryId,
      clientIds,
      route:         routeArray,
      scheduledDate: new Date(date || Date.now()),
      status:        "pending",
      totalKm:       +optimizedDist.toFixed(2),
      naiveKm:       +naiveDist.toFixed(2),
      kmSaved,
      percentSaved,
      driver:        { name: "Unassigned", id: "" },
      isOptimized:   true,
      createdAt:     new Date()
    });

    res.json({
      deliveryId,
      optimizedRoute:  routeArray,
      totalKm:         +optimizedDist.toFixed(2),
      naiveKm:         +naiveDist.toFixed(2),
      kmSaved,
      percentSaved,
      stopsCount:      optimizedStops.length,
      message: `Optimized! Saved ${kmSaved} km (${percentSaved}%) vs original order`
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//Returns all optimized deliveries 
//Aggregation: $match -> $sort -> $project
router.get("/optimized", async (req, res) => {
  try {
    const db = getDB();

    const result = await db.collection("deliveries").aggregate([
      { $match: { isOptimized: true } },
      { $sort:  { createdAt: -1 } },
      { $project: {
        deliveryId:    1,
        status:        1,
        totalKm:       1,
        naiveKm:       1,
        kmSaved:       1,
        percentSaved:  1,
        stopsCount:    { $size: "$route" },
        scheduledDate: 1,
        route:         1,
        _id:           0
      }}
    ]).toArray();

    res.json({ data: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//$set
router.patch("/:deliveryId/assign-driver", async (req, res) => {
  try {
    const db = getDB();
    const { name, id } = req.body;

    const result = await db.collection("deliveries").updateOne(
      { deliveryId: req.params.deliveryId },
      { $set: { "driver.name": name, "driver.id": id } }
    );
    res.json({ modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


function calcTotalDistance(start, stops) {
  let total = 0;
  let prev  = start;
  stops.forEach(s => {
    total += haversine(prev, s.coords);
    prev   = s.coords;
  });
  return total;
}

//Generates a nearby random coord if client has no coords stored
function randomCoords(base) {
  return {
    lat: base.lat + (Math.random() - 0.5) * 0.4,
    lng: base.lng + (Math.random() - 0.5) * 0.4
  };
}

module.exports = router;