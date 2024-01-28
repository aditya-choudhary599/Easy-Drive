import React, { Fragment, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useSelector } from "react-redux";
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

export const User_signup_page = (props) => {
    const [name, set_name] = useState('');
    const [email_id, set_email_id] = useState('');
    const [mobile_number, set_mobile_number] = useState('');
    const [password, set_password] = useState('');
    const user_id = useSelector((state) => { return state.login.user_id });
    const navigate=useNavigate();

    const handle_name_change = (event) => {
        set_name(event.target.value);
    };

    const handle_email_id_change = (event) => {
        set_email_id(event.target.value);
    };

    const handle_mobile_number_change = (event) => {
        set_mobile_number(event.target.value);
    };

    const handle_password_change = (event) => {
        set_password(event.target.value);
    };

    const handle_form_submit = async (event) => {
        event.preventDefault();
        const post_config = {
            method: 'post',
            url: 'http://localhost:3500/create_user',
            data: { name, email_id, mobile_number, password }
        };

        try {
            const response = await axios(post_config);
            alert(response.data.message);

            await axios.post('http://localhost:3500/create_folder', {
                user_id: response.data.user_id,
                folder_path: ["Root"]
            });
        } catch (error) {
            console.error("Error during signup:", error);
        }
    };

    if (user_id) {
        return navigate("/user_home_page", { replace: true });
    }

    return (
        <Fragment>
            <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center bg-dark text-light">
                <Link to="/" className="text-light mb-3">Go Back</Link>
                <form onSubmit={handle_form_submit} className="col-md-4 p-4 bg-dark border rounded">
                    <label htmlFor="name" className="form-label">Name:</label>
                    <input type="text" id="name" name="name" className="form-control mb-3" required value={name} onChange={handle_name_change} />

                    <label htmlFor="email_id" className="form-label">Email Id:</label>
                    <input type="email" id="email_id" name="email_id" className="form-control mb-3" required value={email_id} onChange={handle_email_id_change} />

                    <label htmlFor="mobile_number" className="form-label">Mobile Number:</label>
                    <input type="text" id="mobile_number" name="mobile_number" className="form-control mb-3" required value={mobile_number} onChange={handle_mobile_number_change} />

                    <label htmlFor="password" className="form-label">Password:</label>
                    <input type="password" id="password" name="password" className="form-control mb-3" required value={password} onChange={handle_password_change} />

                    <button type="submit" className="btn btn-primary">Signup</button>
                </form>
            </div>
        </Fragment>
    );
};
