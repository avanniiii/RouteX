//INDEXES
const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
const dbName = process.env.DB_NAME;

let db;

async function connectDB() {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to MongoDB — database: ${dbName}`);

    await createIndexes();
    return db;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
}

async function createIndexes() {
  
  //Single Index
  await db.collection("clients").createIndex(
    { clientId: 1 },
    { unique: true, name: "idx_clientId_unique" }
  );

  await db.collection("clients").createIndex(
    { "location.city": 1 },
    { name: "idx_location_city" }
  );

  await db.collection("clients").createIndex(
    { isActive: 1 },
    { name: "idx_isActive" }
  );

  await db.collection("clients").createIndex(
    { creditScore: -1 },
    { name: "idx_creditScore_desc" }
  );

  await db.collection("clients").createIndex(
    { tags: 1 },
    { name: "idx_tags_multikey" }
  );

  //Multikey index
  await db.collection("orders").createIndex(
    { clientId: 1, orderDate: -1 },
    { name: "idx_orders_client_date" }
  );
  

  //Single
  await db.collection("orders").createIndex(
    { priority: 1 },
    { name: "idx_orders_priority" }
  );

  await db.collection("deliveries").createIndex(
    { deliveryId: 1 },
    { unique: true, name: "idx_deliveryId_unique" }
  );

  await db.collection("deliveries").createIndex(
    { status: 1 },
    { name: "idx_delivery_status" }
  );

  await db.collection("deliveries").createIndex(
    { "driver.id": 1 },
    { name: "idx_driver_id" }
  );
  await db.collection("rawMaterials").createIndex(
    { category: 1 },
    { name: "idx_material_category" }
  );

  //Multikey
  await db.collection("rawMaterials").createIndex(
    { "suppliers.rating": -1 },
    { name: "idx_supplier_rating_multikey" }
  );

}

function getDB() {
  if (!db) throw new Error("DB not connected. Call connectDB() first.");
  return db;
}

module.exports = { connectDB, getDB };