const cors = require('cors');
const multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 3001;

// MySQL 데이터베이스 연결 설정
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '12345678',
    database: 'wkn_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// MySQL 연결 테스트
pool.getConnection().then(connection => {
    console.log('MySQL 연결 성공!');
    connection.release();
}).catch(err => {
    console.error('MySQL 연결 실패:', err);
});

// `uploads` 폴더 확인 및 생성
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
    console.log('`uploads` 폴더가 생성되었습니다.');
} else {
    console.log('`uploads` 폴더가 이미 존재합니다.');
}

// multer 설정
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); // 파일명 중복 방지
    },
  });
  
const upload = multer({ storage: storage });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // URL-encoded bodies를 파싱하기 위해 추가

// HTTP 서버 생성
const server = http.createServer(app);

// Socket.IO 서버 생성
const io = socketIo(server, {
    cors: {
        origin: '*', // 허용할 클라이언트의 URL
        methods: ['GET', 'POST'],
    },
});

// Socket.IO 이벤트 처리
io.on('connection', async (socket) => {
    console.log('새로운 클라이언트 연결됨');

    let chatRoomId; // 클라이언트가 속한 채팅방 ID를 저장할 변수

    // 클라이언트가 채팅방에 입장할 때 채팅방 ID를 받아옴
    socket.on('joinRoom', async (roomId) => {
        console.log(`클라이언트가 ${roomId} 채팅방에 입장함`);
        chatRoomId = roomId;

        // 클라이언트에게 새로운 사용자가 채팅방에 입장했음을 알림
        socket.broadcast.to(chatRoomId).emit('userJoined', '새로운 사용자가 채팅방에 입장했습니다.');

        // 이전 메시지 가져와서 클라이언트에게 전송
        try {
            const connection = await pool.getConnection();
            const [rows] = await connection.query('SELECT * FROM chat WHERE chatroom_id = ? ORDER BY timestamp ASC', [chatRoomId]);
            socket.emit('initialMessages', rows);
            connection.release();
        } catch (err) {
            console.error('이전 메시지 조회 오류:', err);
        }
    });

    // 기존 메시지 전송
    socket.on('Chat', async (msg) => {
        console.log('받은 메시지:', msg);

        // 메시지 저장
        try {
            const connection = await pool.getConnection();
            const query = 'INSERT INTO chat (username, message, chatroom_id) VALUES (?, ?, ?)';
            const [result] = await connection.query(query, [msg.username, msg.message, msg.chatroom]);
            const newMessage = { id: result.insertId, username: msg.username, message: msg.message, chatroom: msg.chatroom, timestamp: new Date() };
            io.emit('Chat', newMessage); // 메시지를 모든 클라이언트에게 브로드캐스트
            connection.release();
        } catch (err) {
            console.error('메시지 저장 오류:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('클라이언트 연결 종료');
    });
});

// 회원가입 엔드포인트
app.post('/api/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const connection = await pool.getConnection();
        const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        const values = [username, hashedPassword, email];
        await connection.execute(sql, values);
        connection.release();

        console.log('회원가입 성공');
        res.json({ success: true });
    } catch (error) {
        console.error('회원가입 실패:', error);
        res.status(500).json({ error: '회원가입 실패' });
    }
});

// 로그인 처리
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
        connection.release();

        if (rows.length > 0) {
            const hashedPasswordFromDB = rows[0].password;
            const match = await bcrypt.compare(password, hashedPasswordFromDB);

            if (match) {
                console.log('로그인 성공:', rows[0].username);
                res.status(200).json({ email: rows[0].email });
            } else {
                console.log('로그인 실패: 잘못된 이메일 또는 비밀번호');
                res.status(401).send('로그인 실패: 잘못된 이메일 또는 비밀번호');
            }
        } else {
            console.log('로그인 실패: 잘못된 이메일 또는 비밀번호');
            res.status(401).send('로그인 실패: 잘못된 이메일 또는 비밀번호');
        }
    } catch (err) {
        console.error('로그인 오류:', err);
        res.status(500).send('로그인 오류가 발생했습니다.');
    }
});

// 사용자 데이터 가져오기 엔드포인트
app.get('/api/userdata', async (req, res) => {
    const email = req.query.email;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT username FROM users WHERE email = ?', [email]);
        connection.release();

        if (rows.length > 0) {
            console.log('사용자 데이터:', rows[0]);  // 데이터 로그 추가
            res.status(200).json({ username: rows[0].username });
        } else {
            res.status(404).send('사용자를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('사용자 데이터 가져오기 실패:', error);
        res.status(500).send('사용자 데이터 가져오기 실패');
    }
});

// 로그아웃 처리 엔드포인트
app.post('/api/logout', (req, res) => {
    res.status(200).send('로그아웃 성공');
});

// 비밀번호 확인 및 회원 탈퇴 엔드포인트
app.post('/confirmPasswordAndWithdraw', async (req, res) => {
    const { email, password } = req.body;

    try {
        const connection = await pool.getConnection();
        const [users] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length > 0) {
            const user = users[0];
            const passwordMatch = await bcrypt.compare(password, user.password);

            if (passwordMatch) {
                // 비밀번호가 맞으면 회원 탈퇴 처리
                await connection.query('DELETE FROM comments WHERE author = ?', [email]);
                await connection.query('DELETE FROM comments WHERE post_id IN (SELECT id FROM posts WHERE author = ?)', [email]);
                await connection.query('DELETE FROM posts WHERE author = ?', [email]);
                const [result] = await connection.query('DELETE FROM users WHERE email = ?', [email]);

                connection.release();

                if (result.affectedRows > 0) {
                    console.log('회원 탈퇴 성공:', email);
                    res.status(200).json({ success: true });
                } else {
                    console.log('회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.');
                    res.status(404).json({ success: false, message: '회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.' });
                }
            } else {
                console.log('비밀번호 불일치');
                connection.release();
                res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
            }
        } else {
            console.log('회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.');
            connection.release();
            res.status(404).json({ success: false, message: '회원 탈퇴 실패: 해당 이메일이 존재하지 않습니다.' });
        }
    } catch (err) {
        console.error('회원 탈퇴 오류:', err);
        res.status(500).json({ success: false, message: '회원 탈퇴 오류가 발생했습니다.' });
    }
});

// 정적 파일 서빙을 위한 설정 (이미지 접근 가능하도록)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 게시글 저장 엔드포인트
app.post('/api/posts', upload.single('image'), async (req, res) => {
    const { title, content, category, author } = req.body;
    let imageUrl = req.file ? `/uploads/${req.file.filename}` : null; // let으로 변경하여 조건부 재정의 가능하도록 함

    try {
        const connection = await pool.getConnection();
        const [user] = await connection.execute('SELECT * FROM users WHERE email = ?', [author]);

        if (user.length === 0) {
            connection.release();
            console.log('작성자 이메일이 사용자 테이블에 없습니다.');
            return res.status(400).send('작성자 이메일이 사용자 테이블에 없습니다.');
        }

        await connection.execute(
            'INSERT INTO posts (title, content, category, author, imageUrl, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [title, content, category, author, imageUrl]
        );

        connection.release();
        console.log('게시글이 성공적으로 저장되었습니다.');
        console.log('이미지 URL:', imageUrl); // 이미지 URL 로깅
        res.status(201).send('게시글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('게시글 저장 실패:', error);
        res.status(500).send('게시글 저장 실패');
    }
});

// 게시글 목록 조회 엔드포인트
app.get('/api/posts', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT id, title, author, category, created_at FROM posts');
        connection.release();

        console.log('게시글 정보를 성공적으로 가져왔습니다.', rows);
        res.status(200).json(rows);
    } catch (error) {
        console.error('게시글 정보 가져오기 실패:', error);
        res.status(500).send('게시글 정보 가져오기 실패');
    }
});

// 특정 게시글 정보 조회 엔드포인트
app.get('/api/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT title, author, content, category, imageUrl, created_at FROM posts WHERE id = ?', [postId]);
        connection.release();

        if (rows.length > 0) {
            console.log('게시글 정보:', rows[0]);
            console.log('이미지 URL:', rows[0].imageUrl); // 이미지 URL 로깅
            res.status(200).json(rows[0]);
        } else {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('게시글 정보 가져오기 실패:', error);
        res.status(500).send('게시글 정보 가져오기 실패');
    }
});

// 게시글 수정 엔드포인트 추가
app.put('/api/posts/:id', async (req, res) => {
    const postId = req.params.id;
    const { title, content } = req.body;

    try {
        const connection = await pool.getConnection();
        const sql = 'UPDATE posts SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP, created_at = IFNULL(created_at, CURRENT_TIMESTAMP) WHERE id = ?';
        const values = [title, content, postId];
        const [result] = await connection.execute(sql, values);
        
        connection.release();

        if (result.affectedRows === 0) {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        } else {
            res.status(200).send('게시글이 성공적으로 수정되었습니다.');
        }
    } catch (error) {
        console.error('게시글 수정 실패:', error);
        res.status(500).send('게시글 수정 실패');
    }
});

// 게시글 삭제 엔드포인트 추가
app.delete('/api/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const connection = await pool.getConnection();
        await connection.execute('DELETE FROM comments WHERE post_id = ?', [postId]);
        const [result] = await connection.execute('DELETE FROM posts WHERE id = ?', [postId]);
        connection.release();

        if (result.affectedRows === 0) {
            res.status(404).send('게시글을 찾을 수 없습니다.');
        } else {
            res.status(200).send('게시글이 성공적으로 삭제되었습니다.');
        }
    } catch (error) {
        console.error('게시글 삭제 실패:', error);
        res.status(500).send('게시글 삭제 실패');
    }
});

// 댓글 저장 엔드포인트
app.post('/api/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;
    const { author, content } = req.body;

    // 현재 시간을 작성일로 설정
    const created_at = new Date();

    console.log('요청 본문:', req.body); // 디버깅을 위해 요청 본문을 로깅합니다.

    if (!author || !content) {
        console.error('작성자 또는 내용이 정의되지 않았습니다.');
        res.status(400).send('작성자와 내용은 필수입니다.');
        return;
    }

    try {
        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();

        // 게시글이 존재하는지 확인
        const [rows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (rows.length === 0) {
            console.error('게시글이 존재하지 않습니다.');
            connection.release();
            res.status(404).send('게시글을 찾을 수 없습니다.');
            return;
        }

        // 댓글을 데이터베이스에 삽입하는 SQL 실행
        const sql = 'INSERT INTO comments (post_id, author, content, created_at) VALUES (?, ?, ?, ?)';
        const values = [postId, author, content, created_at];
        await connection.execute(sql, values);
        console.log('삽입될 데이터:', values); // 삽입 전 데이터를 로깅합니다.

        // 연결 풀에 연결 반환
        connection.release();

        console.log('새로운 댓글이 성공적으로 추가되었습니다.');
        res.status(200).send('댓글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('댓글 저장 실패:', error);
        res.status(500).send('댓글 저장 실패');
    }
});

// 댓글 가져오는 엔드포인트
app.get('/api/posts/:id/comments', async (req, res) => {
    const postId = req.params.id;

    try {
        const connection = await pool.getConnection();

        const [rows] = await connection.execute('SELECT * FROM posts WHERE id = ?', [postId]);
        if (rows.length === 0) {
            console.error('게시글이 존재하지 않습니다.');
            connection.release();
            res.status(404).send('게시글을 찾을 수 없습니다.');
            return;
        }

        const [comments] = await connection.execute('SELECT * FROM comments WHERE post_id = ?', [postId]);
        connection.release();
        console.log('게시물의 댓글을 성공적으로 가져왔습니다.');
        res.status(200).json(comments);
    } catch (error) {
        console.error('댓글 가져오기 실패:', error);
        res.status(500).send('댓글 가져오기 실패');
    }
});

// 댓글 삭제 엔드포인트 추가
app.delete('/api/posts/:postId/comments/:commentId', async (req, res) => {
    const postId = req.params.postId;
    const commentId = req.params.commentId;

    try {
        const connection = await pool.getConnection();
        const [rows] = await connection.execute('SELECT * FROM comments WHERE id = ? AND post_id = ?', [commentId, postId]);
        
        if (rows.length === 0) {
            console.error('댓글이 존재하지 않습니다.');
            connection.release();
            res.status(404).send('댓글을 찾을 수 없습니다.');
            return;
        }

        await connection.execute('DELETE FROM comments WHERE id = ? AND post_id = ?', [commentId, postId]);
        connection.release();
        console.log('댓글이 성공적으로 삭제되었습니다.');
        res.status(200).send('댓글이 성공적으로 삭제되었습니다.');
    } catch (error) {
        console.error('댓글 삭제 실패:', error);
        res.status(500).send('댓글 삭제 실패');
   }
});

// 뉴스 API 프록시 엔드포인트
app.get('/api/news', async (req, res) => {
    try {
        const category = req.query.category || 'all';
        const query = category === 'all' ? '' : `&category=${category}`;
        console.log(`Fetching news from newsapi.org for category: ${category}`);
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=jp${query}&apiKey=db05eddf2a4b43c2b3378b2dbaa7eeef`);
        console.log('News fetched from newsapi.org successfully:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('뉴스 API 요청 실패:', error);
        res.status(500).send('뉴스 데이터를 가져오는 데 실패했습니다.');
    }
});

// 정적 파일 제공 설정 (프론트엔드 빌드 파일)
app.use(express.static(path.join(__dirname, '../../frontend/build')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/build', 'index.html'));
});

// 서버 시작
server.listen(port, () => {
    console.log(`서버가 http://43.202.124.253:${port} 에서 실행 중입니다.`);
});