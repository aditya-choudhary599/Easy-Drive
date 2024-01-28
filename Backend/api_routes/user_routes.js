import express from "express";
import { get_user_name_from_user_id, create_user, verify_user, change_password } from "../api_controllers/user_controllers.js"

const user_router = express.Router();

user_router.post('/get_user_name_from_user_id', get_user_name_from_user_id);
user_router.post('/create_user', create_user);
user_router.post('/verify_user', verify_user);
user_router.post('/change_password', change_password);

export { user_router };