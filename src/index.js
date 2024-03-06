import dotenv from "dotenv";
import connectDB from "./db/db.js";
import { app } from "./app.js";
import http from "http";
import os from "os"

import cluster from "cluster"


const lengthOfCPUos = os.cpus().length


dotenv.config({
  path: "./.env",
});

// Database connection

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < lengthOfCPUos; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {  

connectDB()
.then(() => {
  // Start the Express server
  const server = http.createServer(app);

  server.listen(process.env.PORT || 4000, () => {
    console.log(`\n ⚙️ Server is running on ${process.env.PORT || 4000} And PID ${process.pid} ⚙️`);
  });

  app.on('error', (err) => {
    // Handle uncaught exceptions or errors here
    console.error('An error occurred:', err);
  });
})
.catch((error) => {
  console.log("MONGODB CONNECTION FAILED !! :", error);
});

}






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
