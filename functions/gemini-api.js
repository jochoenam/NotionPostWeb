const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { prompt, apiKey } = JSON.parse(event.body);
    
    if (!apiKey) {
      throw new Error('API 키가 제공되지 않았습니다.');
    }

    if (!prompt) {
      throw new Error('프롬프트가 제공되지 않았습니다.');
    }
    
    // Gemini AI 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // API 키 유효성 검사
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent('test');  // 간단한 테스트 요청
      if (!result.response) {
        throw new Error('API 키가 유효하지 않습니다.');
      }
    } catch (error) {
      if (error.message.includes('API_KEY_INVALID')) {
        throw new Error('유효하지 않은 API 키입니다.');
      }
      throw error;
    }
    
    // 실제 콘텐츠 생성
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    // 응답이 비어있는 경우 처리
    if (!response || !response.text) {
      throw new Error('Gemini API가 빈 응답을 반환했습니다.');
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: {
          text: response.text
        }
      })
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    // 오류 메시지 정리
    let errorMessage = error.message;
    if (error.message.includes('API_KEY_INVALID')) {
      errorMessage = '유효하지 않은 API 키입니다.';
    } else if (error.message.includes('PERMISSION_DENIED')) {
      errorMessage = 'API 키에 대한 권한이 없습니다.';
    } else if (error.message.includes('QUOTA_EXCEEDED')) {
      errorMessage = 'API 할당량이 초과되었습니다.';
    }
    
    return {
      statusCode: error.status || 500,
      headers,
      body: JSON.stringify({ 
        error: errorMessage,
        code: error.code,
        status: error.status
      })
    };
  }
}; 