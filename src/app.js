import express from "express"
import cors from "cors"


const app=express()

app.use(cors())

app.get("/health",(req,res)=>{
    return res.status(200).json({
        message:"server is running",
        
    })

})

export default app

