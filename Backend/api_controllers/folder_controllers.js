import { folder_model } from "../database_scripts/models/Folder_model.js";
import { file_model } from "../database_scripts/models/File_model.js";
import { join } from "path"
import fs from "fs";
import { gfs } from "../database_scripts/connect_to_database.js"
import archiver from "archiver";
import { rimraf } from "rimraf";
import { generate_unique_filename } from "./file_controllers.js";

const get_all_related_folders = async (user_id, folder_id) => {
    const current_folder_instance = await folder_model.findById(folder_id);
    const all_folder_instance_of_user = await folder_model.find({ user_id: user_id });

    const all_related_folders = [];

    for (let record of all_folder_instance_of_user) {
        if (record.folder_path.includes(current_folder_instance.folder_path)) {
            all_related_folders.push(record);
        }
    }

    return all_related_folders;
};

export const get_list_of_folder_to_copy_or_move = async (req, res) => {
    const { user_id, folder_id } = req.body;
    const curr_folder_obj = await folder_model.findById(folder_id);
    const all_folder_records = await folder_model.find({ user_id: user_id });
    const ans = [];
    for (const folder of all_folder_records) {
        if (!curr_folder_obj._id.equals(folder._id)) {
            ans.push({
                folder_path: folder.folder_path,
                folder_id: folder._id
            });
        }
    }
    return res.send({ ans: ans });
};

export const get_list_of_folder_to_copy_or_move_2 = async (req, res) => {
    const { user_id, curr_folder_id, folder_to_copy_or_move_id } = req.body;
    const curr_folder_obj = await folder_model.findById(curr_folder_id);

    const temp = await get_all_related_folders(user_id, folder_to_copy_or_move_id);
    const prohibited_option_ids = temp.map((record) => { return record._id });
    prohibited_option_ids.push(curr_folder_obj._id);

    const all_user_folders = await folder_model.find({ user_id: user_id });
    const ans = [];
    for (const record of all_user_folders) {
        let flag = true;
        for (const x of prohibited_option_ids) {
            if (x.equals(record._id)) {
                flag = false;
                break;
            }
        }
        if (flag) {
            ans.push({
                folder_path: record.folder_path,
                folder_id: record._id
            });
        }
    }
    return res.send({ ans: ans });
};

export const get_folder_id_of_root = async (req, res) => {
    const { user_id } = req.body;
    const response = await folder_model.findOne({ user_id: user_id, folder_path: 'Root' });
    return res.send({ root_folder_id: response._id });
};

export const get_immediate_folders_of_a_folder = async (req, res) => {
    const user_id = req.body.user_id;
    let folder_id = req.body.folder_id
    if (!folder_id) {
        const temp = await folder_model.findOne({ user_id: user_id, folder_path: 'Root' });
        folder_id = temp._id;
    }

    try {
        const curr_folder_obj = await folder_model.findById(folder_id);
        const curr_folder_path_arr = curr_folder_obj.folder_path.split('/');

        const all_related_folders = await get_all_related_folders(user_id, folder_id);
        const ans = [];
        for (const record of all_related_folders) {
            const temp_arr = record.folder_path.split('/');
            if (temp_arr.length - curr_folder_path_arr.length === 1) {
                ans.push({
                    folder_id: record._id,
                    folder_name: temp_arr[temp_arr.length - 1],
                    folder_created_on: record.created_on
                });
            }
        }

        return res.send({ all_folders: ans });

    } catch (error) {
        console.log(error);
        return res.send({ message: "Internal server error!" });
    }

};

export const get_parent_folder_id = async (req, res) => {
    const { user_id, child_folder_id } = req.body;
    const child_folder_obj = await folder_model.findById(child_folder_id);
    if (child_folder_obj.folder_path === 'Root') {
        return res.send({ parent_folder_id: child_folder_id, is_parent_root: true });
    }
    const temp_path = child_folder_obj.folder_path.split('/');
    temp_path.pop();
    const parent_folder_obj = await folder_model.findOne({ user_id: user_id, folder_path: temp_path.join('/') });
    if (parent_folder_obj.folder_path === 'Root') {
        return res.send({ parent_folder_id: parent_folder_obj._id, is_parent_root: true });
    }
    else {
        return res.send({ parent_folder_id: parent_folder_obj._id, is_parent_root: false })
    }
};

export const get_folder_path_from_folder_id = async (req, res) => {
    try {
        const { folder_id } = req.body;
        const response = await folder_model.findById(folder_id);
        return res.send({ folder_path: response.folder_path });
    } catch (error) {
        return res.send({ folder_path: 'null' });
    }
};

export const create_folder = async (req, res) => {
    const { user_id, folder_path } = req.body;
    const new_folder = new folder_model({
        user_id: user_id,
        folder_path: folder_path.join('/')
    })
    try {
        await new_folder.save();
        return res.send({ message: "Folder created successfully!" });
    } catch (error) {
        return res.send({ message: "Folder not created!" });
    }
};

export const download_a_folder_by_id = async (req, res) => {
    const { user_id, folder_id } = req.body;
    const curr_folder_obj = await folder_model.findById(folder_id);

    if (!curr_folder_obj) {
        return res.send({ message: "Not able to find the folder" });
    }

    try {
        const all_related_folders = await get_all_related_folders(user_id, folder_id);

        for (const folder of all_related_folders) {
            const local_disk_folder_path = join(process.cwd(), "temp_downloads", folder.folder_path.replace('Root/', ''));
            fs.mkdirSync(local_disk_folder_path, { recursive: true });

            const files = await file_model.find({ folder_id: folder._id });
            for (const file of files) {
                const new_download_stream = gfs.openDownloadStream(file.file_ref_id);
                const new_write_stream = fs.createWriteStream(join(local_disk_folder_path, file.psudeo_file_name));
                new_download_stream.pipe(new_write_stream);
                new_write_stream.on('finish', () => { });
            }
        }

        const requested_folder = await folder_model.findById(folder_id);
        const helper_path = join(process.cwd(), "temp_downloads", requested_folder.folder_path.replace('Root/', ''));
        const zip_write_stream = fs.createWriteStream(helper_path + '.zip');
        const archive = archiver('zip', { zlib: { level: 9 } });
        archive.pipe(zip_write_stream);
        archive.directory(helper_path, false);
        await archive.finalize();

        const read_stream = fs.createReadStream(helper_path + '.zip');
        res.setHeader('Content-Disposition', 'attachment; filename=zip_file.zip');
        res.setHeader('Content-Type', 'application/zip');

        read_stream.pipe(res);

        read_stream.on("close", () => {
            rimraf.sync(join(process.cwd(), "temp_downloads"));
            fs.mkdirSync(join(process.cwd(), "temp_downloads"));
        })

    } catch (error) {
        console.log(error);
        res.send(500).send("error!");
    }
};

export const update_folder_name_by_id = async (req, res) => {
    const { user_id, folder_id, new_folder_path } = req.body;
    const new_folder_name = new_folder_path.join('/');
    const original_instance = await folder_model.findById(folder_id);

    try {
        const all_folders_to_update = await get_all_related_folders(user_id, folder_id);

        for (const folder of all_folders_to_update) {
            const curr_folder_obj = await folder_model.findById(folder._id);
            const temp = curr_folder_obj.folder_path.replace(original_instance.folder_path, new_folder_name);
            await folder_model.findByIdAndUpdate(folder._id, { folder_path: temp }, { runValidators: true });
        }

        return res.send({ message: "Folder name updated successfully!" });
    } catch (error) {
        return res.send({ message: "Internal server error!" });
    }
};

export const delete_a_folder_by_id = async (req, res) => {
    const { user_id, folder_id } = req.body;

    try {
        const all_folders_to_delete = await get_all_related_folders(user_id, folder_id);

        for (const folder of all_folders_to_delete) {
            const files = await file_model.find({ folder_id: folder._id });
            for (const file of files) {
                await gfs.delete(file.file_ref_id);
                await file_model.findByIdAndDelete(file._id);
            }

            await folder_model.findByIdAndDelete(folder._id);
        }

        return res.send({ message: "Folder deleted successfully!" });
    } catch (error) {
        return res.send({ message: "Internal server error!" });
    }
};

export const move_a_folder_by_id = async (req, res) => {
    const { user_id, curr_folder_id, curr_folder_parent_id, new_folder_id } = req.body;
    if (curr_folder_id === new_folder_id) {
        return res.send({ message: "Bad Request!" });
    }

    try {
        const curr_folder_parent_obj = await folder_model.findById(curr_folder_parent_id);
        const curr_folder_obj = await folder_model.findById(curr_folder_id);
        const new_folder_obj = await folder_model.findById(new_folder_id);

        const curr_folder_parent_prefix = curr_folder_parent_obj.folder_path;
        const old_prefix = curr_folder_obj.folder_path;
        const new_prefix = new_folder_obj.folder_path + '/' + old_prefix.replace(curr_folder_parent_prefix + '/', '');

        const all_folders_to_move = await get_all_related_folders(user_id, curr_folder_id);

        for (const folder of all_folders_to_move) {
            const temp = folder.folder_path.replace(old_prefix, new_prefix);
            await folder_model.findByIdAndUpdate(folder._id, { folder_path: temp });
        }

        return res.send({ message: "Folder moved successfully!" });
    } catch (error) {
        return res.send({ message: "Internal server error!" });
    }
};

export const copy_a_folder_by_id = async (req, res) => {
    const { user_id, curr_folder_id, curr_folder_parent_id, new_folder_id } = req.body;
    if (curr_folder_id === new_folder_id) {
        return res.send({ message: "Bad Request!" });
    }

    try {
        const curr_folder_parent_obj = await folder_model.findById(curr_folder_parent_id);
        const curr_folder_obj = await folder_model.findById(curr_folder_id);
        const new_folder_obj = await folder_model.findById(new_folder_id);

        const curr_folder_parent_prefix = curr_folder_parent_obj.folder_path;
        const old_prefix = curr_folder_obj.folder_path;
        const new_prefix = new_folder_obj.folder_path + '/' + old_prefix.replace(curr_folder_parent_prefix + '/', '');

        const all_folders_to_copy = await get_all_related_folders(user_id, curr_folder_id);

        for (const folder of all_folders_to_copy) {
            const new_path = folder.folder_path.replace(old_prefix, new_prefix);

            const new_folder_instance = new folder_model({
                user_id: folder.user_id,
                folder_path: new_path
            });

            await new_folder_instance.save();

            const all_files = await file_model.find({ folder_id: folder._id });

            for (const file of all_files) {
                const file_local_disk_path = join(process.cwd(), "temp_downloads", file.psudeo_file_name);

                const new_download_stream = gfs.openDownloadStream(file.file_ref_id);
                const new_write_stream = fs.createWriteStream(file_local_disk_path);
                new_download_stream.pipe(new_write_stream);

                new_write_stream.on("finish", async () => {
                    const new_upload_stream = gfs.openUploadStream(generate_unique_filename(file.psudeo_file_name));
                    const new_read_stream = fs.createReadStream(file_local_disk_path);
                    new_read_stream.pipe(new_upload_stream);

                    new_upload_stream.on("finish", async () => {
                        const new_file_model_entry = new file_model({
                            user_id: file.user_id,
                            file_ref_id: new_upload_stream.id,
                            folder_id: new_folder_instance._id,
                            psudeo_file_name: file.psudeo_file_name
                        });

                        await new_file_model_entry.save();

                        fs.unlinkSync(file_local_disk_path);
                    });
                });
            }
        }

        return res.send({ message: "Folder copied successfully!" });
    } catch (error) {
        return res.send({ message: "Internal server error!" });
    }
};