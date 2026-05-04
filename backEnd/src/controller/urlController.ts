import type { Request, Response } from "express";
import mongoose from "mongoose";
import { nanoid } from "nanoid";
import urlModel from "../model/urlSchema.js";

// a function return a string as a value
function publicBaseUrl(): string {
    const base = process.env.BASE_URL?.replace(/\/$/, "") ?? "http://localhost:5000";
    return base;
}


// method : POST format : raw -> JSON ( either "url" or "originalUrl" )
const shortenUrl = async (req: Request, res: Response) => {
    try {
        // retrieve one of the under options 
        const { url, originalUrl } = req.body as {
            url?: string;
            originalUrl?: string;
        };

        // passing 
        const longUrl = url ?? originalUrl;

        // check for empty url
        if (!longUrl) {
            return res.status(400).json({ message: "A url is required " });
        }

        // Validate : n"new URL()" throws if the string is not a usable absolute URL.
        try {
            new URL(longUrl);
        } catch {
            return res.status(400).json({ error: "Invalid URL" });
        }

        //Generate a random shortID and ensure it does not match with an existing one.
        let shortCode = nanoid(10);

        while (await urlModel.findOne({ shortUrl: shortCode })) {
            shortCode = nanoid(10);
        }

        // Store the long URL and shortID; the redirect handler looks up by `shortUrl`.
        const doc = await urlModel.create({
            fullUrl: longUrl,
            shortUrl: shortCode,
        });

        // Build the clickable short link: BASE_URL + "/" + shortID (BASE_URL from env, trimmed).
        const base = publicBaseUrl();
        const shortURL = `${base}/${doc.shortUrl}`;

        // return the shorten link for redirection 
        return res.status(201).json({
            shortID: doc.shortUrl,
            shortURL,
        });
    } catch (error) {
        console.error("Internal server error !!!");
        return res.status(500).json(" Server Error ");
    }
};


const redirectByShortCode = async (req: Request, res: Response) => {
    const shortCode = req.params.shortCode;
    if (!shortCode) {
        return res.status(400).send("Missing short code");
    }

    try {
        const doc = await urlModel.findOne({ shortUrl: shortCode });
        if (!doc) {
            return res.status(404).json({ message: "Short link not found" });
        }

        doc.clicks = (doc.clicks ?? 0) + 1;
        await doc.save();

        return res.redirect(302, doc.fullUrl);
    } catch {
        return res.status(500).json({ message: "Server error" });
    }
};

// list all stored URLs with computed public short links (newest first). 
const getAllUrl = async (req: Request, res: Response) => {
    try {
        const docs = await urlModel.find().sort({ createdAt: -1 }).lean();
        const base = publicBaseUrl();

        const urls = docs.map((doc) => ({
            _id: doc._id,
            fullUrl: doc.fullUrl,
            shortID: doc.shortUrl,
            shortURL: `${base}/${doc.shortUrl}`,
            clicks: doc.clicks ?? 0,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        }));

        return res.status(200).json({ count: urls.length, urls });
    } catch {
        return res.status(500).json({ message: "Server error" });
    }
};

// DELETE /urls/:id — remove a shortened URL document by MongoDB `_id`. */
const deleteUrl = async (req: Request, res: Response) => {
    // Grab the raw param value as TypeScript sees it (string | string[] | undefined depending on typings
    const raw = req.params.id;
    //  If it’s already a string, use it. If it’s an array, use the first element (typical “single id” case). If raw is missing or the array is empty, id becomes undefined, which your next check if (!id) catches
    const id = typeof raw === "string" ? raw : raw?.[0];

    if (!id) {
        return res.status(400).json({ message: "Missing id" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid id" });
    }

    try {
        const deleted = await urlModel.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: "URL not found" });
        }

        return res.status(200).json({
            message: "Deleted",
            id: deleted._id,
        });
    } catch {
        return res.status(500).json({ message: "Server error" });
    }
};

export { deleteUrl, getAllUrl, redirectByShortCode };
export default shortenUrl;
