import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cron from "node-cron";
import { connectDB } from "./config/db.js";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/authroutes.js";
import profileRoutes from "./routes/profileroutes.js";
import productRoutes from "./routes/productroutes.js";
import cartRoutes from "./routes/cartroutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import orderIssueRoutes from "./routes/orderIssueRoutes.js";
import { cleanupExpiredOrders } from "./utils/orderCleanup.js";

dotenv.config();
const app = express();

// ES module-friendly way to get __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_LOCAL,
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

connectDB();

app.get("/", (req, res) => {
  res.send("API Running...");
});

// Serve static files (e.g., product images)
// This makes the 'uploads' folder accessible via the '/uploads' URL path
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/order-issues", orderIssueRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
