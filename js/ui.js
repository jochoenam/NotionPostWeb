/**
 * NotionPost Web - UI 관련 JavaScript 파일
 * 사용자 인터페이스 조작 및 표시 담당
 */

const UI = {
    // 탭 전환
    switchTab: function(tabName) {
        // 모든 탭 버튼 비활성화
        APP.elements.tabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 모든 탭 패널 숨기기
        APP.elements.tabPanes.forEach(pane => {
            pane.classList.remove('active');
        });
        
        // 선택한 탭 버튼 활성화
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`).classList.add('active');
        
        // 선택한 탭 패널 표시
        document.getElementById(`${tabName}-tab`).classList.add('active');
    },
    
    // 도구 탭 전환
    switchToolTab: function(toolTabName) {
        // 모든 도구 탭 버튼 비활성화
        APP.elements.toolTabButtons.forEach(btn => {
            btn.classList.remove('active');
        });
        
        // 모든 도구 탭 패널 숨기기
        APP.elements.toolTabPanes.forEach(pane => {
            pane.classList.remove('active');
        });
        
        // 선택한 도구 탭 버튼 활성화
        document.querySelector(`.tool-tab-btn[data-tool-tab="${toolTabName}"]`).classList.add('active');
        
        // 선택한 도구 탭 패널 표시
        document.getElementById(toolTabName).classList.add('active');
    },
    
    // 상태 메시지 업데이트
    updateStatus: function(message) {
        APP.elements.statusMessage.textContent = message;
        
        // 3초 후 메시지 지우기 (옵션)
        /*
        setTimeout(() => {
            if (APP.elements.statusMessage.textContent === message) {
                APP.elements.statusMessage.textContent = '준비 완료';
            }
        }, 3000);
        */
    },
    
    // 로딩 스피너 표시
    showLoading: function(message = '처리 중...') {
        APP.elements.loadingMessage.textContent = message;
        APP.elements.loadingSpinner.style.display = 'flex';
    },
    
    // 로딩 스피너 숨기기
    hideLoading: function() {
        APP.elements.loadingSpinner.style.display = 'none';
    },
    
    // 모달 대화상자 표시
    showModal: function(title, message, confirmCallback, cancelCallback = null) {
        APP.elements.modalTitle.textContent = title;
        APP.elements.modalMessage.textContent = message;
        
        // 확인 버튼 이벤트 리스너 설정
        const oldConfirmListener = APP.elements.modalConfirmBtn.onclick;
        if (oldConfirmListener) {
            APP.elements.modalConfirmBtn.removeEventListener('click', oldConfirmListener);
        }
        
        APP.elements.modalConfirmBtn.onclick = function() {
            if (confirmCallback) confirmCallback();
            UI.closeModal();
        };
        
        // 취소 버튼 이벤트 리스너 설정
        const oldCancelListener = APP.elements.modalCancelBtn.onclick;
        if (oldCancelListener) {
            APP.elements.modalCancelBtn.removeEventListener('click', oldCancelListener);
        }
        
        if (cancelCallback) {
            APP.elements.modalCancelBtn.style.display = 'inline-block';
            APP.elements.modalCancelBtn.onclick = function() {
                cancelCallback();
                UI.closeModal();
            };
        } else {
            APP.elements.modalCancelBtn.style.display = 'none';
        }
        
        // 모달 표시
        APP.elements.modal.style.display = 'block';
    },
    
    // 모달 대화상자 닫기
    closeModal: function() {
        APP.elements.modal.style.display = 'none';
    },
    
    // 알림 표시 (간단한 모달)
    showAlert: function(message) {
        this.showModal('알림', message, null);
    },
    
    // 확인 대화상자 표시
    showConfirm: function(message, confirmCallback) {
        this.showModal('확인', message, confirmCallback, () => {});
    },
    
    // 도움말 표시
    showHelp: function(helpType) {
        let title = '';
        let message = '';
        
        switch (helpType) {
            case 'token':
                title = 'Notion API 토큰 안내';
                message = '노션 API 토큰 얻는 방법:\n\n' +
                          '1. https://www.notion.so/my-integrations 방문\n' +
                          '2. \'새 통합 만들기\' 클릭\n' +
                          '3. 통합 이름 설정 (예: \'내 포스팅 앱\')\n' +
                          '4. 권한 설정: \'Read content\', \'Update content\', \'Insert content\' 선택\n' +
                          '5. 생성 후 표시되는 \'비밀 키\'를 복사하여 여기에 붙여넣기';
                break;
            case 'database':
                title = '노션 데이터베이스 ID 안내';
                message = '노션 데이터베이스 ID 찾는 방법:\n\n' +
                          '1. 노션에서 데이터베이스 페이지 열기\n' +
                          '2. 웹 브라우저 주소 확인\n' +
                          '3. https://www.notion.so/workspace/[데이터베이스ID]?v=... 형식에서\n' +
                          '   [데이터베이스ID] 부분을 복사 (32자리 문자열, \'-\' 포함 가능)\n\n' +
                          '중요: 데이터베이스와 통합 앱을 연결해야 합니다!\n' +
                          '- 데이터베이스 페이지 오른쪽 상단 \'...\' 클릭\n' +
                          '- \'연결 추가\' 선택\n' +
                          '- 내 통합 앱 선택';
                break;
            case 'gemini':
                title = 'Gemini API 키 안내';
                message = 'Gemini API 키 얻는 방법:\n\n' +
                          '1. https://aistudio.google.com/app/apikey 방문\n' +
                          '2. Google 계정으로 로그인\n' +
                          '3. \'키 생성\' 또는 \'새 API 키 만들기\' 클릭\n' +
                          '4. 생성된 API 키를 복사하여 여기에 붙여넣기';
                break;
            case 'pageId':
                title = '페이지 ID 안내';
                message = '새 데이터베이스를 생성할 페이지의 ID 찾는 방법:\n\n' +
                          '1. 노션에서 빈 페이지를 생성하거나 기존 페이지 선택\n' +
                          '2. 웹 브라우저 주소 확인\n' +
                          '3. https://www.notion.so/페이지명-[페이지ID] 형식에서\n' +
                          '   [페이지ID] 부분 복사 (32자리 문자열, \'-\' 포함 가능)\n\n' +
                          '중요: 데이터베이스를 생성할 페이지는 통합 앱과 공유되어야 합니다!\n' +
                          '- 페이지 오른쪽 상단 \'...\' 클릭\n' +
                          '- \'연결 추가\' 선택\n' +
                          '- 내 통합 앱 선택';
                break;
            default:
                title = '도움말';
                message = '알 수 없는 도움말 유형입니다.';
        }
        
        this.showModal(title, message, null);
    },
    
    // 미리보기 업데이트
    updatePreview: function(content) {
        // 메인 탭 미리보기
        APP.elements.previewText.value = content;
        
        // 미리보기 탭
        APP.elements.fullPreviewText.value = content;
        
        // 제목 업데이트
        const title = APP.elements.titleEntry.value;
        APP.elements.previewTitle.value = title;
        
        this.updateStatus('미리보기가 업데이트되었습니다.');
    }
};

// 콘텐츠 관리 객체
const ContentManager = {
    // 내용 지우기
    clearContent: function() {
        UI.showConfirm('현재 입력된 내용을 모두 지우시겠습니까?', () => {
            APP.elements.titleEntry.value = '';
            APP.elements.contentText.value = '';
            UI.updateStatus('내용이 지워졌습니다.');
        });
    },
    
    // 미리보기 새로고침
    refreshPreview: function() {
        const title = APP.elements.titleEntry.value;
        const content = APP.elements.contentText.value.trim();
        UI.updatePreview(content);
    },
    
    // Gemini AI로 콘텐츠 생성
    generateContent: function() {
        // 필수 정보 확인
        const apiKey = APP.elements.geminiApiKey.value;
        if (!apiKey) {
            UI.showAlert('Gemini API 키를 입력해주세요.');
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
        
        // 생성 작업 시작
        UI.updateStatus('Gemini AI로 콘텐츠 생성 중...');
        UI.showLoading('Gemini AI로 콘텐츠 생성 중...');
        
        GeminiManager.generateContent(title, content, apiKey)
            .then(response => {
                // 히스토리에 저장
                HistoryManager.saveToHistory(title, response);
                
                // 결과를 에디터에 채우기
                APP.elements.contentText.value = response;
                
                // 미리보기 업데이트
                UI.updatePreview(response);
                
                // 미리보기 탭으로 이동
                UI.switchTab('preview');
                
                UI.updateStatus('콘텐츠 생성 완료');
            })
            .catch(error => {
                UI.showAlert(`콘텐츠 생성 중 오류가 발생했습니다: ${error.message || error}`);
                UI.updateStatus('오류 발생');
            })
            .finally(() => {
                UI.hideLoading();
            });
    },
    
    // 자동 저장
    autoSave: function() {
        const title = APP.elements.titleEntry.value;
        const content = APP.elements.contentText.value.trim();
        
        if (title || content) {
            const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').substring(0, 14);
            const autoSaveData = {
                title: title,
                content: content,
                timestamp: timestamp,
                saved_at: new Date().toISOString()
            };
            
            try {
                // indexedDB에 저장
                localStorage.setItem(`autosave_${timestamp}`, JSON.stringify(autoSaveData));
                
                // 상태 업데이트 (조용히)
                UI.updateStatus('자동 저장됨');
                setTimeout(() => {
                    if (APP.elements.statusMessage.textContent === '자동 저장됨') {
                        UI.updateStatus('준비');
                    }
                }, 3000);
            } catch (e) {
                console.error('자동 저장 오류:', e);
            }
        }
    }
};