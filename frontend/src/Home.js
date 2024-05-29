import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';
import './MypageButton.css';
import './PostButton.css';

const Home = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    getPosts();
  }, []);

  const getPosts = async () => {
    try {
      const response = await axios.get('http://localhost:3001/posts');
      setPosts(response.data);
    } catch (error) {
      console.error('게시글을 불러오는 중 오류 발생:', error);
    }
  };

  const handleMyPageClick = () => {
    navigate('/mypage');
  };

  const handlePostClick = () => {
    navigate('/post');
  };

  const handleClick = () => {
    navigate('/home');
  };

  return (
    <div>
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <div className="mypage-button-container">
        <button onClick={handleMyPageClick} className="mypagebutton">마이페이지</button>
        </div>
        <div className="post-button-container">
          <button onClick={handlePostClick} className="postbutton">글쓰기</button>
          </div>
      <div style={{ marginTop: '50px' }}>
        <h1>Board</h1>
        <ul>
          {posts.map((post, index) => (
            <li key={index}>
              <h3>{post.title}</h3>
              <p>{post.content}</p>
            </li>
          ))}
        </ul>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <table style={{ width: '90%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '2%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>번호</th>
                <th style={{ width: '20%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>제목</th>
                <th style={{ width: '7%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>작성자</th>
                <th style={{ width: '7%', border: '1px solid #dddddd', padding: '8px', textAlign: 'center' }}>작성일</th>
              </tr>
            </thead>
            <tbody>
              {posts.length > 0 ? (
                posts.map((post, index) => (
                  <tr key={index} style={{ border: '1px solid #dddddd' }}>
                    <td style={{ border: '1px solid #dddddd', padding: '8px', textAlign: 'left' }}>{index + 1}</td>
                    <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{post.title}</td>
                    <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{post.author}</td>
                    <td style={{ border: '1px solid #dddddd', padding: '8px' }}>{post.date}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '10px', textAlign: 'center' }}>게시된 글이 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Home;