import cookieParser from "cookie-parser";
import cors from "cors";
import express, { json, urlencoded } from "express";
import userRouter from "./routes/user.route.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(json());
app.use(express.static("public"));
app.use(urlencoded({ extended: true }));

app.use("/api/v1", userRouter);

export default app;
