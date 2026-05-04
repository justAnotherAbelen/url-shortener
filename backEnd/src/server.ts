import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import { connectMongoDB } from "./config/mongoDB.js";
import router from "./routes/urlRouter.js";

dotenv.config();
connectMongoDB();

const app = express();
const port = process.env.PORT || 5000;

const devOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
const clientOrigin = process.env.CLIENT_ORIGIN;

app.use(
  cors({
    origin: clientOrigin
      ? clientOrigin.split(",").map((o) => o.trim())
      : devOrigins,
  }),
);

app.use(express.json());

app.use("/testing", (req,res) => {
    res.send("Typescript is up and running !!!");
});

// routes 
app.use("/" , router)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
})