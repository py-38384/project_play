import dotenv from "dotenv"
import app from "./app.js";
import connectDB from "./db/index.js";


dotenv.config({
    path: './env'
})



connectDB()
.then(()=>{
    app.on("error",(error) => {
        process.exit(1)
    })
    app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running on http://${process.env.DOMAIN}:${process.env.PORT}`);
    })
})
.catch((err)=>{
    
})


