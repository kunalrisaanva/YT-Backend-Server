import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

const connectDB = async () => {
    try {
      const connectionInstence =  await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
      console.log(`\n MongoDB Connected !! DB HOST : ${connectionInstence.connection.host}`);
    } catch (error) {
        console.log('Mongodb connection Failed ',error);
        process.exit(1)
    }
}


export default connectDB