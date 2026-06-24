require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const { connectDB } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

//frontend static serve
app.use(express.static(path.join(__dirname, "../frontend")));

//API routes
app.use("/api/clients",    require("./routes/clients"));
app.use("/api/orders",     require("./routes/orders"));
app.use("/api/deliveries", require("./routes/deliveries"));
app.use("/api/materials",  require("./routes/materials"));
app.use("/api/analytics",  require("./routes/analytics"));
app.use("/api/route",      require("./routes/routeOptimizer"));

//route not found-loads frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

//start server after DB connection
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`RouteX server running at http://localhost:${PORT}`);
  });
});