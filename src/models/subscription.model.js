import mongoose,{Schema} from "mongoose";
import { User } from "./user.model";


const subscriptionSchema = new Schema({
    subscriber :{
        type: Schema.Types.ObjectId, //one who is subscribing
        ref:'User',
    },
    channel : {
        type: Schema.Types.ObjectId,
        ref : 'User'  //the one to whom subscriber is subscribing
    }

},{timestamps:true})