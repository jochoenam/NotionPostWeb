const { Client } = require('@notionhq/client');

exports.handler = async function(event, context) {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { path, method, body, token } = JSON.parse(event.body);
    
    if (!token) {
      throw new Error('API 토큰이 제공되지 않았습니다.');
    }

    // Notion 클라이언트 초기화
    const notion = new Client({ auth: token });

    // 데이터베이스 ID 형식 변환 함수
    const formatDatabaseId = (databaseId) => {
      // 하이픈 제거
      const cleanId = databaseId.replace(/-/g, '');
      
      // 32자리가 아니면 원본 반환
      if (cleanId.length !== 32) return databaseId;
      
      // UUID 형식으로 변환 (8-4-4-4-12)
      return `${cleanId.slice(0,8)}-${cleanId.slice(8,12)}-${cleanId.slice(12,16)}-${cleanId.slice(16,20)}-${cleanId.slice(20)}`;
    };

    // API 경로에 따른 처리
    let response;
    
    if (path.startsWith('/databases/')) {
      const databaseId = path.split('/')[2];
      if (!databaseId) {
        throw new Error('유효하지 않은 데이터베이스 ID입니다.');
      }
      const formattedId = formatDatabaseId(databaseId);
      
      try {
        response = await notion.databases.retrieve({
          database_id: formattedId
        });
      } catch (error) {
        // 다른 ID 형식으로 재시도
        const alternativeIds = [
          databaseId,                    // 원본
          databaseId.replace(/-/g, ''),  // 하이픈 제거
          formatDatabaseId(databaseId)   // UUID 형식
        ];

        for (const id of alternativeIds) {
          try {
            response = await notion.databases.retrieve({
              database_id: id
            });
            if (response) break;
          } catch (retryError) {
            console.log(`ID ${id} 시도 실패:`, retryError.message);
          }
        }

        if (!response) {
          throw new Error('데이터베이스를 찾을 수 없습니다.');
        }
      }
    } else if (path === '/pages' && method === 'POST') {
      if (!body.parent.database_id) {
        throw new Error('데이터베이스 ID가 필요합니다.');
      }

      const formattedId = formatDatabaseId(body.parent.database_id);
      body.parent.database_id = formattedId;

      response = await notion.pages.create(body);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Notion API Error:', error);
    return {
      statusCode: error.status || 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        code: error.code,
        status: error.status
      })
    };
  }
}; 