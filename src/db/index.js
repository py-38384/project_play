import mongoose from "mongoose";
import express from "express"
import { DB_NAME } from "../constants.js";

const app = express()

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    
    app.on("error", (error) => {
      console.log("EXPRESS ERROR: ", error);
    });
    app.listen(process.env.PORT, () => {
      console.log(
        `Server started on https://${process.env.DOMAIN}:${process.env.PORT}`
      );
    });
  } catch (error) {
    console.error("MONGODB CONNECTION ERROR: ", error);
    process.exit(1)
  }
}

export default connectDB
