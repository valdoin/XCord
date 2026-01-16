import { Router } from "express";
import { fetchTweet } from "./controllers/tweetController";

const router = Router();

router.get("/:tweetID", fetchTweet);

export default router;