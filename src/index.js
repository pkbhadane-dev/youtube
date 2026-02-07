import dotenv from "dotenv";
import { connectDb } from "./db/connetDB.js";
dotenv.config();

const port = process.env.PORT || 8000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log("server connected successful");
    });
  })
  .catch((error) => {
    console.log("faild to connect server", error);
  });
