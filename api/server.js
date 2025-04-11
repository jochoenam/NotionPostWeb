/**
 * NotionPost API Proxy Server
 * CORS 문제를 해결하기 위한 중개 서버
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors()); // CORS 활성화
app.use(bodyParser.json()); // JSON 파싱

// 정적 파일 제공 (HTML, CSS, JS 등)
app.use(express.static('../'));

// Notion API를 위한 프록시 엔드포인트
app.all('/api/notion/*', async (req, res) => {
  try {
    const notionUrl = 'https://api.notion.com/v1/' + req.path.replace('/api/notion/', '');
    
    const headers = {
      'Authorization': req.headers.authorization,
      'Notion-Version': req.headers['notion-version'] || '2022-06-28',
      'Content-Type': 'application/json'
    };
    
    const method = req.method.toLowerCase();
    const options = {
      method,
      url: notionUrl,
      headers,
      ...(method !== 'get' && { data: req.body })
    };
    
    console.log(`프록시 요청: ${method.toUpperCase()} ${notionUrl}`);
    
    const response = await axios(options);
    
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('프록시 오류:', error.message);
    
    // Notion API 오류 응답 전달
    if (error.response) {
      return res.status(error.response.status).json(error.response.data);
    }
    
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`서버가 포트 ${port}에서 실행 중입니다.`);
  console.log(`웹 앱 접속 주소: http://localhost:${port}`);
}); 