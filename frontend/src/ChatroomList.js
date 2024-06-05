import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';

const socket = io('http://43.202.124.253');

function ChatroomList({ username }) { // username을 props로 전달받음
  const [chatrooms, setChatrooms] = useState([]);

  useEffect(() => {
    socket.on('chatroomList', (rooms) => {
      setChatrooms(rooms);
    });

    return () => {
      socket.off('chatroomList');
    };
  }, []);

  return (
    <div>
      <h2>Your Chatrooms</h2>
      <ul>
        {chatrooms.map((room) => (
          <li key={room.id}>
            <Link to={`/chat/${room.id}/${username}`}>{room.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ChatroomList;