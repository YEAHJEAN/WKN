import React, { useState, useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Login from './Login';
import './Mypage.css';

const MyPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState("");

  useEffect(() => {
    const userEmail = sessionStorage.getItem('userEmail');
    setEmail(userEmail);
  }, []);

  const handleClick = () => {
    navigate('/home');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('login-token');
    sessionStorage.removeItem('userEmail');
    navigate("/login");
  };

  const handleDeleteAccount = async () => {
    try {
      await axios.delete('http://localhost:3001/user/delete', {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('login-token')}`
        }
      });
      console.log("User account deleted");
      sessionStorage.clear('login-token');
      navigate("/login");
    } catch (error) {
      console.error('Error deleting account:', error);
      setError('계정을 삭제하는 동안 문제가 발생했습니다.');
    }
  };

  return (
    <div>
    <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <h1>My Page</h1>
      <p>Email: {email}</p>
      {error && <div className="error-message">{error}</div>}
      <div className="action-buttons">
          <button className="logout-button" onClick={handleLogout}>로그아웃</button>
          <button className="delete-button" onClick={handleDeleteAccount}>회원탈퇴</button>
      </div>

      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>

  );
}

export default MyPage;