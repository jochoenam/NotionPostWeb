const { Client } = require('@notionhq/client');

// UUID 형식으로 데이터베이스 ID 변환
function formatDatabaseId(databaseId) {
  if (!databaseId) return '';
  
  // 하이픈 제거
  const cleanId = databaseId.replace(/-/g, '');
  
  // 32자리가 아닌 경우 원본 반환
  if (cleanId.length !== 32) {
    console.warn('데이터베이스 ID가 32자리가 아닙니다:', databaseId);
    return databaseId;
  }
  
  // UUID 형식(8-4-4-4-12)으로 변환
  return `${cleanId.slice(0,8)}-${cleanId.slice(8,12)}-${cleanId.slice(12,16)}-${cleanId.slice(16,20)}-${cleanId.slice(20)}`;
}

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };
  
  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  // POST 요청이 아닌 경우 오류 반환
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: '잘못된 HTTP 메소드입니다. POST만 지원합니다.' })
    };
  }
  
  try {
    const { path, method, body, token } = JSON.parse(event.body);
    
    if (!token) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Notion API 토큰이 필요합니다.' })
      };
    }
    
    // Notion 클라이언트 초기화
    const notion = new Client({ auth: token });
    
    let response;
    
    // 데이터베이스 확인 API
    if (path === '/databases/check' && method === 'POST') {
      const { databaseId } = body;
      if (!databaseId) {
        throw new Error('데이터베이스 ID가 필요합니다.');
      }
      
      // ID 포맷팅
      const formattedId = formatDatabaseId(databaseId);
      
      response = await notion.databases.retrieve({
        database_id: formattedId
      });
    }
    // 통합 확인 API
    else if (path === '/integration/check' && method === 'POST') {
      const { databaseId } = body;
      if (!databaseId) {
        throw new Error('데이터베이스 ID가 필요합니다.');
      }
      
      // ID 포맷팅
      const formattedId = formatDatabaseId(databaseId);
      
      response = await notion.databases.retrieve({
        database_id: formattedId
      });
    }
    // 페이지 생성 API
    else if (path === '/pages/create' && method === 'POST') {
      const { databaseId, properties, children } = body;
      
      if (!databaseId) {
        throw new Error('데이터베이스 ID가 필요합니다.');
      }
      
      // ID 포맷팅
      const formattedId = formatDatabaseId(databaseId);
      
      response = await notion.pages.create({
        parent: { database_id: formattedId },
        properties,
        children
      });
    }
    // 데이터베이스 생성 API
    else if (path === '/databases/create' && method === 'POST') {
      const { pageId } = body;
      
      if (!pageId) {
        throw new Error('페이지 ID가 필요합니다.');
      }
      
      response = await notion.databases.create({
        parent: { page_id: pageId },
        title: [
          {
            type: 'text',
            text: {
              content: 'GZ 콘텐츠 데이터베이스'
            }
          }
        ],
        properties: {
          제목: { title: {} },
          태그: { multi_select: {} },
          카테고리: { select: {} }
        }
      });
    }
    // 직접 API 호출
    else {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '지원하지 않는 API 경로입니다.' })
      };
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Notion API 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || '알 수 없는 오류가 발생했습니다.'
      })
    };
  }
}; 