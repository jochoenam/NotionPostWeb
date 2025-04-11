/**
 * NotionPost Web - Notion API 관련 JavaScript 파일
 * Notion API와의 통신 및 데이터 처리 담당
 */

const NotionManager = {
    // Notion API 기본 URL
    BASE_URL: 'https://cheerful-daffodil-d3d4fb.netlify.app/.netlify/functions',
    
    // 링크 관리
    links: [],
    
    // 데이터베이스 ID 형식 변환
    formatDatabaseId: function(databaseId) {
        if (!databaseId) return '';
        
        // 하이픈 제거
        const cleanId = databaseId.replace(/-/g, '');
        
        // 32자리가 아닌 경우 원본 반환
        if (cleanId.length !== 32) {
            console.warn('데이터베이스 ID가 32자리가 아닙니다:', databaseId);
            return databaseId;
        }
        
        // UUID 형식(8-4-4-4-12)으로 변환
        const formatted = `${cleanId.slice(0,8)}-${cleanId.slice(8,12)}-${cleanId.slice(12,16)}-${cleanId.slice(16,20)}-${cleanId.slice(20)}`;
        console.log('데이터베이스 ID 변환:', databaseId, '->', formatted);
        return formatted;
    },
    
    // API 호출
    async callNotionAPI(endpoint, method = 'GET', body = null, token) {
        if (!token) {
            throw new Error('Notion API 토큰이 필요합니다.');
        }

        try {
            const response = await fetch(`${this.BASE_URL}/notion-api`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    path: endpoint,
                    method,
                    body,
                    token
                })
            });

            const text = await response.text();
            
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = JSON.parse(text);
                    errorMessage = errorData.error || `API 호출 실패: ${response.status}`;
                } catch (e) {
                    errorMessage = text || `API 호출 실패: ${response.status}`;
                }
                throw new Error(errorMessage);
            }

            try {
                return text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('JSON 파싱 오류:', e);
                throw new Error(`응답 데이터 파싱 오류: ${text}`);
            }
        } catch (error) {
            console.error('Notion API 호출 오류:', error);
            throw new Error(`Notion API 오류: ${error.message}`);
        }
    },
    
    // 데이터베이스 확인
    async checkDatabase() {
        const token = APP.elements.notionToken.value;
        const databaseId = this.formatDatabaseId(APP.elements.notionDatabaseId.value);
        
        if (!token || !databaseId) {
            UI.showAlert('Notion API 토큰과 데이터베이스 ID를 모두 입력해주세요.');
            return false;
        }
        
        UI.updateStatus('노션 데이터베이스 확인 중...');
        UI.showLoading('데이터베이스 확인 중...');
        
        try {
            const result = await this.callNotionAPI(
                '/databases/check',
                'POST',
                { databaseId },
                token
            );
            
            UI.hideLoading();
            UI.updateStatus('데이터베이스 확인 성공');
            return true;
        } catch (error) {
            console.error('데이터베이스 확인 중 예외 발생:', error);
            UI.showAlert(`데이터베이스 확인 중 오류가 발생했습니다: ${error.message}`);
            UI.updateStatus('오류 발생');
            UI.hideLoading();
            return false;
        }
    },
    
    // 데이터베이스 속성 확인
    checkProperties: function(dbData) {
        // 시뮬레이션 모드에서는 항상 성공으로 처리
        return true;
    },
    
    // 노션 페이지 생성
    async createPage(databaseId, title, content, category, tags, token) {
        try {
            console.log('Creating page in database:', databaseId);
            
            // 데이터베이스 ID 형식 변환
            const formattedId = this.formatDatabaseId(databaseId);
            
            // 태그 처리 개선
            let processedTags = [];
            if (tags) {
                if (Array.isArray(tags)) {
                    processedTags = tags.map(tag => ({
                        name: typeof tag === 'string' ? tag.trim() : (tag.name || String(tag)).trim()
                    }));
                } else if (typeof tags === 'string') {
                    processedTags = tags.split(',').map(tag => ({
                        name: tag.trim()
                    })).filter(tag => tag.name);
                }
            }
            
            // 속성 설정
            const properties = {
                제목: {
                    title: [
                        {
                            type: 'text',
                            text: {
                                content: title
                            }
                        }
                    ]
                },
                카테고리: {
                    select: {
                        name: category || '미분류'
                    }
                },
                태그: {
                    multi_select: processedTags
                }
            };

            // 콘텐츠 처리 개선
            const contentBlocks = Array.isArray(content) ? content : this.convertToBlocks(content);

            const result = await this.callNotionAPI(
                '/pages/create',
                'POST',
                {
                    databaseId: formattedId,
                    properties,
                    children: contentBlocks
                },
                token
            );

            return result;
        } catch (error) {
            console.error('페이지 생성 오류:', error);
            throw error;
        }
    },
    
    // 노션 통합 설정 확인
    async checkIntegration() {
        const token = APP.elements.notionToken.value;
        const databaseId = this.formatDatabaseId(APP.elements.notionDatabaseId.value);
        
        if (!token || !databaseId) {
            UI.showAlert('Notion API 토큰과 데이터베이스 ID를 모두 입력해주세요.');
            return;
        }
        
        UI.updateStatus('노션 통합 확인 중...');
        UI.showLoading('통합 확인 중...');
        
        try {
            await this.callNotionAPI(
                '/integration/check',
                'POST',
                { databaseId },
                token
            );
            
            UI.showAlert('노션 데이터베이스 연결에 성공했습니다!');
            UI.updateStatus('노션 데이터베이스 연결 성공');
        } catch (error) {
            UI.showAlert(`통합 확인 중 오류가 발생했습니다: ${error.message}`);
            UI.updateStatus('오류 발생');
        } finally {
            UI.hideLoading();
        }
    },
    
    // 새 데이터베이스 생성
    async createDatabase() {
        const token = APP.elements.notionToken.value;
        const pageId = APP.elements.pageId.value;
        
        if (!token || !pageId) {
            UI.showAlert('Notion API 토큰과 페이지 ID를 모두 입력해주세요.');
            return;
        }
        
        UI.updateStatus('새 데이터베이스 생성 중...');
        UI.showLoading('데이터베이스 생성 중...');
        
        try {
            const result = await this.callNotionAPI(
                '/databases/create',
                'POST',
                { pageId },
                token
            );
            
            // 데이터베이스 ID 설정
            APP.elements.notionDatabaseId.value = result.id;
            
            // 설정 저장
            SettingsManager.saveSettings();
            
            UI.showAlert(`새 데이터베이스가 생성되었습니다!\n\n데이터베이스 ID: ${result.id}\n\n이 ID가 자동으로 설정되었습니다.`);
            UI.updateStatus('데이터베이스 생성 완료');
        } catch (error) {
            UI.showAlert(`데이터베이스 생성 중 오류가 발생했습니다: ${error.message}`);
            UI.updateStatus('오류 발생');
        } finally {
            UI.hideLoading();
        }
    },
    
    // 노션에 포스팅
    async postToNotion() {
        // 필수 정보 확인
        const token = APP.elements.notionToken.value;
        const databaseId = APP.elements.notionDatabaseId.value;
        
        if (!token || !databaseId) {
            UI.showAlert('Notion API 토큰과 데이터베이스 ID를 입력해주세요.');
            UI.switchTab('settings');
            return;
        }
        
        const title = APP.elements.titleEntry.value;
        if (!title) {
            UI.showAlert('제목을 입력해주세요.');
            return;
        }
        
        const content = APP.elements.contentText.value.trim();
        if (!content) {
            UI.showAlert('내용을 입력해주세요.');
            return;
        }
        
        // 태그 처리
        const tagsStr = APP.elements.tagsEntry.value;
        const tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        // 카테고리
        const category = APP.elements.categoryEntry.value.trim();
        
        // 포맷 유형
        const formatType = APP.elements.formatCombo.value;
        
        // 포스팅 작업 시작
        UI.updateStatus('노션에 포스팅 중...');
        UI.showLoading('노션에 포스팅 중...');
        
        try {
            // 콘텐츠 블록 생성
            const contentBlocks = ContentFormatter.generateFormattedContent(title, content, formatType);
            
            // 노션에 페이지 생성
            const response = await this.createPage(databaseId, title, content, category, tags, token);
            
            // 성공 메시지 표시
            const url = response.url || '알 수 없음';
            UI.showAlert(`노션 페이지가 생성되었습니다!\n\nURL: ${url}\n\n참고: 프록시 서버 연결 오류로 시뮬레이션 모드로 작동합니다.`);
            UI.updateStatus('포스팅 완료 (시뮬레이션)');
            
            // 링크 추가
            this.addLink(title, url);
            
            // 히스토리에 저장
            HistoryManager.saveToHistory(title, content);
        } catch (error) {
            UI.showAlert(`노션 포스팅 중 오류가 발생했습니다: ${error.message || error}`);
            UI.updateStatus('오류 발생');
        } finally {
            UI.hideLoading();
        }
    },
    
    // 노션에 포스팅 (미리보기 탭에서)
    async postFromPreview() {
        // 필수 정보 확인
        const token = APP.elements.notionToken.value;
        const databaseId = APP.elements.notionDatabaseId.value;
        
        if (!token || !databaseId) {
            UI.showAlert('Notion API 토큰과 데이터베이스 ID를 입력해주세요.');
            UI.switchTab('settings');
            return;
        }
        
        const title = APP.elements.previewTitle.value;
        if (!title) {
            UI.showAlert('제목이 없습니다.');
            return;
        }
        
        const content = APP.elements.fullPreviewText.value.trim();
        if (!content) {
            UI.showAlert('내용이 없습니다.');
            return;
        }
        
        // 태그 처리
        const tagsStr = APP.elements.tagsEntry.value;
        const tags = tagsStr.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        // 카테고리
        const category = APP.elements.categoryEntry.value.trim();
        
        // 포맷 유형
        const formatType = APP.elements.formatCombo.value;
        
        // 포스팅 작업 시작
        UI.updateStatus('노션에 포스팅 중...');
        UI.showLoading('노션에 포스팅 중...');
        
        try {
            // 콘텐츠 블록 생성
            const contentBlocks = ContentFormatter.generateFormattedContent(title, content, formatType);
            
            // 노션에 페이지 생성
            const response = await this.createPage(databaseId, title, content, category, tags, token);
            
            // 성공 메시지 표시
            const url = response.url || '알 수 없음';
            UI.showAlert(`노션 페이지가 생성되었습니다!\n\nURL: ${url}\n\n참고: 프록시 서버 연결 오류로 시뮬레이션 모드로 작동합니다.`);
            UI.updateStatus('포스팅 완료 (시뮬레이션)');
            
            // 링크 추가
            this.addLink(title, url);
            
            // 히스토리에 저장
            HistoryManager.saveToHistory(title, content);
        } catch (error) {
            UI.showAlert(`노션 포스팅 중 오류가 발생했습니다: ${error.message || error}`);
            UI.updateStatus('오류 발생');
        } finally {
            UI.hideLoading();
        }
    },
    
    // 노션 링크 추가
    addLink: function(title, url, timestamp = new Date().toISOString()) {
        // 최대 10개까지만 저장
        if (this.links.length >= 10) {
            this.links.pop(); // 가장 오래된 링크 제거
        }
        
        // 새 링크 추가
        this.links.unshift({
            title: title,
            url: url,
            timestamp: timestamp
        });
        
        // 로컬 스토리지에 저장
        localStorage.setItem('notionPostLinks', JSON.stringify(this.links));
        
        // UI 업데이트
        this.displayLinks();
    },
    
    // 노션 링크 표시
    displayLinks: function() {
        const container = document.getElementById('notion-links-container');
        const linksArea = document.getElementById('notion-links-area');
        
        if (!container || !linksArea) return;
        
        // 링크가 있으면 영역 표시
        if (this.links.length > 0) {
            linksArea.style.display = 'block';
        } else {
            linksArea.style.display = 'none';
            return;
        }
        
        // 컨테이너 초기화
        container.innerHTML = '';
        
        // 링크 항목 추가
        this.links.forEach(link => {
            const linkItem = document.createElement('div');
            linkItem.className = 'notion-link-item';
            
            const title = document.createElement('div');
            title.className = 'notion-link-title';
            title.textContent = link.title;
            
            const url = document.createElement('a');
            url.className = 'notion-link-url';
            url.href = link.url;
            url.textContent = link.url;
            url.target = '_blank'; // 새 탭에서 열기
            
            const date = document.createElement('div');
            date.className = 'notion-link-date';
            date.textContent = new Date(link.timestamp).toLocaleString();
            
            linkItem.appendChild(title);
            linkItem.appendChild(url);
            linkItem.appendChild(date);
            
            container.appendChild(linkItem);
        });
    },
    
    // 링크 로드
    loadLinks: function() {
        const savedLinks = localStorage.getItem('notionPostLinks');
        if (savedLinks) {
            try {
                this.links = JSON.parse(savedLinks);
                this.displayLinks();
            } catch (e) {
                console.error('링크 데이터 파싱 오류:', e);
                this.links = [];
            }
        }
    },

    convertToBlocks(content) {
        return content.split('\n\n').map(paragraph => ({
            object: 'block',
            type: 'paragraph',
            paragraph: {
                rich_text: [
                    {
                        type: 'text',
                        text: {
                            content: paragraph
                        }
                    }
                ]
            }
        }));
    }
};

// 콘텐츠 포맷팅 클래스
const ContentFormatter = {
    // 텍스트를 노션 블록으로 변환
    convertToNotionBlocks: function(content) {
        const blocks = [];
        
        // 문단 분리
        const paragraphs = content.split(/\n\s*\n/);
        
        for (const paragraph of paragraphs) {
            if (!paragraph.trim()) continue;
            
            // 제목 처리 (##로 시작하는 경우)
            if (paragraph.trim().startsWith('# ')) {
                blocks.push({
                    "object": "block",
                    "type": "heading_1",
                    "heading_1": {
                        "rich_text": [{"type": "text", "text": {"content": paragraph.trim().substring(2)}}]
                    }
                });
            } else if (paragraph.trim().startsWith('## ')) {
                blocks.push({
                    "object": "block",
                    "type": "heading_2",
                    "heading_2": {
                        "rich_text": [{"type": "text", "text": {"content": paragraph.trim().substring(3)}}]
                    }
                });
            } else if (paragraph.trim().startsWith('### ')) {
                blocks.push({
                    "object": "block",
                    "type": "heading_3",
                    "heading_3": {
                        "rich_text": [{"type": "text", "text": {"content": paragraph.trim().substring(4)}}]
                    }
                });
            } 
            // 리스트 처리
            else if (/^\s*[•\-\*]\s/.test(paragraph)) {
                // 글머리 기호 리스트
                let listItems = paragraph.split(/\n\s*[•\-\*]\s/).filter(item => item.trim());
                
                if (listItems.length === 0 && paragraph.includes('•')) {
                    listItems = paragraph.split('•').slice(1).filter(item => item.trim());
                }
                
                for (const item of listItems) {
                    blocks.push({
                        "object": "block",
                        "type": "bulleted_list_item",
                        "bulleted_list_item": {
                            "rich_text": [{"type": "text", "text": {"content": item.trim()}}]
                        }
                    });
                }
            }
            // 숫자 리스트 처리
            else if (/^\s*\d+\.\s/.test(paragraph)) {
                const listItems = paragraph.split(/\n\s*\d+\.\s/).filter(item => item.trim());
                
                for (const item of listItems) {
                    blocks.push({
                        "object": "block",
                        "type": "numbered_list_item",
                        "numbered_list_item": {
                            "rich_text": [{"type": "text", "text": {"content": item.trim()}}]
                        }
                    });
                }
            }
            // 일반 텍스트
            else {
                blocks.push({
                    "object": "block",
                    "type": "paragraph",
                    "paragraph": {
                        "rich_text": [{"type": "text", "text": {"content": paragraph.trim()}}]
                    }
                });
            }
        }
        
        return blocks;
    },
    
    // 질문-응답 쌍을 지정된 형식으로 변환하여 노션 블록을 생성
    generateFormattedContent: function(query, response, formatType = "blog") {
        const blocks = [];
        
        // 형식에 따라 다른 포맷팅 적용
        if (formatType === "qa") {
            // 질문-답변 형식
            blocks.push({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": `Q: ${query}`}}]
                }
            });
            
            // 구분선 추가
            blocks.push({
                "object": "block",
                "type": "divider",
                "divider": {}
            });
            
            // 답변 추가
            blocks.push(...this.convertToNotionBlocks(response));
            
        } else if (formatType === "blog") {
            // 블로그 포스트 형식
            blocks.push({
                "object": "block",
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [{"type": "text", "text": {"content": query}}]
                }
            });
            
            // 소개 문구
            blocks.push({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": "다음은 AI 어시스턴트가 제공한 정보를 기반으로 작성된 글입니다."}}]
                }
            });
            
            // 구분선 추가
            blocks.push({
                "object": "block",
                "type": "divider",
                "divider": {}
            });
            
            // 내용 추가
            blocks.push(...this.convertToNotionBlocks(response));
            
        } else if (formatType === "summary") {
            // 요약 형식
            blocks.push({
                "object": "block",
                "type": "heading_2",
                "heading_2": {
                    "rich_text": [{"type": "text", "text": {"content": "요약"}}]
                }
            });
            
            // 원본 질문
            blocks.push({
                "object": "block",
                "type": "paragraph",
                "paragraph": {
                    "rich_text": [{"type": "text", "text": {"content": `원본 질문: ${query}`}}]
                }
            });
            
            // 구분선 추가
            blocks.push({
                "object": "block",
                "type": "divider",
                "divider": {}
            });
            
            // 내용 추가
            blocks.push(...this.convertToNotionBlocks(response));
            
        } else if (formatType === "guide") {
            // 가이드 형식
            blocks.push({
                "object": "block",
                "type": "heading_1",
                "heading_1": {
                    "rich_text": [{"type": "text", "text": {"content": `가이드: ${query}`}}]
                }
            });
            
            // 소개 문구
            blocks.push({
                "object": "block",
                "type": "callout",
                "callout": {
                    "rich_text": [{"type": "text", "text": {"content": "이 가이드는 AI 어시스턴트가 제공한 정보를 기반으로 작성되었습니다."}}],
                    "icon": {"emoji": "💡"}
                }
            });
            
            // 내용 추가
            blocks.push(...this.convertToNotionBlocks(response));
            
            // 참고 사항
            blocks.push({
                "object": "block",
                "type": "callout",
                "callout": {
                    "rich_text": [{"type": "text", "text": {"content": "이 정보는 참고용으로만 사용하세요."}}],
                    "icon": {"emoji": "ℹ️"}
                }
            });
            
        } else {
            // 기본 형식 (그대로 추가)
            blocks.push(...this.convertToNotionBlocks(response));
        }
        
        return blocks;
    }
};

// 페이지 로드 시 노션 링크 로드
document.addEventListener('DOMContentLoaded', () => {
    NotionManager.loadLinks();
});