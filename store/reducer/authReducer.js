import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    auth: null,
    // false until the auth state has been resolved from the server at least once.
    // Lets the UI distinguish "still checking" from "confirmed logged out" and
    // avoid flashing a logged-out nav before hydration completes.
    hydrated: false,
}

export const authReducer = createSlice({
    name: 'authStore',
    initialState,
    reducers: {
        login: (state, action) => {
            state.auth = action.payload
            state.hydrated = true
        },
        logout: (state, action) => {
            state.auth = null
            state.hydrated = true
        },
    }
})

export const { login, logout } = authReducer.actions
export default authReducer.reducer
