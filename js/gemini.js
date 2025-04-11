/**
 * NotionPost Web - Gemini API 관련 JavaScript 파일
 * Gemini API와의 통신 및 콘텐츠 생성 담당
 */

const GeminiManager = {
    // API 엔드포인트
    API_URL: '/.netlify/functions/gemini-api',
    
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
                const errorData = await response.json();
                throw new Error(`Gemini API Error: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
                throw new Error('Gemini API가 유효하지 않은 응답을 반환했습니다.');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
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
    
    async generateContent(title, content, format, apiKey) {
        if (!apiKey) {
            throw new Error('API 키가 제공되지 않았습니다. 설정에서 API 키를 입력해주세요.');
        }

        const prompt = `다음 제목과 내용을 ${format} 형식으로 작성해주세요:\n\n제목: ${title}\n\n내용:\n${content}`;
        return await this.generateResponse(prompt, apiKey);
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