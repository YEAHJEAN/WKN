const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;

// MySQL 데이터베이스 연결 설정
const pool = mysql.createPool({
    host: 'localhost', // MySQL 호스트 주소
    user: 'root', // MySQL 사용자 이름
    password: '12345678', // MySQL 비밀번호
    database: 'wkn_db', // 사용할 데이터베이스 이름
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// MySQL 연결
pool.getConnection((err, _connection) => {
    if (err) {
        console.error('MySQL 연결 실패:', err);
    } else {
        console.log('MySQL 연결 성공!');
        // 이제 connection을 사용하여 쿼리를 실행할 수 있습니다.
    }
});

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(bodyParser.json()); // JSON 형식의 요청 body를 파싱

// 회원가입 엔드포인트
app.post('/signup', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10); // 해싱 알고리즘과 솔트(salt)의 길이를 지정합니다.

        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();

        // 회원가입 정보를 데이터베이스에 삽입하는 SQL 실행
        const sql = 'INSERT INTO users (username, password, email) VALUES (?, ?, ?)';
        const values = [username, hashedPassword, email];
        await connection.execute(sql, values);

        // 연결 풀에 연결 반환
        connection.release();

        console.log('회원가입 성공');

        // 회원가입 성공 후에 이메일 정보 응답
        res.json({ success: true, email: email });
    } catch (error) {
        console.error('회원가입 실패:', error);
        res.status(500).json({ error: '회원가입 실패' });
    }
});

// 로그인 처리
app.post('/login', async (req, res) => {
    // 클라이언트로부터 받은 데이터
    const { email, password } = req.body;

    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            // 이메일과 비밀번호를 사용하여 사용자 조회
            const [rows] = await connection.query(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            connection.release(); // 연결 해제
            if (rows.length > 0) {
                // 데이터베이스에서 저장된 해싱된 비밀번호를 가져옵니다.
                const hashedPasswordFromDB = rows[0].password;

                // 비밀번호를 해싱하여 비교합니다.
                const match = await bcrypt.compare(password, hashedPasswordFromDB);

                if (match) {
                    const token = jwt.sign({ id: rows[0].id }, 'your_secret_key_here', { expiresIn: '1h' });
                    console.log('로그인 성공:', rows[0].username);
                    res.json({ token: token });
                } else {
                    console.log('로그인 실패: 잘못된 이메일 또는 비밀번호');
                    res.status(401).send('로그인 실패: 잘못된 이메일 또는 비밀번호');
                }
            } else {
                console.log('로그인 실패: 잘못된 이메일 또는 비밀번호');
                res.status(401).send('로그인 실패: 잘못된 이메일 또는 비밀번호');
            }
        } catch (err) {
            connection.release(); // 오류 발생 시 연결 해제
            console.error('로그인 오류:', err);
            res.status(500).send('로그인 오류가 발생했습니다.');
        }
    } catch (err) {
        console.error('데이터베이스 연결 오류:', err);
        res.status(500).send('데이터베이스 연결 오류가 발생했습니다.');
    }
});

// 로그아웃 처리
app.post('/logout', async (_req, res) => {
    res.status(200).send('로그아웃 되었습니다.');
});

// 회원탈퇴 처리
app.delete('/user/delete', authenticateToken, async (req, res) => {
    const { email } = req.body;

    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            await connection.query(
                'DELETE FROM users WHERE id = ?',
                [email]
            );
            connection.release(); // 연결 해제
            res.status(200).send('사용자 계정이 삭제되었습니다.');
        } catch (err) {
            console.error('Error deleting user account:', err);
            res.status(500).send('사용자 계정을 삭제하는 동안 오류가 발생했습니다.');
        }
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).send('데이터베이스 연결 오류가 발생했습니다.');
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token == null) {
      return res.status(401).send('인증 토큰이 없습니다.');
    }
    
    jwt.verify(token, 'your_secret_key_here', (err, user) => {
      if (err) {
        return res.status(403).send('인증 토큰이 유효하지 않습니다.');
      }
      req.user = user; // 요청 객체에 사용자 정보 추가
      next(); // 다음 미들웨어로 이동
    });
  }
  
  module.exports = authenticateToken;


// 게시글 저장 엔드포인트
app.post('/posts', async (req, res) => {
    const { title, content } = req.body;

    console.log('요청 본문:', req.body); // 디버깅을 위해 요청 본문을 로깅합니다.

    if (!author) {
        console.error('작성자가 정의되지 않았습니다.');
        res.status(400).send('작성자는 필수입니다.');
        return;
        }


    try {
        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();

        // 사용자 이메일이 users 테이블에 존재하는지 확인
        const [rows] = await connection.execute('SELECT email FROM users WHERE email = ?', [author]);
        if (rows.length === 0) {
        console.error('작성자 이메일이 사용자 테이블에 없습니다.');
        connection.release();
        res.status(400).send('작성자 이메일을 찾을 수 없습니다.');
        return;
    }

        // 게시글을 데이터베이스에 삽입하는 SQL 실행
        const sql = 'INSERT INTO posts (title, content) VALUES (?, ?)';
        const values = [title, content, author];
        await connection.execute(sql, values);
        console.log('삽입될 데이터:', values); // 삽입 전 데이터를 로깅합니다.

        // 연결 풀에 연결 반환
        connection.release();

        console.log('새로운 게시글이 성공적으로 추가되었습니다.');
        res.status(200).send('게시글이 성공적으로 저장되었습니다.');
    } catch (error) {
        console.error('게시글 저장 실패:', error);
        res.status(500).send('게시글 저장 실패');
    }
});

// 홈으로 게시글 정보를 가져오는 엔드포인트 수정
app.get('/posts', async (_req, res) => {
    try {
        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();

        // 게시글 정보를 데이터베이스에서 가져오는 SQL 실행
        const [rows] = await connection.query('SELECT title, author, created_at FROM posts');

        // 연결 풀에 연결 반환
        connection.release();

        console.log('게시글 정보를 성공적으로 가져왔습니다.', rows); // 수정된 부분: rows를 콘솔로그에 추가
        res.status(200).json(rows); // 가져온 게시글 정보를 JSON 형식으로 응답
    } catch (error) {
        console.error('게시글 정보 가져오기 실패:', error);
        res.status(500).send('게시글 정보 가져오기 실패');
    }
});

app.get('/user', async (req, res) => {
    try {
        // MySQL 풀에서 연결 가져오기
        const connection = await pool.getConnection();

        // 현재 로그인된 사용자의 이메일을 통해 사용자 정보를 데이터베이스에서 가져오는 SQL 실행
        const [rows] = await connection.execute('SELECT username, email FROM users WHERE email = ?', [req.body.email]);

        // 연결 풀에 연결 반환
        connection.release();

        if (rows.length > 0) {
            console.log('사용자 정보를 성공적으로 가져왔습니다.');
            res.status(200).json(rows[0]); // 사용자 정보를 JSON 형식으로 응답
        } else {
            console.error('사용자 정보를 찾을 수 없습니다.');
            res.status(404).send('사용자 정보를 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류가 발생했습니다:', error);
        res.status(500).send('사용자 정보를 가져오는 중 오류가 발생했습니다.');
    }
});


// 로그인 시 사용자 이메일을 가져오는 엔드포인트
app.get('/useremail', authenticateToken, async (req, res) => {
    // 클라이언트로부터 받은 JWT 토큰
    const email = req.body;

    try {
        // 추출된 사용자 정보로 사용자 이메일 찾기
        const connection = await pool.getConnection();
        const [rows] = await connection.query('SELECT email FROM users WHERE id = ?', [email]);
        connection.release();

        if (rows.length > 0) {
            // 사용자 이메일을 클라이언트에게 응답
            res.json({ email: rows[0].email });
        } else {
            res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
        }
    } catch (error) {
        res.status(401).json({ message: '인증 실패: 유효하지 않은 토큰' });
    }
});

app.listen(port, () => {
    console.log(`서버가 http://localhost:${port} 에서 실행 중입니다.`);
});