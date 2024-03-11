import { asyncHandler } from "../utils/asyncHandler.js";



const registerUser = asyncHandler( async (req,res) => {
   await res.status(200).json({
        message : "We are going in right direction"
    })
})

export {registerUser}