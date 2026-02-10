import dotenv from "dotenv";
import { connectDb } from "./db/connetDB.js";
dotenv.config();
import app from "./app.js";
const port = process.env.PORT || 8000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log("server connected successfully on port", port);
    });
  })
  .catch((error) => {
    console.log("faild to connect server", error);
  });
