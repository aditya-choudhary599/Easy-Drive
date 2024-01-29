import mongoose from "mongoose";

const shared_item_schema = new mongoose.Schema({
    source_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user_model',
        required: true
    },
    type_of_entity: {
        type: String,
        required: true
        // allowded options are 'File' and 'Folder'
    },
    entity_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        unique: true
    }
});

export const shared_item_model = mongoose.model("shared_item_model",shared_item_schema);