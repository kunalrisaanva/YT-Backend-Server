import { Router } from "express";
import { registerUser , loginUser , logOutUser} from "../controllers/userController.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt as verifyRoute } from "../middlewares/auth.middleware.js";
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

router.route("/logout").post(verifyRoute , logOutUser)

export default router;
 