
import dotenv from "dotenv"
import connectDB from "./db/index.js";

dotenv

connectDB()





// import express from "express";
// const app = express()
// ;(async () => {
//   try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error", (error) => {
//       console.log("ERROR: ", error);
//     });
//     app.listen(process.env.PORT,() => {
//         console.log(`Server started on https://${process.env.DOMAIN}:${process.env.PORT}`)
//     })
//   } catch (error) {
//     console.error("ERROR: ", error);
//     throw error;
//   }
// })();
