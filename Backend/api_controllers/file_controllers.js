import mongoose from "mongoose";
import { file_model } from "../database_scripts/models/File_model.js";
import { folder_model } from "../database_scripts/models/Folder_model.js";
import { gfs } from "../database_scripts/connect_to_database.js";
import { join } from "path";
import path from "path";
import crypto from "crypto";
import fs from "fs";

const formatFileSize = (fileSizeInBytes) => {
  const kbThreshold = 1024;
  const mbThreshold = 1024 * 1024;
  const gbThreshold = 1024 * 1024 * 1024;

  if (fileSizeInBytes < kbThreshold) {
    return `${fileSizeInBytes} B`;
  }
  else if (fileSizeInBytes < mbThreshold) {
    const fileSizeInKB = (fileSizeInBytes / kbThreshold).toFixed(2);
    return `${fileSizeInKB} KB`;
  }
  else if (fileSizeInBytes < gbThreshold) {
    const fileSizeInMB = (fileSizeInBytes / (1024 * 1024)).toFixed(2);
    return `${fileSizeInMB} MB`;
  }
  else {
    const fileSizeInGB = (fileSizeInBytes / gbThreshold).toFixed(2);
    return `${fileSizeInGB} GB`;
  }
};

export const generate_unique_filename = (filePath) => {
  const randomString = crypto.randomBytes(16).toString('hex');
  const fileNameWithoutExtension = path.basename(filePath, path.extname(filePath));
  const hash = crypto.createHash('sha256').update(randomString + fileNameWithoutExtension).digest('hex');
  const fileExtension = path.extname(filePath);
  const uniqueHash = `${hash}${fileExtension}`;
  return uniqueHash;
};

export const get_disk_usage_of_user = async (req, res) => {
  const { user_id } = req.body;
  const all_user_files = await file_model.find({ user_id: user_id });
  let ans = 0;
  for (const file of all_user_files) {
    const temp = await gfs.find(file.file_ref_id).toArray();
    ans += temp[0].length;
  }

  return res.send({ total_disk_usage: formatFileSize(ans) });
};

export const upload_files = async (req, res) => {
  try {
    const all_files_of_this_folder = await file_model.find({ user_id: req.body.user_id, folder_id: req.body.folder_id });
    for (const file of req.files) {
      const local_file_path = join(process.cwd(), 'temp_uploads', file.originalname);

      const file_data = fs.createReadStream(local_file_path);
      const upload_stream = gfs.openUploadStream(generate_unique_filename(file.originalname));
      file_data.pipe(upload_stream);

      upload_stream.on('finish', async () => {
        fs.unlinkSync(local_file_path);

        let cnt = 0;
        for (const record of all_files_of_this_folder) {
          if (record.psudeo_file_name.includes(file.originalname)) {
            cnt += 1;
          }
        }

        const new_file_name = cnt == 0 ? file.originalname : path.parse(file.originalname).name + `_copy_${cnt}` + path.parse(file.originalname).ext;

        const new_file_enrty = new file_model({
          user_id: req.body.user_id,
          file_ref_id: upload_stream.id,
          folder_id: req.body.folder_id,
          psudeo_file_name: new_file_name
        });

        await new_file_enrty.save();
      });
    }
    return res.send({ message: "All files saved successfully" });
  } catch (error) {
    return res.send({ message: "Could not complete your request!" });
  }
};

export const get_files_of_a_folder = async (req, res) => {
  try {
    const response = [];
    const user_id = req.body.user_id;
    let folder_id = req.body.folder_id;
    if (!folder_id) {
      const temp = await folder_model.findOne({ user_id: user_id, folder_path: 'Root' });
      folder_id = temp._id;
    }
    const files_model_instances = await file_model.find({ user_id: user_id, folder_id: folder_id });

    for (const doc of files_model_instances) {
      const temp = await gfs.find(doc.file_ref_id).toArray();
      const iterator = temp[0];
      response.push({
        file_id: doc._id,
        file_name: doc.psudeo_file_name,
        file_size: formatFileSize(iterator["length"]),
        file_upload_on: iterator.uploadDate
      });
    }
    return res.send({ all_files: response });
  }
  catch (error) {
    return res.send({ message: 'Internal Server Error' });
  }
};

export const download_file_by_id = async (req, res) => {
  try {
    const file_model_instance = await file_model.findById(req.body.id);
    const downloadStream = gfs.openDownloadStream(file_model_instance.file_ref_id);
    res.setHeader('Content-disposition', `attachment; filename=${file_model_instance.psudeo_file_name}`);
    res.setHeader('Content-type', 'application/octet-stream');
    downloadStream.pipe(res);
  } catch (error) {
    console.log(error);
    return res.send({ message: "Cannot process your request" });
  }
};

export const delete_file_by_id = async (req, res) => {
  try {
    const file_model_instance = await file_model.findById(req.body.id);
    const file_name = file_model_instance.psudeo_file_name;
    await gfs.delete(file_model_instance.file_ref_id);
    await file_model.findByIdAndDelete(req.body.id);
    return res.send({ message: `${file_name} deleted successfully!` });
  } catch (error) {
    return res.send({ message: "Internal Server Error" });
  }
};

export const rename_file_by_id = async (req, res) => {
  try {
    await file_model.findByIdAndUpdate(req.body.id, { psudeo_file_name: req.body.new_name }, { runValidators: true, new: true });
    return res.send({ message: "File name updated successfully" });
  } catch (error) {
    return res.send({ message: "Request Failed!" });
  }
};

export const move_file_by_id = async (req, res) => {
  try {
    await file_model.findByIdAndUpdate(req.body.id, { folder_id: req.body.new_folder_id }, { runValidators: true, new: true });
    return res.send({ message: "File moved to new folder successfully!" });
  } catch (error) {
    return res.send({ message: "Request Failed!" });
  }
};

export const copy_file_by_id = async (req, res) => {
  try {
    const original_file_model_instance = await file_model.findById(req.body.id);
    const new_folder_obj_id = new mongoose.Types.ObjectId(req.body.new_folder_id);

    if (original_file_model_instance.folder_id.equals(new_folder_obj_id)) {
      return res.send({ message: "Cannot copy file to the same folder!" });
    }

    const temp_file_path = join(process.cwd(), "temp_downloads", original_file_model_instance.psudeo_file_name);

    const new_download_stream = gfs.openDownloadStream(original_file_model_instance.file_ref_id)
    const new_write_stream = fs.createWriteStream(temp_file_path);
    new_download_stream.pipe(new_write_stream);

    new_write_stream.on("finish", async () => {
      const new_upload_stream = gfs.openUploadStream(generate_unique_filename(original_file_model_instance.psudeo_file_name));
      const new_read_stream = fs.createReadStream(temp_file_path);
      new_read_stream.pipe(new_upload_stream);

      new_upload_stream.on("finish", async () => {
        const new_file_model_entry = new file_model({
          user_id: original_file_model_instance.user_id,
          file_ref_id: new_upload_stream.id,
          folder_id: new_folder_obj_id,
          psudeo_file_name: original_file_model_instance.psudeo_file_name
        });

        await new_file_model_entry.save();

        fs.unlinkSync(temp_file_path);

        return res.send({ message: "File Copied Successfully!" });
      });
    });


  } catch (error) {
    return res.send({ message: "Internal server error" });
  }
};