import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser"; //cookie-parser is used so that we can perform CRUD(acess or set kr pau) operaions on cookies of users browser from our server
import userRouter from "./routes/user.route.js"; //default user route import
import videoRouter from "./routes/video.route.js"; //default video route import
import subsRouter from "./routes/subscription.route.js"; //default subscription route import
import dashboardRouter from "./routes/dashboard.route.js";
import tweetRouter from "./routes/tweet.route.js";
import commentRouter from "./routes/comment.route.js";

const app = express();

//here we are using cors and configuring it so we have to use app.use
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true,
  })
);

app.use(express.json({ limit: "20kb" })); // this is used because we have to set some limit of json file that would come to us as it may be of many size so we have mentioned the size as it will not affect our system
app.use(express.urlencoded({ extended: true, limit: "20kb" })); // this is also used for urls coming so we can control the urls and it sizes
app.use(express.static("public")); //here static means any files/pdf or anything we want to save in our local system so that we can acess it locally so in public folder it will be kept
app.use(cookieParser());

//checking if cookie is enabled or not!

app.get("/check-cookies", (req, res) => {
  const cookies = req.cookies?.accessToken;
  console.log(cookies);
  if (cookies && Object.keys(cookies).length > 0) {
    res.send("Cookies are enabled");
  } else {
    res.send("Cookies are disabled");
  }
});

//here we are giving a route so that using this route we can make requests for various methods
app.use("/api/v1/users", userRouter); //routes declaration (here we cannot use app.get because here we have to ue midlleware or to configure something)
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/subscriptions", subsRouter);
app.use("/api/v1/dashboard", dashboardRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/comment", commentRouter);

export { app };

// app.use((req,res,next)=>{
//   res.status(200).json({message:"app is running"}

//   )
//  })
