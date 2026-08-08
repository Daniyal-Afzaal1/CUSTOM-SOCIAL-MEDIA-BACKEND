class ApiError extends Error{
    constructor(statusCode,message = "Something went wrong",errors=[],stack=""){
        super(message);             //parent constructor call
        this.statusCode =statusCode;
        this.data = null;    //for an error response there is no successful data to return, so setting data to null
        this.message = message;
        this.errors = errors;
        this.success = false;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor)
        }
        
    }
}

export {ApiError};