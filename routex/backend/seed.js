//insertOne, insertMany, embedded documents, arrays

const { connectDB } = require("./db");

async function seed() {
  const db = await connectDB();

 //Clear existing data  
  await db.collection("clients").deleteMany({});
  await db.collection("orders").deleteMany({});
  await db.collection("deliveries").deleteMany({});
  await db.collection("rawMaterials").deleteMany({});
  await db.collection("forecasts").deleteMany({});
  console.log("Cleared existing data");

  
  //CLIENTS
  await db.collection("clients").insertMany([
    {
      clientId: "CLT001",
      name: "Mehta Traders",
      location: { city: "Amritsar", state: "Punjab", zip: "143001", coords: { lat: 31.638, lng: 74.873 } },
      contactDetails: { mobile: "9812345678", email: "mehta@mail.com" },
      supplyHistory: [
        { month: "Jan", qty: 120, material: "Wheat" },
        { month: "Feb", qty: 150, material: "Wheat" },
        { month: "Mar", qty: 180, material: "Rice" }
      ],
      tags: ["wholesale", "priority", "regular"],
      isActive: true,
      creditScore: 85,
      totalOrders: 24
    },
    {
      clientId: "CLT002",
      name: "Singh Enterprises",
      location: { city: "Ludhiana", state: "Punjab", zip: "141001", coords: { lat: 30.901, lng: 75.857 } },
      contactDetails: { mobile: "9855567890", email: "singh@mail.com" },
      supplyHistory: [
        { month: "Jan", qty: 80, material: "Rice" },
        { month: "Feb", qty: 95, material: "Rice" }
      ],
      tags: ["retail", "new"],
      isActive: true,
      creditScore: 72,
      totalOrders: 8
    },
    {
      clientId: "CLT003",
      name: "Patel Wholesale",
      location: { city: "Chandigarh", state: "Punjab", zip: "160001", coords: { lat: 30.733, lng: 76.779 } },
      contactDetails: { mobile: "9876543210", email: "patel@mail.com" },
      supplyHistory: [],
      tags: ["wholesale"],
      isActive: false,
      creditScore: 45,
      totalOrders: 3
    },
    {
      clientId: "CLT004",
      name: "Sharma Distributors",
      location: { city: "Jalandhar", state: "Punjab", zip: "144001", coords: { lat: 31.326, lng: 75.576 } },
      contactDetails: { mobile: "9811223344", email: "sharma@dist.com" },
      supplyHistory: [
        { month: "Jan", qty: 60, material: "Sugar" }
      ],
      tags: ["wholesale", "new"],
      isActive: true,
      creditScore: 78,
      totalOrders: 5
    },
    {
      clientId: "CLT005",
      name: "Kapoor & Sons",
      location: { city: "Amritsar", state: "Punjab", zip: "143002", coords: { lat: 31.642, lng: 74.881 } },
      contactDetails: { mobile: "9899988877", email: "kapoor@mail.com" },
      supplyHistory: [
        { month: "Jan", qty: 300, material: "Wheat" },
        { month: "Feb", qty: 280, material: "Wheat" },
        { month: "Mar", qty: 320, material: "Pulses" }
      ],
      tags: ["wholesale", "vip", "priority"],
      isActive: true,
      creditScore: 92,
      totalOrders: 41
    },
    {
      clientId: "CLT006",
      name: "Verma Foods",
      location: { city: "Ludhiana", state: "Punjab", zip: "141002", coords: { lat: 30.912, lng: 75.869 } },
      contactDetails: { mobile: "9888776655", email: "verma@foods.com" },
      supplyHistory: [
        { month: "Feb", qty: 110, material: "Sugar" },
        { month: "Mar", qty: 130, material: "Spices" }
      ],
      tags: ["retail", "priority"],
      isActive: true,
      creditScore: 80,
      totalOrders: 17
    }
  ]);
  console.log("Clients seeded");


 //Raw materials
  await db.collection("rawMaterials").insertMany([
    {
      materialId: "MAT001",
      name: "Wheat",
      category: "Grain",
      stock: { qty: 500, unit: "kg", warehouse: "WH-A" },
      pricePerUnit: 25.50,
      suppliers: [
        { name: "Punjab Farms", rating: 4.5, deliveryDays: 2 },
        { name: "Haryana Grains", rating: 4.0, deliveryDays: 3 }
      ],
      lastUpdated: new Date()
    },
    {
      materialId: "MAT002",
      name: "Rice",
      category: "Grain",
      stock: { qty: 300, unit: "kg", warehouse: "WH-A" },
      pricePerUnit: 36.00,
      suppliers: [
        { name: "AP Rice Mills", rating: 4.2, deliveryDays: 4 }
      ],
      lastUpdated: new Date()
    },
    {
      materialId: "MAT003",
      name: "Sugar",
      category: "Commodity",
      stock: { qty: 200, unit: "kg", warehouse: "WH-B" },
      pricePerUnit: 42.00,
      suppliers: [
        { name: "UP Mills", rating: 3.8, deliveryDays: 4 },
        { name: "Maharashtra Sugar", rating: 4.1, deliveryDays: 5 }
      ],
      lastUpdated: new Date()
    },
    {
      materialId: "MAT004",
      name: "Turmeric",
      category: "Spices",
      stock: { qty: 50, unit: "kg", warehouse: "WH-C" },
      pricePerUnit: 120.00,
      suppliers: [
        { name: "Kerala Spices", rating: 4.8, deliveryDays: 5 }
      ],
      lastUpdated: new Date()
    },
    {
      materialId: "MAT005",
      name: "Chana Dal",
      category: "Pulses",
      stock: { qty: 180, unit: "kg", warehouse: "WH-B" },
      pricePerUnit: 65.00,
      suppliers: [
        { name: "MP Traders", rating: 4.3, deliveryDays: 3 }
      ],
      lastUpdated: new Date()
    }
  ]);
  console.log("Raw materials seeded");

 //Orderss
  await db.collection("orders").insertMany([
    {
      orderId: "ORD001",
      clientId: "CLT001",
      items: [
        { material: "Wheat", qty: 100, price: 2550 },
        { material: "Rice", qty: 50, price: 1800 }
      ],
      totalAmount: 4350,
      priority: "high",
      status: "delivered",
      orderDate: new Date("2025-01-15")
    },
    {
      orderId: "ORD002",
      clientId: "CLT002",
      items: [
        { material: "Sugar", qty: 200, price: 8400 }
      ],
      totalAmount: 8400,
      priority: "medium",
      status: "processing",
      orderDate: new Date("2025-02-03")
    },
    {
      orderId: "ORD003",
      clientId: "CLT005",
      items: [
        { material: "Wheat", qty: 500, price: 12750 },
        { material: "Chana Dal", qty: 100, price: 6500 }
      ],
      totalAmount: 19250,
      priority: "high",
      status: "delivered",
      orderDate: new Date("2025-02-05")
    },
    {
      orderId: "ORD004",
      clientId: "CLT004",
      items: [
        { material: "Turmeric", qty: 30, price: 3600 }
      ],
      totalAmount: 3600,
      priority: "low",
      status: "pending",
      orderDate: new Date("2025-02-10")
    },
    {
      orderId: "ORD005",
      clientId: "CLT006",
      items: [
        { material: "Sugar", qty: 110, price: 4620 },
        { material: "Turmeric", qty: 20, price: 2400 }
      ],
      totalAmount: 7020,
      priority: "medium",
      status: "processing",
      orderDate: new Date("2025-02-12")
    },
    {
      orderId: "ORD006",
      clientId: "CLT001",
      items: [
        { material: "Rice", qty: 150, price: 5400 }
      ],
      totalAmount: 5400,
      priority: "high",
      status: "pending",
      orderDate: new Date("2025-03-01")
    }
  ]);
  console.log("Orders seeded");

//Deliveries
  await db.collection("deliveries").insertMany([
    {
      deliveryId: "DEL001",
      clientId: "CLT001",
      route: [
        { stopNo: 1, location: "Warehouse A", distKm: 0, eta: "08:00", status: "done" },
        { stopNo: 2, location: "Mehta Traders, Amritsar", distKm: 12, eta: "09:30", status: "done" }
      ],
      scheduledDate: new Date("2025-01-15"),
      status: "delivered",
      totalKm: 12,
      driver: { name: "Ravi Kumar", id: "DRV01", mobile: "9870001111" }
    },
    {
      deliveryId: "DEL002",
      clientId: "CLT005",
      route: [
        { stopNo: 1, location: "Warehouse A", distKm: 0, eta: "08:30", status: "done" },
        { stopNo: 2, location: "Kapoor & Sons, Amritsar", distKm: 8, eta: "09:15", status: "pending" }
      ],
      scheduledDate: new Date("2025-02-20"),
      status: "pending",
      totalKm: 8,
      driver: { name: "Ajay Singh", id: "DRV02", mobile: "9870002222" }
    },
    {
      deliveryId: "DEL003",
      clientId: "CLT002",
      route: [
        { stopNo: 1, location: "Warehouse B", distKm: 0, eta: "10:00", status: "done" },
        { stopNo: 2, location: "Singh Enterprises, Ludhiana", distKm: 25, eta: "11:45", status: "done" }
      ],
      scheduledDate: new Date("2025-02-03"),
      status: "delivered",
      totalKm: 25,
      driver: { name: "Ravi Kumar", id: "DRV01", mobile: "9870001111" }
    },
    {
      deliveryId: "DEL004",
      clientId: "CLT006",
      route: [
        { stopNo: 1, location: "Warehouse B", distKm: 0, eta: "09:00", status: "done" },
        { stopNo: 2, location: "Verma Foods, Ludhiana", distKm: 18, eta: "10:15", status: "in-transit" }
      ],
      scheduledDate: new Date("2025-03-05"),
      status: "in-transit",
      totalKm: 18,
      driver: { name: "Suresh Pal", id: "DRV03", mobile: "9870003333" }
    }
  ]);
  console.log("Deliveries seeded");

//Forecasts
  await db.collection("forecasts").insertMany([
    {
      clientId: "CLT001",
      predictedDemand: [
        { month: "Apr", qty: 190 },
        { month: "May", qty: 205 },
        { month: "Jun", qty: 220 }
      ],
      confidence: 87,
      trend: "upward",
      generatedAt: new Date()
    },
    {
      clientId: "CLT005",
      predictedDemand: [
        { month: "Apr", qty: 340 },
        { month: "May", qty: 360 },
        { month: "Jun", qty: 390 }
      ],
      confidence: 91,
      trend: "upward",
      generatedAt: new Date()
    },
    {
      clientId: "CLT002",
      predictedDemand: [
        { month: "Apr", qty: 100 },
        { month: "May", qty: 95 },
        { month: "Jun", qty: 105 }
      ],
      confidence: 74,
      trend: "stable",
      generatedAt: new Date()
    }
  ]);
  console.log("Forecasts seeded");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});