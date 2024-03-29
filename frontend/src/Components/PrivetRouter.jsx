


// PrivateRoute.jsx
import { useState,useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useLogoutMutation } from '../slices/UserApiSlice.js';
import { logout } from '../slices/AuthSlice.js';
import { BASE_URL } from '../config.js';

const PrivateRoute = () => {
  const { userInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [logoutApiCall] = useLogoutMutation();
  const navigate =useNavigate()

  useEffect(() => {
    // Fetch user status from the backend
    const fetchUserStatus = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/users/status/${userInfo._id}`);
        const data = await response.json();

        if (data.status) {
          // If user status is true, perform logout and navigate to /landing
          await logoutApiCall().unwrap();
          dispatch(logout());
          navigate('/landing');
        }
      } catch (error) {
        console.error('Fetch user status error:', error);
      }
    };

    if (userInfo) {
      fetchUserStatus();
    }
  }, [userInfo, dispatch, logoutApiCall, navigate]);


  useEffect(() => {
    const checkAuth = async () => {
        try {
            const response = await fetch(`${BASE_URL}/api/users/checkAuth`, {
                credentials: 'include' // Include cookies in the request
            });
            if (!response.ok) {
                await logoutApiCall().unwrap();
                dispatch(logout());
                navigate('/landing');
            }
        } catch (error) {
            console.error('Check auth error:', error);
        }
    };

    if (userInfo) {
        checkAuth();
    }
}, [userInfo, dispatch, logoutApiCall, navigate]);




  return userInfo ? <Outlet /> : <Navigate to="/landing" replace />;
};

export default PrivateRoute;
