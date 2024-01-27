import { configureStore } from '@reduxjs/toolkit'
import login_reducer from './redux_slices/login_slice.js';

export const store = configureStore({
    reducer: {
        login: login_reducer
    }
});