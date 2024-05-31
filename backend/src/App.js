import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './frontend/src/Signup';
import Login from './frontend/src/Login';
import Home from './frontend/src/Home';
import Mypage from './frontend/src/Mypage';
import Post from './frontend/src/Post';

const App = () => {
  // 회원가입 요청을 서버에 보내는 함수
  const handleSignUp = (formData) => {
    // 여기에 회원가입 요청을 서버에 보내는 로직을 추가하세요
    console.log('Signing up:', formData);
    // 실제로는 fetch 또는 axios 등을 사용하여 서버에 요청을 보냅니다.
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login onSignUp={handleSignUp} />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/mypage" element={<Mypage />} />
        <Route path="/post" element={<Post />} />
      </Routes>
    </Router>
  );
};

export default App;