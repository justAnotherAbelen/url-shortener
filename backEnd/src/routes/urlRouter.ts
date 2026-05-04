import express from "express";
import type { Request, Response } from "express";
import shortenUrl, { deleteUrl, getAllUrl, redirectByShortCode } from "../controller/urlController.js";

const router = express.Router();

router.get("/shorten", (req: Request, res: Response) => {
    res.send("you are trying to shorten a url link");
});

// transform to short url
router.post("/shortenUrl", shortenUrl);

// get all shorten urls 
router.get("/urls", getAllUrl);

// delete shorten url using id in mongoose
router.delete("/urls/:id", deleteUrl);

// Must be last: single-segment paths are treated as short codes
router.get("/:shortCode", redirectByShortCode);

export default router;
