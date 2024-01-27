import express from "express";
import { get_disk_usage_of_user, upload_files, get_files_of_a_folder, download_file_by_id, delete_file_by_id, rename_file_by_id, move_file_by_id, copy_file_by_id } from "../api_controllers/file_controllers.js";
import { upload } from "../multer_file_upload.js";

const files_router = express.Router();

files_router.post('/get_disk_usage_of_user', get_disk_usage_of_user);
files_router.post('/upload_files', upload.array('files'), upload_files);
files_router.post('/get_files_of_a_folder', get_files_of_a_folder);
files_router.post('/download_file_by_id', download_file_by_id);
files_router.post('/delete_file_by_id', delete_file_by_id);
files_router.post('/rename_file_by_id', rename_file_by_id);
files_router.post('/move_file_by_id', move_file_by_id);
files_router.post('/copy_file_by_id', copy_file_by_id);

export { files_router };