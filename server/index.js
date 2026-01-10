import express from "express";
import cors from "cors";
import shopifyRouter from "./routes/shopify.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api/shopify", shopifyRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "OptiSell Integrator API is running" });
});

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`OptiSell Integrator backend listening on port ${PORT}`);
});

export default app;
