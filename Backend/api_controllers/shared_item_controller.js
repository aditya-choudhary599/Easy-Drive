import Jimp from 'jimp';
import jsQR from 'jsqr';
import qrcode from "qrcode";
import { join } from "path";
import fs from "fs";
import { shared_item_model } from "../database_scripts/models/Shared_items_model.js";
import { file_model } from "../database_scripts/models/File_model.js";
import { folder_model } from "../database_scripts/models/Folder_model.js";

export const get_list_of_shared_items = async (req, res) => {
    const { user_id, type_of_item } = req.body;
    const all_shared_items = await shared_item_model.find({ source_user_id: user_id, type_of_entity: type_of_item });
    return res.send({ ans: all_shared_items.map((item) => { return item.entity_id.toString() }) });
};

export const get_shared_entry_id_from_entity_id = async (req, res) => {
    const { entity_id } = req.body;
    const ans = await shared_item_model.findOne({ entity_id: entity_id });
    return res.send({ shared_entry_id: ans._id });
};

export const create_a_shared_item_entry = async (req, res) => {
    const { source_user_id, type_of_entity, entity_id } = req.body;
    try {
        const new_shared_item_entry = new shared_item_model({ source_user_id: source_user_id, type_of_entity: type_of_entity, entity_id: entity_id });
        const saved_obj = await new_shared_item_entry.save();
        return res.send({ new_shared_entry_id: saved_obj._id });
    } catch (error) {
        return res.send({ message: "Request Failed" });
    }
};

export const delete_a_shared_item_entry = async (req, res) => {
    const { shared_item_id } = req.body;
    await shared_item_model.findByIdAndDelete(shared_item_id);
    return res.send({ message: "Deleted the shared entry!" });
};

export const create_a_qr_code = async (req, res) => {
    const { new_shared_entry_id } = req.body;
    const json_data_string = JSON.stringify({ new_shared_entry_id: new_shared_entry_id });
    const local_file_path = join(process.cwd(), "temp_downloads", "qr_code.png");
    qrcode.toFile(local_file_path, json_data_string, (error) => {
        if (!error) {
            const read_stream = fs.createReadStream(local_file_path);
            res.setHeader('Content-disposition', `attachment; filename=qr_code.png`);
            res.setHeader('Content-type', 'application/octet-stream');
            read_stream.pipe(res);
            read_stream.on("end", () => {
                fs.unlinkSync(local_file_path);
            });
        }
        else {
            console.log(error);
            return res.send("Operation Unsuccessfull");
        }
    });
};

export const decode_a_qr_code_and_get_data = async (req, res) => {
    const qr_file_name = req.file.originalname;
    const local_file_path = join(process.cwd(), "temp_uploads", qr_file_name);
    try {
        const image = await Jimp.read(local_file_path);
        const imageData = {
            data: new Uint8ClampedArray(image.bitmap.data),
            width: image.bitmap.width,
            height: image.bitmap.height,
        };
        fs.unlinkSync(local_file_path);

        const decodedQR = jsQR(imageData.data, imageData.width, imageData.height);
        const decoded_data = JSON.parse(decodedQR.data);

        const shared_item_obj = await shared_item_model.findById(decoded_data.new_shared_entry_id); 
        
        if (shared_item_obj.type_of_entity === 'File') {
            const helper = await file_model.findById(shared_item_obj.entity_id);
            return res.send({ ...shared_item_obj, entity_name: helper.psudeo_file_name });
        }
        else {
            const helper = await folder_model.findById(shared_item_obj.entity_id);
            const folder_path_arr = helper.folder_path.split('/');
            return res.send({ ...shared_item_obj, entity_name: folder_path_arr[folder_path_arr.length - 1] });
        }
    } catch (error) {
        return res.send({ message: "Failed" });
    }
};