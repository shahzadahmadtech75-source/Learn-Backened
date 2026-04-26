import dotenv from 'dotenv';
import connectDB from "./db/connect.js";
import {app} from './app.js'; // if exported as {app}
// import app from './app.js'; if simple default exported

// 1. Load config immediately
dotenv.config({ path: './.env' });
// port 
const port = process.env.PORT || 8000;

// 2. Connect and then start server
connectDB()
    .then(() => {
        app.get("/",(req,res)=>{
            res.send(`<h1> Backened is connected with the database<h1>`)
        })
        app.get("/twist",(req,res)=>{
            res.send(`<h2>Welcome to the routing twist of backened engineering</h2>`)
        })
        app.listen(port, () => {
            console.log(`🚀 Server is running at Port : ${port}`);
        });
    })
    .catch((err) => {
        // Now you will see the REAL error, not just your custom message
        console.error("MongoDB connection failed !!! ", err);
    });