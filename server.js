const app=require("./App")
const connectDB=require("./DB/Database")




//config
   require("dotenv").config({
        path: 'Config/.env'
    });


//connecting Database
connectDB()   

// creating server

const server=app.listen(process.env.PORT,
    ()=>{
        console.log(`server is running on http://localhost:${process.env.PORT}`);
    });


//handing uncaught errors
process.on('uncaughtException',(err)=>{
    console.log(`Error : ${err.message}`)
    console.log(`shutting down the server for handling uncaught exception`)
})


// handling unhandled promise rejection
process.on('unhandledRejection',(err)=>{
    console.log(`Error: ${err.message}`)
    console.log(`shutting down the server for unhandled promise rejection`)

    server.close(()=>{
        process.exit(1)
    });
})