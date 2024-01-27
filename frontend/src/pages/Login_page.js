import React, { Fragment, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { do_login } from "../redux_slices/login_slice.js";

export const Login_page = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [email_id, set_email_id] = useState('');
    const [password, set_password] = useState('');
    const user_id = useSelector((state) => { return state.login.user_id });
    
    const handle_email_id = (event) => {
        set_email_id(event.target.value);
    }

    const handle_password = (event) => {
        set_password(event.target.value);
    }

    const handle_signup_button = (event) => {
        navigate("/user_signup")
    }

    const handle_form_submit = async (event) => {
        event.preventDefault();
        try {
            const response = await axios.post('http://localhost:3500/verify_user', {
                email_id: email_id,
                password: password
            });

            if (response.data.message === 'Authenticated succesfully') {
                dispatch(do_login(response.data));
                navigate("/user_home_page", { replace: true });

            } else {
                alert(response.data.message);
            }
        } catch (error) {
            console.error("Error during login:", error);
        }
    }

    if (user_id) {
        return navigate("/user_home_page", { replace: true });
    }

    return (
        <Fragment>
            <div className="container-fluid vh-100 d-flex flex-column align-items-center justify-content-center bg-dark text-light">
                <header className="text-center mb-4">
                    <h1 className="display-4">Welcome to Easy Drive</h1>
                    <p className="lead">Your Easy and Secure Way to Drive</p>
                </header>
                <form onSubmit={handle_form_submit} className="col-md-4 p-4 bg-dark border rounded">
                    <h2 className="text-center mb-4">Login</h2>
                    <div className="mb-3">
                        <label htmlFor="email_id" className="form-label">Email:</label>
                        <input type='email' className="form-control" name="email_id" id="email_id" required value={email_id} onChange={handle_email_id} />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password:</label>
                        <input type='password' className="form-control" name="password" id="password" required value={password} onChange={handle_password} />
                    </div>

                    <div className="row justify-content-evenly">
                        <div className="col-4">
                            <button type="submit" className="btn btn-primary btn-block">Login</button>
                        </div>
                        <div className="col-4">
                            <button className="btn btn-warning btn-block" onClick={handle_signup_button}>Signup</button>
                        </div>
                    </div>
                </form>
            </div>
        </Fragment>
    );
};

