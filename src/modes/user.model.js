 import mongoose,{Schema} from "mongoose";
 import jwt from "jsonwebtoken";
 import bcrypt from "bcrypt";


 const userSchema = new Schema({
userName :{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true,
},
email :{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
},
fullName :{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true,
},
avatar:{
    type:String,  //cloudinary url
    required:true,
},
coverImage:{
    type:String,  //cloudinary url
},
watchHistory:[
    {
        type:Schema.Types.ObjectId,
        ref: "Video"
    },
],
password:{
    type:String,
    required:[true,"Password is required"]
},
refreshToken:{
    type:String,
    required:true,
},
 },{timestamps:true})


 userSchema.pre("save", function (next){  //here we did not used the arrow fxns because we cannot access this in arrow functions and here pre is a hook used to encrypt 
    if(!this.isModified("password")) next();  // our password after some modification in it or at the time of registration just before saving it and we used next() middleware
     // just to go on next task.

    this.password = bcrypt.hash(this.password, 10);
    next();
 })


 // here we use methods to use some methods to check wether the password is correct or not

userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password, this.password);
}

//now we use methods(inbuilt method mongoose) to generate access and refresh tokens

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id:this.id,
            userName:this.userName,
            email:this.email,
            fullName:this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY,
        }
    )
}
//refresh TOken
userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id :this.id,
        // here only we give detail of id because refresh token baar baar refresh hoti rehti h to usme itni  details ki jrurat nhi lgti
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}







 export const User = mongoose.model('User',userSchema);