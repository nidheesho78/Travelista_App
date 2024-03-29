

import React, { useState , useEffect , useRef} from 'react';
import ReactQuill from 'react-quill';
import { useSelector,useDispatch } from 'react-redux'; // Import useSelector from Redux
import 'react-quill/dist/quill.snow.css'; // Import the CSS for the Quill editor style
import '../css/profileScree.css'; // Import your custom CSS file
import '../css/blogCreate.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useLogoutMutation } from '../slices/UserApiSlice';
import { logout } from '../slices/AuthSlice';
import { toast } from 'react-toastify';
import { BASE_URL } from '../config.js';



const CreateBlog = () => {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [content, setContent] = useState('');
    const [images, setImages] = useState([]);
    const [isSuccess, setIsSuccess] = useState(false); // State to track success
    // Access user info from the Redux store
    const { userInfo } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [logoutApiCall] = useLogoutMutation();
    const navigate = useNavigate();
    const [hasError, setHasError] = useState(false);

    const fileInputRef = useRef(null);





//check jwt
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
        toast.error('Check auth error');
      }
  };

  if (userInfo) {
      checkAuth();
  }
}, [userInfo, dispatch, logoutApiCall, navigate]);





    useEffect(() => {
      const fetchUserStatus = async () => {
        try {
          const response = await fetch(`${BASE_URL}/api/users/status/${userInfo._id}`);
          const data = await response.json();
  
          if (data.status) {
            await logoutApiCall().unwrap();
            dispatch(logout());
            navigate('/landing');
          }
        } catch (error) {
          toast.error('Fetch user status error');
        }
      };
  
      if (userInfo) {
        fetchUserStatus();
      }
    }, [userInfo, dispatch, logoutApiCall, navigate]);






    const handleTitleChange = (event) => {
      setTitle(event.target.value);
    };
  
    const handleSummaryChange = (event) => {
      setSummary(event.target.value);
    };
  
    const handleContentChange = (value) => {
      setContent(value);
    };
  
    
    const handleImageChange = (event) => {
      setImages([...images, ...event.target.files]); // Add selected files to the images array
    };

    const handleSuccess = () => {
      setTitle('');
      setSummary('');
      setContent('');
      setImages([]); // Clear the images array
      setIsSuccess(true); // Set success state to show the message
    };

      useEffect(() => {
        if (isSuccess) {
          const timer = setTimeout(() => {
            setIsSuccess(false); // Hide the success message after 3 seconds
          }, 3000);
    
          return () => {
            clearTimeout(timer);
          };
        }
      }, [isSuccess]);



      useEffect(() => {
        if (hasError) {
          toast.error('Please add JPG or MP4 files.');
         
          setImages([]);
          if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset the file input
          }
        }
      }, [hasError, navigate]); // Add 'navigate' to the dependency array
    



      const handlePostClick = async () => {

        const invalidFiles = images.filter(file => !['image/jpeg', 'video/mp4'].includes(file.type));

        if (invalidFiles.length > 0) {
          setHasError(true);
    return;
        }


        if (invalidFiles.length > 0) {
          setHasError(true);
    return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('summary', summary);
        formData.append('content', content);
      
        for (let i = 0; i < images.length; i++) {
          formData.append('images', images[i]); // Append each selected file to the 'images' field
        }
      
        // Use the user ID from the Redux store
        formData.append('author', userInfo._id);
      
        try {
          const token = document.cookie.replace(/(?:(?:^|.*;\s*)jwt\s*=\s*([^;]*).*$)|^.*$/, "$1");
          await axios.post(`${BASE_URL}/api/blogs/blogs`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true, // Include cookies in the request,
          });
      
    
     handleSuccess();
     navigate('/profile'); // Navigate to the /profile route
        
      } catch (error) {
        // Handle error, show an error message
        toast.error("uploading error")
      }
    };
  
  return (
    <div className="blog-form-container profile-container">
      {/* Increase the gap by setting marginTop to 40px */}
      <div className="blog-input-container" style={{ marginTop: '40px' }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={handleTitleChange}
          className="blog-input-field"
        />
        <input
          type="text"
          placeholder="Summary"
          value={summary}
          onChange={handleSummaryChange}
          className="blog-input-field"
        />
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleImageChange}
          className="blog-input-field"
          ref={fileInputRef}
          multiple 
        />
      </div>
      <ReactQuill
        value={content}
        onChange={handleContentChange}
        className="blog-quill-editor"
       
      />



      <button
        onClick={handlePostClick}
        className="blog-post-button"
        style={{ marginTop: '5rem',backgroundColor:"rgb(5, 80, 73) ", borderRadius: '10px' }}
      >
        Create Tale
      </button>
      {isSuccess && (
        <p style={{ color: 'green', marginTop: '1rem' }}>
          Blog created successfully! {/* Display a success message */}
        </p>
      )}
    </div>
  );
};

export default CreateBlog;



