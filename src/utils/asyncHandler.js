

const asyncHandler = (reqestHandler) => (req,res,next) => {
   
    Promise.resolve(reqestHandler(req,res,next)).catch( err => next(err))

}  


export default asyncHandler





 

// const asyncHandler = (reqestHandler) => async(req,res,next) => {
//     try {
//         await reqestHandler(req,res,next);
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
//     }
// }


// const asyncHandler = (requestHandler) => {
//     return (req, res, next) => {
//         Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
//     }
// }


// const asyncHandler = (reqestHandler) => {
    // return  (req,res,next) => {
        // try {
            //         await reqestHandler(req,res,next);
            //     } catch (error) {
            //         res.status(err.code || 500).json({
            //             success:false,
            //             message:err.message
            //         })
            //     }   
    // }
// }



