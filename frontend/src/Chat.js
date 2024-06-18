import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';
import './Chat.css';
import ChatUsers from './ChatUsers';
import ChatroomList2 from './ChatroomList2'; // ChatroomList2 컴포넌트 추가

const socket = io('https://kmk510.store', {
  secure: true,
  transports: ['websocket', 'polling']
});

function Chat() {
  const { chatroom, username } = useParams();
  const userId = 123; // 예시로 userId를 정의
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

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="chat-and-users-container">
      <ChatroomList2 username={username} /> {/* ChatroomList2 컴포넌트 추가 */}
      <ChatUsers chatroomId={chatroom} />
      <div className="chat-container">
        <h1>Chat</h1>
        <hr /> {/* 가로 경계선 추가 */}
        {userJoined && <div className="user-joined">{userJoined}</div>}
        <div className="messages-container">
          {messages.map((msg, index) => (
            <div className={`message ${msg.username === username ? 'sent-message' : 'received-message'}`} key={index}>
              <div className="message-bubble">
                <span className="username">{msg.username}:</span> {msg.message}
              </div>
              <span className="timestamp">({new Date(msg.timestamp).getHours()}:{new Date(msg.timestamp).getMinutes()})</span>
            </div>
          ))}
        </div>
        <div className="message-input-container">
        <input type="text" className="message-input" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyDown} />
          <button onClick={sendMessage} className="send-button">Send</button>
        </div>
      </div>
    </div>
  ); 
}

export default Chat;