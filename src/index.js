import { createRequire } from "module";
const require = createRequire(import.meta.url);
global.require = require;
require('dotenv').config({path : './.env'})   //configuring dotenv

import connectDB from "./db/index.js";  //importing detabase connection function


connectDB(); // connecting database
