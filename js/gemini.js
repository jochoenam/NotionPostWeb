/**
 * NotionPost Web - Gemini API 관련 JavaScript 파일
 * Gemini API와의 통신 및 콘텐츠 생성 담당
 */

const GeminiManager = {
    // API 엔드포인트
    API_URL: 'https://cheerful-daffodil-d3d4fb.netlify.app/.netlify/functions/gemini-api',
    
    async generateResponse(prompt, apiKey) {
        if (!apiKey) {
            throw new Error('API 키가 제공되지 않았습니다. 설정에서 API 키를 입력해주세요.');
        }

        try {
            console.log('Calling Gemini API');
            const response = await fetch(this.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt,
                    apiKey
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: '알 수 없는 오류가 발생했습니다.' }));
                throw new Error(`Gemini API Error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            if (!data.response || !data.response.text) {
                throw new Error('Gemini API가 유효한 응답을 반환하지 않았습니다.');
            }
            return data.response.text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new Error(`Gemini API Error: ${error.message}`);
        }
    },
    
    async checkApiKey(apiKey) {
        if (!apiKey) {
            return false;
        }

        try {
            const response = await this.generateResponse('테스트 메시지입니다.', apiKey);
            return true;
        } catch (error) {
            console.error('API 키 확인 오류:', error);
            return false;
        }
    },
    
    async generateContent(prompt) {
        try {
            // localStorage에서 최신 값 가져오기 시도
            let apiKey = APP.api.geminiApiKey;
            
            // 설정에서 값 가져오기 시도
            if (!apiKey && APP.elements.geminiApiKey) {
                apiKey = APP.elements.geminiApiKey.value;
                // 값이 있으면 APP.api에 저장
                if (apiKey) {
                    APP.api.geminiApiKey = apiKey;
                }
            }
            
            if (!apiKey) {
                throw new Error('API 키가 제공되지 않았습니다. 설정에서 API 키를 입력해주세요.');
            }

            return await this.generateResponse(prompt, apiKey);
        } catch (error) {
            console.error('Content generation error:', error);
            throw error;
        }
    },
    
    // 사용 가능한 모델 목록 가져오기 (API를 통한 직접 호출은 제한될 수 있음)
    getAvailableModels: function() {
        // 현재 사용 가능한 주요 모델 목록을 하드코딩
        return [
            'gemini-1.5-flash',
            'gemini-1.5-pro',
            'gemini-1.0-pro'
        ];
    }
};