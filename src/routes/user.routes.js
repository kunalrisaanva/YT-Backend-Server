import { Router } from "express";
import { registerUser , loginUser , logOutUser} from "../controllers/userController.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verify } from "jsonwebtoken.js";
const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);


//secure routes 

router.route("/logut").get(verify , logOutUser)

export default router;
