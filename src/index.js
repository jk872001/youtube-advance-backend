import dbConnect from "./db/index.js";
import { app } from "./app.js";
import dotenv from "dotenv";
dotenv.config({path:"./.env"});

const PORT = process.env.PORT;

dbConnect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`App is listening on port ${PORT}`);
    });
  })
  .catch((err) => console.log("MongoDb connection error", err.message));
