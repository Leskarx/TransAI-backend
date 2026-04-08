import express from "express"
import cors from "cors"
import translateController from "./controllers/translate.Controller.js"
import aimodeController from "./controllers/aimode.controller.js"


const app=express()

app.use(cors())
app.use(express.json())

app.get("/health",(req,res)=>{
    return res.status(200).json({
        message:"server is running",
        
    })

})
app.get("/ip", async (req, res) => {
    const r = await fetch("https://ipapi.co/json/");
    res.json(await r.json());
  });

app.post("/translate",translateController)
app.post("/aimode",aimodeController)


export default app

