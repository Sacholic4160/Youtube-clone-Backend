// (require ('dotenv').config({path: './.env}));   this line of code is used in previous versions so now a days we can resolve it by separating it
import dotenv from "dotenv";
// import http from "http";
//import express from "express";
//import { DB_NAME}  from "./constants.js"
import connectDB from "./db/index.js";
import { app } from "../src/app.js";

dotenv.config({
  path: "./.env",
});

//const app = express();

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log(
        "MONGODB Connection Successfull ,but Express is not listening",
        err
      );
      throw err;
    });
    app.listen(process.env.PORT ,() => {
      console.log(
        `Hii, my server is listening on this port number: ${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.log(`MONGODB connection failed ${error}`);
  });


  //before this is how we create a  server using http instead of using express
  // const server = http.createServer(app).listen(`${process.env.PORT}`, console.log("hii, my app is running"));
//one way to connect our database to server

// //here we can use imediately invoked fxn(iife) and before iife parenthesis we can also use a semicolon to crosscheck so that someone forgot to add a semicolon on the last line.

// ( async ()=> {
//      try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         //here we check using listeners if our database is connected but it is unable to talk to the express
//         app.on("error",(err)=>{
//             console.log(`Error occured :${err}`);
//             throw err;
//         })

//         //here we check if our server is listening on this port or not

//         app.listen(process.env.PORT,()=>{
//             console.log(`Hii, Server is listening on this port number: ${process.env.PORT}`)
//         })
//      } catch (error) {
//         console.log(`Something went wrong , error occured :${error}`)
//      }
// })()
