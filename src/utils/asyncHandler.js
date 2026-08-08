// function async_handler(fn) {
//     return async function (req, res, next) {
//         try {
//             await fn(req, res, next);
//         } catch (error) {
//             res.status(err.code || 500).json({
//                 success: false,
//                 message: err.message
//           })
//         }
//     };
// }

// or it can be written like this

// function async_handler(fn) {
//     return async function (req, res, next) {
//         try {
//             await fn(req, res, next);
//         } catch (error) {
//             next(error); // send to global error handler
//         }
//     };
// }

// or like this
function asyncHandler(fn) {
    return (req,res,next) => {                   //express receives the returned function in route
        Promise.resolve(fn(req,res,next))
        .catch((err) => next(err))     //it passes the error to the express's error-handling middleware
    }
}

 export {asyncHandler}

