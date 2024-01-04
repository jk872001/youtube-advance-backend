import express from "express";
import dbConnect from "./db/index.js";
import dotenv from "dotenv"
dotenv.config()

const app=express();
const PORT=process.env.PORT

dbConnect()


app.get("/",(req,res)=>{
    res.send("Hello World")
})

app.listen(PORT,()=>{
    console.log(`App is listening on port ${PORT}`)
})