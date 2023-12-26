import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },

    avatar: {
      type: String, // cloudnary url
      required: true,
    },

    coverImage: {
      type: String, // cloudnary url
    },

    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],

    password: {
      type: String,
      required: [true, " Password is Required "],
    },

    refreshToken: {
      type: String,
    },
  },

  {
    timestamps: true,
  }
);


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


userSchema.methods.isPasswordCorrect = async function(passwword){
    return await bcrypt.compare(passwword,this.password);
}


userSchema.methods.genrateAccessToken = async function(){
      return  await jwt.sign(
            {
            _id:this._id,
            email:this.email,
            username:this.username,
            fullName:this.fullName
        },
        process.env.ACCRESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCRESS_TOKEN_EXPIRY
        }

         )
       
}

userSchema.methods.genraterefreshToken = async function(){
 return  await jwt.sign(
            {
            _id:this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
        
         )
}


export const User = mongoose.model("User", userSchema);
