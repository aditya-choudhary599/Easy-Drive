import React, { Fragment } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Login_page } from "./pages/Login_page.js";
import { User_home_page } from "./pages/User_home_page.js";
import { User_signup_page } from "./pages/User_signup_page.js";
import { User_password_change_page } from "./pages/User_password_change_page.js";

export const App = () => {
    return (
        <Fragment>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Login_page />} />
                    <Route path="/user_home_page" element={<User_home_page />} />
                    <Route path="/user_signup" element={<User_signup_page />} />
                    <Route path="/change_password" element={<User_password_change_page />} />
                </Routes>
            </BrowserRouter>
        </Fragment>
    );
};