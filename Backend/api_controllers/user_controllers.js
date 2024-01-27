import bcrypt from "bcrypt";
import { user_model } from "../database_scripts/models/User_model.js";

export const create_user = async (req, res) => {
    const { name, email_id, mobile_number, password } = req.body;
    const hashed_password = await bcrypt.hash(password, 10);

    try {
        const new_entry = new user_model({
            name: name,
            email_id: email_id,
            mobile_number: mobile_number,
            password: hashed_password
        });
        const saved_user = await new_entry.save();
        return res.send({ message: "User created successfully!", user_id: saved_user._id });
    } catch (error) {
        return res.send({ message: "Couldn't create the user!" });
    }
};

export const verify_user = async (req, res) => {
    const { email_id, password } = req.body;

    try {
        const user_instance = await user_model.findOne({ email_id: email_id });
        if (!user_instance) {
            return res.send({ message: "You are not registered user!" });
        }
        const is_password_match = await bcrypt.compare(password, user_instance.password);
        if (is_password_match) {
            res.send({
                message: "Authenticated succesfully",
                user_id: user_instance._id,
                name: user_instance.name,
                email_id: user_instance.email_id,
                mobile_number: user_instance.mobile_number
            });
        }
        else {
            return res.send({ message: "Password entered wrongly!" });
        }
    } catch (error) {
        return res.send({ message: "Internal server error!" });
    }
};

export const change_password = async (req, res) => {
    const { user_id, old_password, new_password } = req.body;
    try {
        const result = await user_model.findById(user_id);
        const is_password_match = await bcrypt.compare(old_password, result.password);
        if (is_password_match) {
            if (old_password === new_password) {
                return res.send({ message: "Your new password is same as old password" });
            }
            const new_hashed_password = await bcrypt.hash(new_password, 10);
            await user_model.findByIdAndUpdate(user_id, { password: new_hashed_password });
            return res.send({ message: "Password changed successfully!" });
        }
        else {
            return res.send({ message: "You enetered wrong password!" });
        }
    } catch (error) {
        return res.send({ message: "Internal server error!" });
    }
};
