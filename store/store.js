import { combineReducers, configureStore } from "@reduxjs/toolkit";
import persistReducer from "redux-persist/es/persistReducer";
import persistStore from "redux-persist/es/persistStore";
import createWebStorage from "redux-persist/lib/storage/createWebStorage";

import authReducer from "./reducer/authReducer";
import cartReducer from "./reducer/cartReducer";

// redux-persist's default storage logs "failed to create sync storage, falling
// back to noop storage" whenever it's evaluated on the server — Next.js executes
// this module during SSR, where there is no window/localStorage. Resolve storage
// explicitly per environment: real localStorage in the browser, a silent noop on
// the server. This keeps client-side persistence working and removes the warning.
const createNoopStorage = () => ({
  getItem() {
    return Promise.resolve(null);
  },
  setItem(_key, value) {
    return Promise.resolve(value);
  },
  removeItem() {
    return Promise.resolve();
  },
});

const storage =
  typeof window !== "undefined"
    ? createWebStorage("local")
    : createNoopStorage();

const rootReducer = combineReducers({
  authStore: authReducer,
  cartStore: cartReducer,
});

const persistConfig = {
  key: "root",
  storage,

  // Persist only cart, NOT auth
  whitelist: ["cartStore"],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
