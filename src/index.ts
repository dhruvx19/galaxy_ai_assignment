import express, { Express } from "express";
import http from 'http';
import cors from 'cors';
import dotenv from "dotenv";
import bodyParser from 'body-parser';
import router from "./routes/routes";
import groqRouter from "./routes/groq_router";
import { connectDB } from "./db"; 

const app: Express = express()
const server = http.createServer(app)

app.use(cors());
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
const PORT = process.env.PORT || 3000;
app.set("BASE_URL", "localhost")

dotenv.config()
connectDB();
app.use("/api/v1", router);


try {
    const port = app.get("PORT")
    server.listen(port, (): void => {
        console.log("server is listening")
    })
}
catch (error) {
       console.log(error)
}

export default server
