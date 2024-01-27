import mongoose from "mongoose";

const folder_schema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_model',
        required: true
    },
    folder_path: {
        type: String,
        required: true,
    },
    created_on:{
        type:Date,
        default:Date.now(),
        required:true
    }
});

folder_schema.index({ user_id: 1, folder_path: 1 }, { unique: true });

export const folder_model = mongoose.model("folder_model", folder_schema);