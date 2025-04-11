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
    
    // Gemini AI 초기화
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });  // 1.5-flash 대신 안정적인 gemini-pro 사용

    // 콘텐츠 생성
    const result = await model.generateContent(prompt);
    const response = await result.response;
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        candidates: [{
          content: {
            parts: [{
              text: response.text  // .text() 메서드 대신 .text 속성 사용
            }]
          }
        }]
      })
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
}; 