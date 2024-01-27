import { createSlice } from '@reduxjs/toolkit'

export const login_slice = createSlice({
    name: 'login',
    initialState: { user_id: '', name: '', email_id: '', mobile_number: '' },
    reducers: {
        do_login: (state, actions) => {
            const { user_id, name, email_id, mobile_number } = actions.payload;
            state.user_id = user_id;
            state.name = name;
            state.email_id = email_id;
            state.mobile_number = mobile_number;
        },
        do_logout: (state, actions) => {
            state.user_id = '';
            state.name = '';
            state.email_id = '';
            state.mobile_number = '';
        }
    }
});

export const { do_login,do_logout } = login_slice.actions;

export default login_slice.reducer;