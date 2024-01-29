import express from "express";
import { upload } from "../multer_file_upload.js";
import { get_list_of_shared_items, create_a_shared_item_entry, delete_a_shared_item_entry, create_a_qr_code, decode_a_qr_code_and_get_data } from "../api_controllers/shared_item_controller.js";

const shared_items_router = express.Router();

shared_items_router.post('/get_list_of_shared_items', get_list_of_shared_items);
shared_items_router.post('/create_a_shared_item_entry', create_a_shared_item_entry);
shared_items_router.post('/delete_a_shared_item_entry', delete_a_shared_item_entry);
shared_items_router.post('/create_a_qr_code', create_a_qr_code);
shared_items_router.post('/decode_a_qr_code_and_get_data', upload.single("file"), decode_a_qr_code_and_get_data);

export { shared_items_router };