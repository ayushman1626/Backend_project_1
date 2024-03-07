const asyncHandler = (func) =>async (req,res,next)=>{
    try {
        func(req,res,next);
    } catch (error) {
        res.status(err.code ||500).json(
            {
                success : false,
                message : err.message
            }
        )
    }
} 

export {asyncHandler};
//promise code

// const asyncHandler = (requestHandler)=>{
//     (req,res,next)=>{
//         Promise
//         .resolve(requestHandler(req,res,next))
//         .catch((err)=>next(err))
//     }
// }