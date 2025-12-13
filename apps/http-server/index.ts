import express from "express";
import { router } from "./routes/route.ts";
const app = express();

app.use(express.json()); // Middleware to parse JSON requests
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded requests

app.get("/", (req, res) => {
    console.log("hello your application is working fine");
    res.status(200).json({ msg: "working fine" });
});
app.use("/api/v1/", router);

app.listen("8000", () => {
    console.log("http-server is running at port 8000");
});
