import mongoose from "mongoose";

export const connectMongoDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URL as string);
        console.log("Connected to MongoDB");
    }catch(error){
        console.error("Error connecting to MongoDB", error);
        process.exit(1);
    }
}