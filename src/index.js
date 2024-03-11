import { createRequire } from "module";
const require = createRequire(import.meta.url);
global.require = require;

require('dotenv').config({path : './.env'})   //configuring dotenv


import connectDB from "./db/index.js";  //importing detabase connection function
import app from "./app.js";

connectDB()// connecting database
.then(()=>{
    const port = process.env.PORT||8000;
    app.listen(port);
    console.log(`The server is running in port ${port}`);
})
.catch((error)=>{
    console.log("Database connection Failed !!!",error);
})