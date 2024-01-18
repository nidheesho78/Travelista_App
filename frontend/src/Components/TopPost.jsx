

import React, { useState, useEffect } from 'react';
import '../css/topPost.css';
import axios from 'axios';
import { Image } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { BASE_URL } from '../config.js';

const TopPost = () => {
  const [topBlogs, setTopBlogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userInfo } = useSelector((state) => state.auth);
  
  useEffect(() => {
    const fetchTopBlogs = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/blogs/topThreepost`);
        setTopBlogs(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error(error);
        setIsLoading(false);
      }
    };

    fetchTopBlogs();
  }, []);





  return (
    <div className='topPost'>
   
   {topBlogs.map((blog) => (
        <div className='topPostCard' key={blog._id}>
   <div className="overlay"></div>
   <div className="blogSummary">{blog.summary}</div>
   
   <Image
      src={`${BASE_URL}/api/blogs/${blog.images[0]}`}
      fluid
      className="img-fluid"
      alt="Blog Image"
      onLoad={() => setIsLoading(false)} // Set loading to false when image is loaded
   />

   {userInfo ? (
      <Link to={`/allBlogs/${blog._id}`} className="navLink">
         <div className="blogTitle">{blog.title}</div>
      </Link>
   ) : (
      <Link to={`/onlyView/${blog._id}`} className="navLink">
         <div className="blogTitle">{blog.title}</div>
      </Link>
   )}
</div>

      ))}
    </div>
  );
};

export default TopPost;


