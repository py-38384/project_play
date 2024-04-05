import express from 'express'
import cors from 'cors'
import { FILE_SIZE_LIMIT } from './constants.js'
import cookieParser from 'cookie-parser'
const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}))
app.use(express.json({limit: FILE_SIZE_LIMIT}))
app.use(express.urlencoded({extended: true, limit: FILE_SIZE_LIMIT}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'
app.use("/api/v1/users", userRouter)


export default app