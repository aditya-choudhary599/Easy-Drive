import React, { Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { do_logout } from "../redux_slices/login_slice";
import "../css/Navbar.css";
import homeButton from "../images/home-button.png";

export const Navbar = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const name = useSelector((state) => state.login.name); 

    const handleLogout = () => {
        dispatch(do_logout());
        navigate("/", { replace: true });
    };

    const handlePasswordChange = () => {
        navigate("/change_password");
    };

    return (
        <Fragment>
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
                <div className="container">
                    {/* Left side: Home icon and title */}
                    <img src={homeButton} alt="Home" className="home-button" />
                        Easy Drive

                    {/* Right side: User dropdown */}
                    <div className="navbar-text ml-auto">
                        <div className="dropdown">
                            <button className="btn btn-primary dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                {name}
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                                <li><button className="dropdown-item" onClick={handleLogout}>Logout</button></li>
                                <li><button className="dropdown-item" onClick={handlePasswordChange}>Change password</button></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </nav>
        </Fragment>
    );
};
