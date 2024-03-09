import  express  from "express";
import cors from "cors";
import cookieParser from "cookie-parser";  //cookie-parser is used so that we can perform CRUD(acess or set kr pau) operaions on cookies of users browser from our server


const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    Credential:true
}))    

app.use(express.json({limit:"20kb"})) // this is used because we have to set some limit of json file that would come to us as it may be of many size so we have mentioned the size as it will not affect our system
app.use(express.urlencoded({extended:true, limit: "20kb"})) // this is also used for urls coming so we can control the urls and it sizes
app.use(express.static("public")) //here static means any files/pdf or anything we want to save in our local system so that we can acess it locally so in public folder it will be kept
app.use(cookieParser())

//routes import 
import userRoute from "./routes/user.routes.js"


//routes declaration (here we cannot use app.get because here we have to ue midlleware )

app.use('/api/v1/users', userRoute);





export {app};