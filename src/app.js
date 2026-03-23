import express from "express"
import cors from "cors"
import translateController from "./controllers/translate.Controller.js"
import e from "cors"


const app=express()

app.use(cors())
app.use(express.json())

app.get("/health",(req,res)=>{
    return res.status(200).json({
        message:"server is running",
        
    })

})

app.post("/translate",translateController)

export default app

