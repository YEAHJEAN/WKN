import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Signup from './Signup';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import Home from './Home';
import Post from './Post';
import PostDetail from './PostDetail';
import News from './News';
import Chatroom from './Chatroom';
import Chat from './Chat';
import ChatroomList from './ChatroomList';
import Weather from './Weather';
import Information from './Information';
import Mypage from './Mypage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/post" element={<Post />} />
      <Route path="/posts/:id" element={<PostDetail />} />
      <Route path="/news" element={<News />} />
      <Route path="/chatroom" element={<Chatroom />} />
      <Route path="/chat/:chatroom/:username" element={<Chat />} />
      <Route path="/chatroomList" element={<ChatroomList />} />
      <Route path="/weather" element={<Weather />} />
      <Route path="/information" element={<Information />} />
      <Route path="/mypage" element={<Mypage />} />
    </Routes>
  );
};

export default App;