import express from "express";
import { get_list_of_folder_to_copy_or_move, get_list_of_folder_to_copy_or_move_2, get_folder_id_of_root, get_immediate_folders_of_a_folder, get_parent_folder_id, get_folder_path_from_folder_id, create_folder, delete_a_folder_by_id, update_folder_name_by_id, download_a_folder_by_id, move_a_folder_by_id, copy_a_folder_by_id } from "../api_controllers/folder_controllers.js";

const folder_router = express.Router();

folder_router.post('/get_list_of_folder_to_copy_or_move', get_list_of_folder_to_copy_or_move);
folder_router.post('/get_list_of_folder_to_copy_or_move_2', get_list_of_folder_to_copy_or_move_2);
folder_router.post('/get_folder_id_of_root', get_folder_id_of_root);
folder_router.post('/get_immediate_folders_of_a_folder', get_immediate_folders_of_a_folder);
folder_router.post('/get_parent_folder_id', get_parent_folder_id);
folder_router.post('/get_folder_path_from_folder_id', get_folder_path_from_folder_id);
folder_router.post('/create_folder', create_folder);
folder_router.post('/download_a_folder_by_id', download_a_folder_by_id);
folder_router.post('/update_folder_name_by_id', update_folder_name_by_id);
folder_router.post('/delete_a_folder_by_id', delete_a_folder_by_id);
folder_router.post('/move_a_folder_by_id', move_a_folder_by_id);
folder_router.post('/copy_a_folder_by_id', copy_a_folder_by_id);

export { folder_router };