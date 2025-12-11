import express from 'express'
const app = express()

app.get("/", (req, res) => {

    console.log("hello your application is working fine");
    res.status(200).json({ msg: "working fine" })
})

app.listen("8000", () => {
    console.log("http-server is running at port 8000")
})  