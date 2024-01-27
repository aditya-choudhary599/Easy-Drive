import mongoose from "mongoose";

const file_schema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_model',
        required: true
    },
    file_ref_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    folder_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'folder_model',
        required: true
    },
    psudeo_file_name: {
        type: String,
        required: true
    }
});

file_schema.index({ folder_id: 1, psudeo_file_name: 1 }, { unique: true });

export const file_model = mongoose.model("file_model", file_schema);