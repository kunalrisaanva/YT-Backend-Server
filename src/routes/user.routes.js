import { Router } from "express";
import { registerUser , loginUser , logOutUser , refreshAccessToken, 
  changeCurrenPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
} 
from "../controllers/userController.js";

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

router.route("/logout").post(verifyRoute , logOutUser);
router.route("/refresh-Token").post(refreshAccessToken);
router.route("/change-password").post(verifyRoute,changeCurrenPassword);
router.route("/current-user").get(verifyRoute,getCurrentUser);
router.route("/update-account").patch(verifyRoute,updateAccountDetails)
router.route("/update-avatar").patch(verifyRoute,upload.single("avatar"),updateUserAvatar);
router.route("/update-cover-image").patch(verifyRoute,upload.single("coverImage"),updateUserCoverImage);
router.route("/channel/:username").get(verifyRoute,getUserChannelProfile);
router.route("/history").get(verifyRoute,getWatchHistory);


export default router;
 