import { combineReducers, configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/AuthSlice.js';
import { apiSlice } from './slices/ApiSlice.js';
import adminReducer from './adminSlice/AdminAuthSlice.js'
// import checkTokenMiddleware from './middleware/checkTokenMIddleware'


const rootReducer = combineReducers({
  auth:authReducer,
  adminAuth:adminReducer,
  [apiSlice.reducerPath]: apiSlice.reducer,
});


// 1x9gcJ3so7ofcwEk
const store = configureStore({
    reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    devTools: true,
  });

export default store; 