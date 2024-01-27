import React, { Fragment, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

export const User_password_change_page = (props) => {
    const user_id = useSelector((state) => { return state.login.user_id });
    const [old_password, setOldPassword] = useState('');
    const [new_password, setNewPassword] = useState('');
    const navigate = useNavigate();
    if (!user_id) {
        return navigate("/", { replace: true });
    }

    const handleOldPasswordChange = (event) => {
        setOldPassword(event.target.value);
    };

    const handleNewPasswordChange = (event) => {
        setNewPassword(event.target.value);
    };

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const postConfig = {
            method: 'post',
            url: 'http://localhost:3500/change_password',
            data: { user_id: user_id, old_password: old_password, new_password: new_password }
        };
        const response = await axios(postConfig);
        alert(response.data.message);
    };

    return (
        <Fragment>
            <div className="bg-dark text-light p-3">
                <Link to="/user_home_page" className="btn btn-light text-dark">
                    Back to Home
                </Link>
            </div>
            <div className="bg-dark text-light min-vh-100 d-flex align-items-center justify-content-center">
                <form onSubmit={handleFormSubmit} className="p-4 bg-dark text-light rounded border border-light">
                    <label htmlFor="old_password" className="form-label text-light">
                        Old Password:
                    </label>
                    <input
                        type="password"
                        id="old_password"
                        value={old_password}
                        onChange={handleOldPasswordChange}
                        required
                        className="form-control mb-3 bg-dark text-light border-light"
                    />

                    <label htmlFor="new_password" className="form-label text-light">
                        New Password:
                    </label>
                    <input
                        type="password"
                        id="new_password"
                        value={new_password}
                        onChange={handleNewPasswordChange}
                        required
                        className="form-control mb-3 bg-dark text-light border-light"
                    />

                    <button type="submit" className="btn btn-primary">
                        Change Password
                    </button>
                </form>
            </div>
        </Fragment>
    );
};
