import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Post.css';

function Post() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const email = sessionStorage.getItem('email');
  console.log('이메일:', email);

  const handleClick = () => {
    navigate('/home');
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleContentChange = (event) => {
    setContent(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!title && !content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    if (!title) {
      alert('제목을 입력해주세요.');
      return;
    }

    if (!content) {
      alert('내용을 입력해주세요.');
      return;
    }

    try {
      // 게시글 작성 요청 시 사용자의 이메일 정보와 함께 서버에 전송
      const newPost = {
        title,
        content,
        author: email // 클라이언트에서 가져온 사용자 이메일 정보를 author로 설정
      };
      console.log('전송하는 데이터:', newPost); // 새로운 콘솔로그 추가


      const response = await axios.post('http://43.202.124.253/api/posts', newPost);

      if (response.status === 200) {
        console.log('게시되었습니다.');
        setTitle('');
        setContent('');
        alert('게시되었습니다.');
        navigate('/home');
      } else {
        console.error('게시 중 오류가 발생했습니다.');
        alert('게시 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('게시 중 오류 발생:', error);
      alert('게시 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="post-box">
      <button onClick={handleClick} style={{ cursor: 'pointer', border: 'none', background: 'none', width: '300px', display: 'block', margin: '0 auto', outline: 'none' }}>
        <img src="Home.jpg" alt="Go to Home" style={{ width: '250px', height: '120px' }} />
      </button>
      <h1>Board</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" value={title} placeholder="제목을 입력해주세요" onChange={handleTitleChange} className="input-field" />
        <textarea value={content} placeholder="내용을 입력해주세요" onChange={handleContentChange} className="input-field" />
        <button type="submit" className="submit-button">게시</button>
      </form>
    </div>
  );
}

export default Post;