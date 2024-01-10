import mongoose from "mongoose"
import { DB_NAME } from "../../contants.js"



const dbConnect=async()=>
{
    try{
       const connectionInstance=await mongoose.connect(`${process.env.MONGO_URI}`)
       console.log(`MongoDb connected successfully ! , DB HOST ${connectionInstance.connection.host}`)
    }catch(err){
          console.log("MongoDb connection error",err.message)
          process.exit(1)
    }
}

export default dbConnect;




