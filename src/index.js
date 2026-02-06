import dotenv from "dotenv";
import { connectDb } from "./db/connetDB.js";
dotenv.config();
connectDb();
