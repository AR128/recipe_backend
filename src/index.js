import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from "express";
import "dotenv/config";
import connectDB from "./config/db.js";
import router from "./routes/adminRoutes.js";

const app = express();
const port = process.env.PORT || 3000;

connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send(`Recipe Management API.`);
});

app.use("/admin", router)

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
