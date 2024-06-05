import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import ChatroomList from './ChatroomList';
import './Chat.css';

const socket = io('http://43.202.124.253:3001');

function Chat() {
  const { chatroom, username } = useParams();
  const [currentChat, setCurrentChat] = useState(chatroom || 'general');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [userJoined, setUserJoined] = useState('');

  useEffect(() => {
    console.log('URL params:', { chatroom, username });

    // 클라이언트가 채팅방에 입장합니다.
    if (chatroom && username) {
      console.log(`User ${username} has joined chatroom ${chatroom}`);
      socket.emit('joinRoom', chatroom);
    }

    if (currentChat && username) {
      socket.emit('joinRoom', currentChat);

      socket.on('initialMessages', (initialMessages) => {
        setMessages(initialMessages);
      });

      socket.on('Chat', (msg) => {
        setMessages((prevMessages) => [...prevMessages, msg]);
      });

      socket.on('userJoined', (username) => {
        setUserJoined(`${username}님이 채팅방에 입장했습니다.`);
      });

      return () => {
        socket.off('initialMessages');
        socket.off('Chat');
        socket.off('userJoined');
      };
    }
  }, [chatroom, username, currentChat]);

  const sendMessage = () => {
    if (message.trim() && username) {
      socket.emit('Chat', { username, message, chatroom: currentChat });
      setMessage('');
    }
  };

  return (
      <div className="chat-container">
        <h1>Chat</h1>
        <hr /> {/* 가로 경계선 추가 */}
        {userJoined && <div className="user-joined">{userJoined}</div>}
        {messages.map((msg, index) => (
          <div className={`message ${msg.username === username ? 'sent-message' : 'received-message'}`} key={index}>
            <div className="message-bubble">
              <span className="username">{msg.username}:</span> {msg.message}
            </div>
            <span className="timestamp">({new Date(msg.timestamp).getHours()}:{new Date(msg.timestamp).getMinutes()})</span>
          </div>
        ))}
        <hr /> {/* 가로 경계선 추가 */}
        <div className="message-input-container">
          <input type="text" className="message-input" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button onClick={sendMessage} className="send-button">Send</button>
        </div>
      </div>
  );  
}

export default Chat;