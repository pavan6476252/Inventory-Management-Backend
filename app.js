import express from "express";
import { connectdb } from "./db/user_db.js";
import userRouter from "./routes/user_routes.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import productRouter from "./routes/productRoutes.js";
import companyRouter from "./routes/companyRoutes.js";
import locationRouter from "./routes/locationRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

dotenv.config();

const app = express();
app.use(
  cors({
    // origin: "http://localhost:5173",
    origin: "https://inventory-management-backend-hsaf.onrender.com",

    methods: ["GET", "POST", "PUT", "PATCH","DELETE"],
    credentials: true,
    preflightContinue: true,
  })
);

app.use(function (req, res, next) {
  //Enabling CORS
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type,   Accept, x-client-key, x-client-token, x-client-secret, Authorization");
    next();
  });

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded());
connectdb();

app.use("/api/v1/users", userRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/brands", companyRouter);
app.use("/api/v1/location", locationRouter);
app.use("/api/v1/analytics", analyticsRoutes);

app.use(express.urlencoded({ extended: true }));

// console.log(process.env.FRONTEND_URL);

app.get("/", (req, res) => {
  res.send("<h1>working nicely</h1>");
});

app.use((error, req, res, next) => {
  console.log(error, error.message);
  return res.status(400).json({ message: "internal server error" });
});

app.listen(process.env.PORT, () => {
  console.log(
    `server is working at port:${process.env.PORT} in ${process.env.NODE_ENV} mode`
  );
});
