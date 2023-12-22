import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";

dotenv.config({
  path: "./.env",
});

// Database connection

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 6000, () => {
      console.log(` Server is running on PORT ${process.env.PORT}`);
    });
   
    app.on("error", (err) => {
      console.log("error", err);
    });
    
  })
  .catch((err) => {
    console.log(`MONGO DB connection failed !!!`, err);
  });





// iife

// ;(async() => {
//   try {
//     await mongoose.connect(`${process.env.MONGO_URL}/${DB_NAME}`);
//     app.on('error',(error)=> {
//         console.log('Error',error);
//         throw error
//     });
// app.listen(process.env.PORT,()=> {
//     console.log(`App is listening on PORT ${process.env.PORT}`)
// })
//   } catch (error) {
//     console.log('ERROR',error);
//     throw error
//   }
// })()
