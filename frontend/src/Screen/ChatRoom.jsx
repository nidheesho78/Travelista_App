// ChatRoom.js
import React, { useState, useEffect } from 'react';
import { FaSearch, FaBell } from 'react-icons/fa';
import { Button, Image } from 'react-bootstrap';
import axios from 'axios';
import '../css/profileScree.css';
import '../css/chatRoom.css';
import ChatComponent from '../Components/ChatComponent';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { BASE_URL } from '../config.js';
import { useSelector } from 'react-redux';
const END_POINT = 'https://travelista.nidheesh.world';
    


const ChatRoom = () => {
  const [chatRooms, setChatRooms] = useState([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState(null);
  const [showChatComponent, setShowChatComponent] = useState(false);
  const { userInfo } = useSelector((state) => state.auth);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [notificateStatus, setNotificateStatus] = useState({}); // State to store notification status
  const socket = io(END_POINT); 

  const [socketConnected, setSocketConnected] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [currentChatRoomId, setCurrentChatRoomId] = useState(null);


  async function makeNotification(messageId, newMessageRoomId) {
    try {
      await axios.post(`${BASE_URL}/api/chats/updateNoti/${newMessageRoomId}`, { messageId });
    } catch (error) {
      console.error('Error making notification request:', error);
    }
  }

  useEffect(() => {
    const updateChatRoomOrder = (roomId) => {
      setChatRooms((prevChatRooms) => {
        const updatedChatRooms = [...prevChatRooms];
        const roomIndex = updatedChatRooms.findIndex((room) => room._id === roomId);
        if (roomIndex !== -1) {
          const movedRoom = updatedChatRooms.splice(roomIndex, 1)[0];
          updatedChatRooms.unshift(movedRoom);
        }
        return updatedChatRooms;
      });
    };

    socket.on('message received', (newMessageReceived) => {
      if (newMessageReceived.sender._id !== userInfo._id) {
        if (currentChatRoomId !== newMessageReceived.room._id) {
          setUnreadMessages((prevState) => ({
            ...prevState,
            [newMessageReceived.room._id]: true,
          }));
        } else if (newMessageReceived.sender._id !== userInfo._id) {
          setMessages([...messages, newMessageReceived]);
        }

        updateChatRoomOrder(newMessageReceived.room._id);
      }
    }, [currentChatRoomId]);

    socket.on('new message notification', (newMessageReceived) => {
      if (currentChatRoomId !== newMessageReceived.room._id && newMessageReceived.sender._id !== userInfo._id) {
        const { _id: messageId, room } = newMessageReceived;
        const roomId = room._id;

        makeNotification(messageId, roomId);
      }
    });
  }, [currentChatRoomId]);

 useEffect(() => {
  socket.emit("setup",userInfo)
  socket.on("connected",()=>setSocketConnected(true))

  return () => {
    if (chatRooms.length > 0) {
      
      chatRooms.forEach((chatRoom) => {
        // console.log(chatRoom._id);
        // Emit a leaveRoom event when the component unmounts
        socket.emit('leaveRoom', { room: chatRoom._id });
      });
    }



  };
}, [chatRooms]);


  useEffect(() => {
    const fetchChatRooms = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/chats/chatRooms`, {
          withCredentials: true,
        });

        setChatRooms(response.data.chatRooms);
      } catch (error) {
        toast.error('Error fetching chat rooms');
      }
    };

    fetchChatRooms();
  }, []);

  useEffect(() => {
    const fetchNotificationStatus = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/chats/notificationStatus`, {
          withCredentials: true,
        });

        setNotificateStatus(response.data);

        const updatedUnreadMessages = {};
        for (const chatRoomId in response.data) {
          updatedUnreadMessages[chatRoomId] = response.data[chatRoomId] ? 1 : 0;
        }
        setUnreadMessages(updatedUnreadMessages);
      } catch (error) {
        console.error('Error fetching notification status:', error);
      }
    };

    fetchNotificationStatus();
  }, []);


  const handleOpenChat = async (chatRoomId,chatRoom) => {
    setSelectedChatRoom(chatRoomId);

    setCurrentChatRoomId(chatRoomId);


    // Make an API request to delete messages by chat room ID
    try {
      await axios.delete(`${BASE_URL}/api/users/deleteMessageId/${chatRoomId}`, {
        withCredentials: true,
      });






   // After deleting messages, update the unreadMessages state to mark this chat room as read
   setUnreadMessages((prevState) => ({
    ...prevState,
    [chatRoomId]: false, // Mark this chat room as read
  }));



      // After deleting messages, you can proceed to open the chat component
      setShowChatComponent(true);
    } catch (error) {
      console.error('Error deleting messages:', error);
    }
  };

  return (
    <div className="chatRoom-container">
      <div className="topHomeLanding">
        <h3>Chat Room</h3>
        <div className="search-bar-l">
          <input type="text" placeholder="Search" />
          <button>
            <FaSearch />
          </button>
        </div>
      </div>
      <div className="fullChatDiv">
        <div className="chatHistoryContainer" style={{ maxHeight: "400px", overflowY: "scroll" }}>
          {chatRooms.map((chatRoom) => (
            <div className="followingBox" key={chatRoom._id}>
              <div className="imageONbox">
                {chatRoom.otherParticipant.profileImage ? (
                  <Image
                    src={`${BASE_URL}/api/users/uploads/${chatRoom.otherParticipant.profileImage}`}
                    alt="Profile"
                    className="followingImage"
                    roundedCircle
                    style={{ height: "77%" }}
                  />
                ) : (
                  <div className="profile-initials" style={{ color: "white" }}>
                    {chatRoom.otherParticipant.name ? chatRoom.otherParticipant.name.charAt(0).toUpperCase() : ''}
                  </div>
                )}
              </div>
              <div className="nameOfFollowingUser" style={{ color: "white", width: "30%" }}>
                {chatRoom.otherParticipant.name}
              </div>
              <div className="unfollowBtn">
                <Button
                  variant="danger"
                  className="unfollow-button"
                  onClick={() => handleOpenChat(chatRoom._id, chatRoom)}
                  style={{ backgroundColor: "#7EAA92", border: "none", width: "6rem" }}
                >
                  Chat
                </Button>
                <div className="noty">{unreadMessages[chatRoom._id] > 0 && <FaBell className="fa-bell" />}</div>
              </div>
            </div>
          ))}
        </div>
        {showChatComponent && <ChatComponent chatRoomId={selectedChatRoom} unreadMessages={unreadMessages} setUnreadMessages={setUnreadMessages} />}
      </div>
    </div>
  );
};

export default ChatRoom;
