//Here i have done detabase connection using mongoose
//and exported it to index.js
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async ()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`mongoDB succesfully connected; DB HOST : ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("mongoDB connection error ", error);
    }
}

export default connectDB;