

import React, { useState, useEffect } from 'react';
import { useLocation,useNavigate } from 'react-router-dom';
import Loader from '../Components/Loader';
import { Image } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faSave, faHeart, faComment } from '@fortawesome/free-solid-svg-icons';
import { FaEye, FaTrash, FaEdit } from 'react-icons/fa';
import axios from 'axios'; 
import { useSelector,useDispatch } from "react-redux";
import {useAdminLogoutMutation  } from '../adminSlice/AdminApiSlice.js';
import {adminLogout } from '../adminSlice/AdminAuthSlice.js';
import '../css/adminUserPRO.css';
import { toast } from 'react-toastify';
import { BASE_URL } from '../config.js';



const AdminUserPRview = () => {
  const [userDetails, setUserDetails] = useState(null);
  const [userBlogs, setUserBlogs] = useState([]);
  const location = useLocation();
  const navigate = useNavigate(); 
  const { adminInfo } = useSelector((state) => state.adminAuth);
  const dispatch = useDispatch();
  const [logoutApi] = useAdminLogoutMutation();

  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);






 
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
            // console.error('Check auth error:', error);
            toast.error("Check auth error");
        }
    };

    if (adminInfo) {
        adminCheckAuth();
    }
}, [adminInfo, dispatch, logoutApi, navigate]);





//passing admin jwt
  useEffect(() => {
    const userEmail = new URLSearchParams(location.search).get('email');
  
    // Fetch user's details
    axios.get(`${BASE_URL}/api/admin/userProfile?email=${userEmail}`, {
      withCredentials: true, // Send credentials with the request
    })
    .then((response) => {
      const userData = response.data;
      setUserDetails(userData);
  
      // Fetch user's blogs using the same email
      axios.get(`${BASE_URL}/api/admin/allBlogs?email=${userEmail}`, {
        withCredentials: true, // Send credentials with the request
      })
      .then((response) => {
        setUserBlogs(response.data);
      })
      .catch((error) => {
        toast.error('Error fetching blogs');
      });
    })
    .catch((error) => {
      toast.error('Error fetching user details');
    });
  }, [location.search]);



  function getFileExtension(filename) {
    return filename.split('.').pop();
  }



  return (
    <div className="profile-container">
      {userDetails ? (
        <>
          <div className="profile-picture">
            <div className="profile-image-container">
              {userDetails.profileImage ? (
                <Image
                  src={`${BASE_URL}/api/users/uploads/${userDetails.profileImage}`}
                  alt="Profile"
                  className="profile-image"
                  roundedCircle
                />
              ) : (
                <div className="profile-initials">
                  {userDetails.name ? userDetails.name.charAt(0).toUpperCase() : ''}
                </div>
              )}
            </div>
          </div>
          <h3 className="profile-name" style={{ fontFamily: "Squada One", color: "white", fontSize: "1.4rem" }}>{userDetails.name}</h3>
          <h5 style={{ color: "gray", fontSize: "0.6rem" }}>travel blogger</h5>

          <div className="profile-buttons">
            <div className="count-above-btn">
              <div className="profile-count">{userDetails.followersCount}</div>
              <button className="follofollowingbtn">Followers</button>
            </div>
            <div className="count-above-btn">
              <div className="profile-count">{userDetails.followingCount}</div>
              <button className="follofollowingbtn">Following</button>
            </div>
          </div>

          {/* <div className='showcase'>
            <div className='icon'>
              <FontAwesomeIcon icon={faPen} size='lg' className='pro' />
              <span className='icon-text'>Pen</span>
            </div>
            <div className='icon'>
              <FontAwesomeIcon icon={faSave} size='lg' className='pro' />
              <span className='icon-text'>Save</span>
            </div>
            <div className='icon'>
              <FontAwesomeIcon icon={faHeart} size='lg' className='pro' />
              <span className='icon-text'>Like</span>
            </div>
            <div className='icon'>
              <FontAwesomeIcon icon={faComment} size='lg' className='pro' />
              <span className='icon-text'>Chat</span>
            </div>
          </div> */}
          <div className='proLine'></div>

          <h4 className='allpostText'>Your Tales</h4>
          <div className='allPost'>
            {userBlogs.map((blog) => (
              <div className='eachPost' key={blog._id}>
                <div className='postImage'  style={{backgroundColor:"#181a1b"}}>
                  {/* Display blog image here */}
                  {blog.images.length > 0 && (
                    // <Image
                    //   src={`${BASE_URL}/api/users/${blog.images[0]}`}
                    //   alt='Blog'
                    //   className='postImageOndiv'
                    // />


                    getFileExtension(blog.images[0]) === 'mp4' ? (
                      <video
                        src={`${BASE_URL}/api/users/${blog.images[0]}`}
                        controls
                        className='postVideoOndiv'
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <Image
                        src={`${BASE_URL}/api/users/${blog.images[0]}`}
                        alt='Blog'
                        className='postImageOndiv'
                      />
                    )


                  )}
                </div>
                <div className='postContent'>
                  {/* Display blog title, summary, and creation date */}
                  <h3>{blog.title}</h3>
                  <p className='summaryPosted summaryExpand'>{blog.summary}</p>
                  <p className='datePosted'>Created on: {new Date(blog.createdAt).toLocaleDateString()}</p>
                  <div className='iconInPostContentGroup'>
                    <button className='iconInPostContent' onClick={() => navigate(`/admin/viewBlogAdmin/${blog._id}`)}><FaEye /></button>
                    <button className='iconInPostContent'><FaTrash /></button>
                    {/* <button className='iconInPostContent'><FaEdit /></button> */}
                  </div>
                </div>
              </div>
            ))}

            <div className='proLine'></div>
          </div>
          <div className='proLine'></div>
        </>
      ) : (
        <Loader /> // Show a loader or some placeholder while userDetails are being fetched
      )}
    </div>
  );
};

export default AdminUserPRview;
