import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './ChatUsers.css';

function ChatUsers({ chatroomId }) {
  const [activeUsers, setActiveUsers] = useState([]);

  useEffect(() => {
    const fetchActiveUsers = async () => {
      try {
        const response = await axios.get(`https://kmk510.store/api/chatrooms/${chatroomId}/users`);
        setActiveUsers(response.data);
      } catch (error) {
        console.error('Error fetching active users:', error);
      }
    };

    if (chatroomId) {
      fetchActiveUsers();
    }
  }, [chatroomId]);

  return (
    <div className="chatusers-container">
      <h2>Active Users</h2>
      <ul>
        {activeUsers.map((user, index) => (
          <li key={index}>{user}</li>
        ))}
      </ul>
    </div>
  );
}

export default ChatUsers;