const asyncHandler = (fn) => async (req, res, next) => {
  try {
      await fn(req, res, next)
  } catch (err) {
    console.log(err)
      res.status(err.code || 500).json({
          success: false,
          message: err.message
      })
  }
}
export { asyncHandler };

//First we make this method using async and try and catch & in this we used higher order fxns where fxns are passed inside a fxn

// const asyncHandler = (fxn) => {
//     async (req,res,next) => {   // here next keyword is used for middleware work as if a fxn is over then it will direct it to go to the next middlware or next method

// try {
//    await fxn(req,res,next)
// } catch (error) {
//     res.status(error.code || 500).json({
//         success:false,
//         message: error.message
//     })
// }
//     }
// }
