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
    
    // 모델 설정
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // 콘텐츠 생성
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        content: text
      })
    };
  } catch (error) {
    console.error('Gemini API 오류:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message || 'Gemini API 오류가 발생했습니다.'
      })
    };
  }
}; 