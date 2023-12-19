import dotenv from "dotenv";
import connectDB from "./db/db.js";


dotenv.config({
    path:'./.env'
})

connectDB() // Database connection 






// iife 

// ;(async() => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
//     app.on('error',(error)=> {
//         console.log('Error',error); 
//         throw error
//     })
//   } catch (error) {
//     console.log('ERROR',error);
//     throw error
//   }
// })()