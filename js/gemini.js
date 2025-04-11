/**
 * NotionPost Web - Gemini API 관련 JavaScript 파일
 * Gemini API와의 통신 및 콘텐츠 생성 담당
 */

const GeminiManager = {
    // API 엔드포인트
    API_URL: 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    
    // API 키 검증
    checkApiKey: async function(apiKey) {
        try {
            // 테스트 프롬프트로 간단한 응답 생성
            await this.generateSimpleResponse("안녕하세요", apiKey);
            return true;
        } catch (error) {
            console.error('API 키 검증 오류:', error);
            return false;
        }
    },
    
    // 간단한 텍스트 응답 생성
    generateSimpleResponse: async function(prompt, apiKey) {
        if (!apiKey) {
            throw new Error("Gemini API 키가 설정되지 않았습니다.");
        }
        
        try {
            const response = await fetch(`${this.API_URL}?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API 오류 (${response.status}): ${errorData.error?.message || '알 수 없는 오류'}`);
            }
            
            const data = await response.json();
            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('Gemini API 응답 오류:', error);
            throw new Error(`Gemini API 오류: ${error.message || error}`);
        }
    },
    
    // 콘텐츠 생성
    generateContent: async function(title, content, apiKey) {
        // 프롬프트 구성
        const prompt = `다음 내용을 정리하여 잘 구성된 문서로 작성해주세요:
        
제목: ${title}

내용:
${content}

다음 형식으로 작성해주세요:
1. 제목(#으로 시작)
2. 소개 문단
3. 주요 내용 (하위 섹션 포함, ##, ###으로 제목 표시)
4. 결론 또는 요약
5. 필요시 글머리 기호(-)나 번호 목록(1. 2. 등)을 사용해서 구조화

작성 시 전문적이고 명확한 문체를 사용해주세요.`;
        
        // API 호출
        return await this.generateSimpleResponse(prompt, apiKey);
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