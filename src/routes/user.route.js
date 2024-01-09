import { Router } from "express";

const userRouter=Router()

userRouter.get("/registerUser",(req,res)=>{
    res.send("Hello")
})


export {userRouter};