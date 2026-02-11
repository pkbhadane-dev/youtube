import dotenv from "dotenv";
dotenv.config();
import { connectDb } from "./db/connetDB.js";
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
