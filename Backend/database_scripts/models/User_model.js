import mongoose from "mongoose";

const user_schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    email_id: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        validate: {
            validator: (value) => {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
            },
            message: "Invalid email format!"
        }
    },
    mobile_number: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => {
                return /^[0-9]{10}$/.test(value);
            },
            message: 'Invalid mobile number format (should be 10 digits)'
        }
    },
    password: {
        type: String,
        required: true,
        trim: true
    }
});

export const user_model = mongoose.model("user_model", user_schema);
