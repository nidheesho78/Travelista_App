

import { Navigate, Outlet,useNavigate } from "react-router-dom";
import { useSelector,useDispatch } from "react-redux";
import { useState,useEffect } from 'react';
import {useAdminLogoutMutation  } from '../adminSlice/AdminApiSlice.js';
import {adminLogout } from '../adminSlice/AdminAuthSlice.js';
import React from 'react'
import { BASE_URL } from "../config.js";

function AdminPrivateRoute() {
  const { adminInfo } = useSelector((state) => state.adminAuth);
  const dispatch = useDispatch();
  const [logoutApi] = useAdminLogoutMutation();
  const navigate =useNavigate()




  useEffect(() => {
    const adminCheckAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/admin/adminCheckAuth`, {
                credentials: 'include' // Include cookies in the request
            });
            if (!response.ok) {
                await logoutApi().unwrap();
                dispatch(adminLogout());
                navigate('/admin/login');
            }
        } catch (error) {
            console.error('Check auth error:', error);
        }
    };

    if (adminInfo) {
        adminCheckAuth();
    }
}, [adminInfo, dispatch, logoutApi, navigate]);





return adminInfo ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

export default AdminPrivateRoute