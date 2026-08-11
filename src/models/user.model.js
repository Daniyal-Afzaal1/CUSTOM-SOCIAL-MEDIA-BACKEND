import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

const userSchema = new mongoose.Schema({
    watchHistory : [
       {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
        required : true
       }    
    ],
    username:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true      //a special data structure that helps database find info faster, they use memory so not every field has this, we have to do this thoughtfully
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,   //cloudinary url
        required: true
    },
    coverImage: {
        type: String,
    },
    password:{
        type: String,
        required: [true, 'Password is required']
    },
    refreshToken: {
        type: String
    }

},{timestamps: true});

userSchema.pre("save", async function (next){    //pre middleware: hashes before saving passowrd 
    if(!this.isModified("password")){       //it make sure only when password field is added 
        return next();                      //newly or is modified then save else if it is 
    }                                        //saving for another thing just move on}
    
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password);      //return true or false
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(                               //method to create token
        {
            _id: this.id,                          //payload
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,                      //secret+payload = signature
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY         //how long token will remain valid
        }
    )
}

userSchema.methods.generateRefreshToken = function(){  //both refresh and access token are sent to client, one is used for normal requests, other is used for renewal of a access token
    return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User",userSchema);

/*
1. Why are we using regular function instead of arrow function
Ans: because arrow functon have no idea of current context like this

const user = {
    name: "Ahsan",

    regular: function () {
        console.log(this.name);
    },

    arrow: () => {
        console.log(this.name);
    }
};

user.regular();
user.arrow();

----OUTPUT:----
Ahsan
undefined

2. userSchema.methods: we can add methods by using this to the schema
3. Also this is the concept of encapsulation as we are writing all the methods
   in its schema where all the properties exist, so there is no need to define
   compare method in login as well as other places like changePassword, will 
   just use this method.
*/
