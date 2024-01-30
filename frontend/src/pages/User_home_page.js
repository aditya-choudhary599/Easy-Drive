import React, { Fragment, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios"
import options_icon from "../images/options_icon.png"
import new_logo from "../images/new_logo.png";
import { do_logout } from "../redux_slices/login_slice.js";
import "../css/user_home_page_style.css";

export const User_home_page = () => {
    const user_id = useSelector((state) => state.login.user_id);
    const dispatch = useDispatch();

    const [user_name, set_user_name] = useState('');
    const [disk_usage, set_disk_usage] = useState(null);

    const [folder_id, set_folder_id] = useState('');
    const [parent_folder_id, set_parent_folder_id] = useState('');
    const [current_folder_name, set_current_folder_name] = useState('');

    const [all_files, set_all_files] = useState([]);
    const [all_folders, set_all_folders] = useState([]);

    const [all_shared_files, set_all_shared_files] = useState([]);
    const [all_shared_folders, set_all_shared_folders] = useState([]);

    const [re_render, set_re_render] = useState(1);

    const navigate = useNavigate();

    useEffect(() => {
        const get_initial_config = async () => {
            const config_result = await axios.post('http://localhost:3500/get_folder_id_of_root', { user_id: user_id });
            set_parent_folder_id(config_result.data.root_folder_id);
            set_folder_id(config_result.data.root_folder_id);

            const result = await axios.post('http://localhost:3500/get_user_name_from_user_id', { user_id: user_id });
            set_user_name(result.data.user_name);

            const disk_usage_response = await axios.post('http://localhost:3500/get_disk_usage_of_user', { user_id: user_id });
            set_disk_usage(disk_usage_response.data.total_disk_usage);
        };

        if (!user_id) {
            return navigate("/", { replace: true });
        }

        const sidebar = document.querySelector('nav');
        const toggle = document.querySelector(".toggle");

        toggle.addEventListener("click", () => {
            sidebar.classList.toggle("close");
        });

        get_initial_config();
    }, []);

    useEffect(() => {
        const get_files_and_folder = async () => {
            const files_response = await axios.post(
                "http://localhost:3500/get_files_of_a_folder",
                { user_id: user_id, folder_id: folder_id }
            );
            const folders_response = await axios.post(
                "http://localhost:3500/get_immediate_folders_of_a_folder",
                { user_id: user_id, folder_id: folder_id }
            );
            set_all_files(files_response.data.all_files);
            set_all_folders(folders_response.data.all_folders);

            const shared_files_response = await axios.post('http://localhost:3500/get_list_of_shared_items', { user_id: user_id, type_of_item: 'File' });
            const shared_folders_response = await axios.post('http://localhost:3500/get_list_of_shared_items', { user_id: user_id, type_of_item: 'Folder' });
            set_all_shared_files(shared_files_response.data.ans);
            set_all_shared_folders(shared_folders_response.data.ans);

            const disk_usage_response = await axios.post('http://localhost:3500/get_disk_usage_of_user', { user_id: user_id });
            set_disk_usage(disk_usage_response.data.total_disk_usage);

            const response_2 = await axios.post('http://localhost:3500/get_folder_path_from_folder_id', { folder_id: folder_id });
            set_current_folder_name(response_2.data.folder_path)
        };

        get_files_and_folder();
    }, [folder_id, re_render]);

    const handle_logut = (event) => {
        dispatch(do_logout());
        navigate('/', { replace: true });
    };

    const handle_password_change = (event) => {
        navigate('/change_password');
    }

    const handle_back_button = async (event) => {
        const grandparent_folder_id_response = await axios.post('http://localhost:3500/get_parent_folder_id', { user_id: user_id, child_folder_id: parent_folder_id });
        const helper = parent_folder_id;
        set_parent_folder_id(grandparent_folder_id_response.data.parent_folder_id);
        set_folder_id(helper);
    };

    const handle_file_download = async (event) => {
        const [file_id, file_name] = event.target.id.split('+');
        const response = await axios.post(
            'http://localhost:3500/download_file_by_id',
            { id: file_id },
            { responseType: 'blob' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(response.data);
        link.download = file_name;
        link.click();
    };

    const handle_file_upload = async (event) => {
        const newWindow = window.open('', '_blank', 'width=400,height=400');

        const new_upload_form = document.createElement('form');
        new_upload_form.method = 'post';
        new_upload_form.enctype = 'multipart/form-data';

        const user_id_field = document.createElement('input');
        user_id_field.type = 'hidden';
        user_id_field.name = 'user_id';
        user_id_field.id = 'user_id';
        user_id_field.value = user_id;

        const folder_id_field = document.createElement('input');
        folder_id_field.type = 'hidden';
        folder_id_field.name = 'folder_id';
        folder_id_field.id = 'folder_id';
        folder_id_field.value = folder_id;

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.name = 'files';
        fileInput.multiple = true;

        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = 'Upload';

        new_upload_form.appendChild(user_id_field);
        new_upload_form.appendChild(folder_id_field);
        new_upload_form.appendChild(fileInput);
        new_upload_form.appendChild(submitButton);

        new_upload_form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(new_upload_form);
            try {
                const response = await axios.post('http://localhost:3500/upload_files', formData);
                alert(response.data.message);
                newWindow.close();
            } catch (error) {
                alert('Axios error:', error);
            }
            set_re_render(re_render + 1);
        });

        newWindow.document.body.appendChild(new_upload_form);
    };

    const handle_file_delete = async (event) => {
        const file_id = event.target.id;
        const response = await axios.post('http://localhost:3500/delete_file_by_id', { id: file_id });
        alert(response.data.message);

        if (all_shared_files.includes(file_id)) {
            const response_1 = await axios.post('http://localhost:3500/get_shared_entry_id_from_entity_id', { entity_id: file_id });
            const response_2 = await axios.post('http://localhost:3500/delete_a_shared_item_entry', { shared_item_id: response_1.data.shared_entry_id });
        }

        set_re_render(re_render + 1);
    };

    const handle_file_rename = async (event) => {
        const [file_id, file_name] = event.target.id.split('+');

        const newWindow = window.open('', '_blank', 'width=250,height=250');

        const new_rename_form = document.createElement("form");
        new_rename_form.method = "post";
        new_rename_form.enctype = 'multipart/form-data';

        const file_id_field = document.createElement("input");
        file_id_field.type = "hidden";
        file_id_field.name = "id";
        file_id_field.value = file_id;

        const new_name_field = document.createElement("input");
        new_name_field.type = "text";
        new_name_field.name = "new_name";
        new_name_field.value = file_name;

        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = 'Update';

        new_rename_form.appendChild(file_id_field);
        new_rename_form.appendChild(new_name_field);
        new_rename_form.appendChild(submitButton);

        new_rename_form.addEventListener("submit", async (e) => {
            e.preventDefault();
            try {
                const response = await axios.post('http://localhost:3500/rename_file_by_id', { id: file_id_field.value, new_name: new_name_field.value });
                alert(response.data.message);
                newWindow.close();
                set_re_render(re_render + 1);
            } catch (error) {
                alert("Error occurred while renaming file.");
            }
        });

        newWindow.document.body.appendChild(new_rename_form);
    };

    const handle_file_move_and_copy = async (event) => {
        const [file_id, action_name] = event.target.id.split('+');

        const response_1 = await axios.post('http://localhost:3500/get_list_of_folder_to_copy_or_move', { user_id: user_id, folder_id: folder_id });
        const list_of_folders = response_1.data.ans;

        const newWindow = window.open('', '_blank', 'width=400,height=400');

        const copy_or_move_form = document.createElement("form");
        copy_or_move_form.method = "post";
        copy_or_move_form.enctype = 'multipart/form-data';

        const new_folder_id_field = document.createElement("select");
        new_folder_id_field.name = "new_folder_id";
        new_folder_id_field.id = "new_folder_id";

        for (const record of list_of_folders) {
            const { folder_id, folder_path } = record;
            const option = document.createElement("option");
            option.value = folder_id;
            option.text = folder_path;
            new_folder_id_field.appendChild(option);
        }

        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = action_name;

        copy_or_move_form.appendChild(new_folder_id_field);
        copy_or_move_form.appendChild(submitButton);

        copy_or_move_form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const response_2 = action_name === 'Copy' ? await axios.post('http://localhost:3500/copy_file_by_id', { id: file_id, new_folder_id: new_folder_id_field.value }) : await axios.post('http://localhost:3500/move_file_by_id', { id: file_id, new_folder_id: new_folder_id_field.value });
            alert(response_2.data.message);
            newWindow.close();
            set_re_render(re_render + 1);
        });

        newWindow.document.body.appendChild(copy_or_move_form);
    };

    const handle_folder_change = async (event) => {
        const parent_folder_id_response = await axios.post('http://localhost:3500/get_parent_folder_id', { user_id: user_id, child_folder_id: event.target.id });
        set_parent_folder_id(parent_folder_id_response.data.parent_folder_id);
        set_folder_id(event.target.id);
    };

    const handle_folder_create = async (event) => {
        const response_1 = await axios.post('http://localhost:3500/get_folder_path_from_folder_id', { folder_id: folder_id });
        const curr_folder_path = response_1.data.folder_path.split('/');

        const newWindow = window.open('', '_blank', 'width=400,height=400');

        const create_new_folder_form = document.createElement("form");
        create_new_folder_form.method = "post";
        create_new_folder_form.enctype = 'multipart/form-data';

        const new_folder_name = document.createElement("input");
        new_folder_name.type = "text";
        new_folder_name.required = true;

        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = 'Submit';

        create_new_folder_form.appendChild(new_folder_name);
        create_new_folder_form.appendChild(submitButton);

        create_new_folder_form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const temp = curr_folder_path;
            temp.push(new_folder_name.value);

            const response_2 = await axios.post('http://localhost:3500/create_folder', { user_id: user_id, folder_path: curr_folder_path });
            alert(response_2.data.message);

            newWindow.close();
            set_re_render(re_render + 1);
        });

        newWindow.document.body.appendChild(create_new_folder_form);
    };

    const handle_folder_download = async (event) => {
        const [folder_to_download_id, folder_to_download_name] = event.target.id.split('+');
        const response = await axios.post('http://localhost:3500/download_a_folder_by_id', { user_id: user_id, folder_id: folder_to_download_id }, { responseType: 'blob' });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(response.data);
        link.download = folder_to_download_name + '.zip';
        link.click();
    };

    const handle_folder_rename = async (event) => {
        const folder_to_rename_id = event.target.id;
        const response_1 = await axios.post('http://localhost:3500/get_folder_path_from_folder_id', { folder_id: folder_to_rename_id });
        const temp_path = response_1.data.folder_path.split('/');
        const curr_folder_name = temp_path.pop();

        const newWindow = window.open('', '_blank', 'width=400,height=400');

        const rename_folder_form = document.createElement("form");
        rename_folder_form.method = "post";
        rename_folder_form.enctype = 'multipart/form-data';

        const new_folder_name_field = document.createElement("input");
        new_folder_name_field.type = "text";
        new_folder_name_field.value = curr_folder_name;
        new_folder_name_field.required = true;

        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = 'Update';

        rename_folder_form.appendChild(new_folder_name_field);
        rename_folder_form.appendChild(submitButton);

        rename_folder_form.addEventListener("submit", async (e) => {
            e.preventDefault();
            temp_path.push(new_folder_name_field.value);
            const response_2 = await axios.post('http://localhost:3500/update_folder_name_by_id', { user_id: user_id, folder_id: folder_to_rename_id, new_folder_path: temp_path });
            alert(response_2.data.message);
            newWindow.close();
            set_re_render(re_render + 1);
        });

        newWindow.document.body.appendChild(rename_folder_form);
    };

    const handle_folder_delete = async (event) => {
        const id_of_folder_to_delete = event.target.id;
        const response = await axios.post('http://localhost:3500/delete_a_folder_by_id', { user_id: user_id, folder_id: id_of_folder_to_delete });
        alert(response.data.message);

        if (all_shared_folders.includes(id_of_folder_to_delete)) {
            const response_1 = await axios.post('http://localhost:3500/get_shared_entry_id_from_entity_id', { entity_id: id_of_folder_to_delete });
            const response_2 = await axios.post('http://localhost:3500/delete_a_shared_item_entry', { shared_item_id: response_1.data.shared_entry_id });
            alert(response_2.data.message);
            set_re_render(re_render + 1);
        }

        set_re_render(re_render + 1);
    };

    const handle_folder_move_and_copy = async (event) => {
        const [folder_to_move_or_copy_id, action_name] = event.target.id.split('+');
        console.log(folder_to_move_or_copy_id, action_name);
        const response_1 = await axios.post('http://localhost:3500/get_list_of_folder_to_copy_or_move_2', { user_id: user_id, curr_folder_id: folder_id, folder_to_copy_or_move_id: folder_to_move_or_copy_id });
        const avaliable_choices = response_1.data.ans;

        console.log(avaliable_choices);

        const newWindow = window.open('', '_blank', 'width=400,height=400');

        const move_or_copy_form = document.createElement("form");
        move_or_copy_form.method = "post";
        move_or_copy_form.enctype = 'multipart/form-data';

        const select_field = document.createElement("select");

        for (const doc of avaliable_choices) {
            const option_folder_id = doc.folder_id;
            const option_folder_path = doc.folder_path;

            const option = document.createElement("option");
            option.value = option_folder_id;
            option.text = option_folder_path;
            select_field.appendChild(option);
        }

        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = action_name;

        move_or_copy_form.appendChild(select_field);
        move_or_copy_form.appendChild(submitButton);

        move_or_copy_form.addEventListener("submit", async (e) => {
            e.preventDefault();
            const response_2 = action_name === 'Copy'
                ? await axios.post('http://localhost:3500/copy_a_folder_by_id', { user_id: user_id, curr_folder_id: folder_to_move_or_copy_id, curr_folder_parent_id: folder_id, new_folder_id: select_field.value })
                : await axios.post('http://localhost:3500/move_a_folder_by_id', { user_id: user_id, curr_folder_id: folder_to_move_or_copy_id, curr_folder_parent_id: folder_id, new_folder_id: select_field.value });
            newWindow.close();
            alert(response_2.data.message);
            set_re_render(re_render + 1);
        });

        newWindow.document.body.appendChild(move_or_copy_form);
    };

    const handle_item_share = async (event) => {
        const [item_id, type_of_item] = event.target.id.split('+');
        const response_1 = await axios.post('http://localhost:3500/create_a_shared_item_entry', { source_user_id: user_id, type_of_entity: type_of_item, entity_id: item_id });
        if (!response_1.data.message) {
            const response_2 = await axios.post('http://localhost:3500/create_a_qr_code', response_1.data, { responseType: 'blob' });
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(response_2.data);
            link.download = 'qr_code.png';
            link.click();
            set_re_render(re_render + 1);
        }
        else {
            alert(response_1.data.message);
        }
    };

    const handle_shared_item_download = async (event) => {
        const newWindow = window.open('', '_blank', 'width=400,height=400');

        const new_upload_form = document.createElement('form');
        new_upload_form.method = 'post';
        new_upload_form.enctype = 'multipart/form-data';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.name = 'file';
        fileInput.multiple = false;

        const submitButton = document.createElement('input');
        submitButton.type = 'submit';
        submitButton.value = 'Upload';

        new_upload_form.appendChild(fileInput);
        new_upload_form.appendChild(submitButton);

        new_upload_form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const form_data = new FormData(new_upload_form);

            const response_1 = await axios.post('http://localhost:3500/decode_a_qr_code_and_get_data', form_data);
            if (response_1.data.message) {
                newWindow.close();
                alert(response_1.data.message);
            }
            else {
                const { source_user_id, type_of_entity, entity_id } = response_1.data._doc;
                const { entity_name } = response_1.data;
                if (type_of_entity === 'File') {
                    const download_response = await axios.post(
                        'http://localhost:3500/download_file_by_id',
                        { id: entity_id },
                        { responseType: 'blob' });
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(download_response.data);
                    link.download = entity_name;
                    link.click();
                }
                else {
                    const download_response = await axios.post('http://localhost:3500/download_a_folder_by_id', { user_id: source_user_id, folder_id: entity_id }, { responseType: 'blob' });
                    const link = document.createElement('a');
                    link.href = window.URL.createObjectURL(download_response.data);
                    link.download = entity_name + '.zip';
                    link.click();
                }
                newWindow.close();
            }
        });

        newWindow.document.body.appendChild(new_upload_form);
    };

    const handle_item_delete_share = async (event) => {
        const entity_id = event.target.id;
        const response_1 = await axios.post('http://localhost:3500/get_shared_entry_id_from_entity_id', { entity_id: entity_id });
        const response_2 = await axios.post('http://localhost:3500/delete_a_shared_item_entry', { shared_item_id: response_1.data.shared_entry_id });
        alert(response_2.data.message);
        set_re_render(re_render + 1);
    };

    return (
        <Fragment>
            <nav className="sidebar close">
                <header>
                    <div className="image-text">
                        <span className="image">
                            <img src={new_logo} alt="" />
                        </span>

                        <div className="text logo-text">
                            <span className="name">{user_name}</span>
                            <span className="profession">Space used = {disk_usage}</span>
                        </div>
                    </div>

                    <i className='bx bx-chevron-right toggle'></i>
                </header>

                <div className="menu-bar">
                    <div className="menu">
                        <ul className="menu-links">
                            <li className="nav-link">
                                <a href="#" onClick={handle_password_change}>
                                    <i className='bx bxs-user-circle icon'></i>
                                    <span className="text nav-text">Change Password</span>
                                </a>
                            </li>

                            {parent_folder_id !== folder_id
                                ? <li className="nav-link">
                                    <a href="#" onClick={handle_back_button}>
                                        <i className='bx bx-arrow-back icon'></i>
                                        <span className="text nav-text">Back</span>
                                    </a>
                                </li>
                                : <></>}

                            <li className="nav-link">
                                <a href="#" onClick={handle_folder_create}>
                                    <i className='bx bx-folder-plus icon'></i>
                                    <span className="text nav-text">Create a folder</span>
                                </a>
                            </li>

                            <li className="nav-link">
                                <a href="#" onClick={handle_file_upload}>
                                    <i className='bx bx-upload icon'></i>
                                    <span className="text nav-text">Upload files</span>
                                </a>
                            </li>

                            <li className="nav-link">
                                <a href="#" onClick={handle_shared_item_download}>
                                    <i class='bx bx-qr icon'></i>
                                    <span className="text nav-text">Download shared item</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div className="bottom-content">
                        <li className="" onClick={handle_logut}>
                            <a href="#">
                                <i className='bx bx-log-out icon'></i>
                                <span className="text nav-text">Logout</span>
                            </a>
                        </li>
                    </div>
                </div>
            </nav>

            <section className="home">
                <div className="text">PWD={current_folder_name}</div>
                <div className="card bg-dark text-light">
                    <h2 className="card-header">Files:</h2>
                    <div className="card-body">
                        <table className="table table-dark table-bordered table-striped text-light">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Size</th>
                                    <th>Uploaded On</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {all_files.map((file) => (
                                    <tr key={file.file_id}>
                                        <td>
                                            {all_shared_files.includes(file.file_id) ? (
                                                <span>
                                                    <i className='bx bx-transfer icon' style={{ color: '#ffff00' }}></i>
                                                    {file.file_name}
                                                </span>
                                            ) : (
                                                file.file_name
                                            )}
                                        </td>
                                        <td>{file.file_size}</td>
                                        <td>{file.file_upload_on}</td>
                                        <td>
                                            <div className="dropdown">
                                                <a className="btn btn-info dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <img src={options_icon} />
                                                </a>

                                                <ul className="dropdown-menu">
                                                    <li><a className="dropdown-item" onClick={handle_file_download} id={`${file.file_id}+${file.file_name}`}>Download</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_file_delete} id={file.file_id}>Delete</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_file_rename} id={`${file.file_id}+${file.file_name}`}>Rename</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_file_move_and_copy} id={`${file.file_id}+Copy`}>Copy</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_file_move_and_copy} id={`${file.file_id}+Move`}>Move</a></li>

                                                    {!all_shared_files.includes(file.file_id)
                                                        ? <li><a className="dropdown-item" onClick={handle_item_share} id={`${file.file_id}+File`}>Share</a></li>
                                                        : <li><a className="dropdown-item" onClick={handle_item_delete_share} id={file.file_id}>Delete Shared Entry</a></li>
                                                    }

                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="card bg-dark text-light mt-3">
                    <h2 className="card-header">Folders:</h2>
                    <div className="card-body">
                        <table className="table table-dark table-bordered table-striped text-light">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Created On</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {all_folders.map((folder) => (
                                    <tr key={folder.folder_id}>
                                        {all_shared_folders.includes(folder.folder_id) ? (
                                            <td onClick={handle_folder_change} id={folder.folder_id}>
                                                <i className='bx bx-transfer icon' style={{ color: '#ffff00' }}></i>
                                                {folder.folder_name}
                                            </td>
                                        ) : (
                                            <td onClick={handle_folder_change} id={folder.folder_id}>
                                                {folder.folder_name}
                                            </td>
                                        )}
                                        <td>{folder.folder_created_on}</td>
                                        <td>
                                            <div className="dropdown">
                                                <a className="btn btn-info dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                                                    <img src={options_icon} />
                                                </a>

                                                <ul className="dropdown-menu">
                                                    <li><a className="dropdown-item" onClick={handle_folder_download} id={`${folder.folder_id}+${folder.folder_name}`}>Download</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_folder_rename} id={folder.folder_id}>Rename</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_folder_delete} id={folder.folder_id}>Delete</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_folder_move_and_copy} id={`${folder.folder_id}+Copy`}>Copy</a></li>

                                                    <li><a className="dropdown-item" onClick={handle_folder_move_and_copy} id={`${folder.folder_id}+Move`}>Move</a></li>

                                                    {!all_shared_folders.includes(folder.folder_id)
                                                        ? <li><a className="dropdown-item" onClick={handle_item_share} id={`${folder.folder_id}+Folder`}>Share</a></li>
                                                        : <li><a className="dropdown-item" onClick={handle_item_delete_share} id={folder.folder_id}>Delete Share Entry</a></li>
                                                    }
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </Fragment>
    );
};
