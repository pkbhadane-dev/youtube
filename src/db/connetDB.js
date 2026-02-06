import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`,
    );
    console.log(
      `DB connected successful: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("failed to connect DB", error);
    process.exit(1)
  }
};
