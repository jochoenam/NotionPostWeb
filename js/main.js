/**
 * NotionPost Web - 메인 JavaScript 파일
 * 앱의 초기화 및 기본 기능 담당
 */

// 전역 변수
const APP = {
    // 앱 초기 상태
    state: {
        autoSave: true,
        autoPreview: true,
        currentTemplateIndex: -1,
        currentHistoryIndex: -1,
        autoSaveTimerId: null
    },
    
    // API 토큰 및 키
    api: {
        notionToken: '',
        notionDatabaseId: '',
        geminiApiKey: ''
    },
    
    // DOM 요소 참조
    elements: {},
    
    // 앱 초기화
    init: function() {
        this.initElements();  // DOM 요소를 먼저 초기화
        this.loadConfig();    // 그 다음 설정 로드
        this.initEventListeners();
        this.hideSplashScreen();
        this.startAutoSave();
        
        // 상태 메시지 표시
        UI.updateStatus('준비 완료. Gemini AI 및 Notion과 연동하여 콘텐츠를 관리하세요.');
    },
    
    // 설정 로드
    loadConfig: function() {
        const config = localStorage.getItem('notionPostConfig');
        if (config) {
            try {
                const parsedConfig = JSON.parse(config);
                this.api.notionToken = parsedConfig.token || this.api.notionToken;
                this.api.notionDatabaseId = parsedConfig.database_id || this.api.notionDatabaseId;
                this.api.geminiApiKey = parsedConfig.gemini_api_key || this.api.geminiApiKey;
                
                this.state.autoSave = parsedConfig.autoSave !== undefined ? parsedConfig.autoSave : true;
                this.state.autoPreview = parsedConfig.autoPreview !== undefined ? parsedConfig.autoPreview : true;

                // API 키 유효성 검사
                if (!this.api.geminiApiKey) {
                    UI.updateStatus('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.', 'warning');
                }
                if (!this.api.notionToken) {
                    UI.updateStatus('Notion 토큰이 설정되지 않았습니다. 설정에서 토큰을 입력해주세요.', 'warning');
                }
            } catch (e) {
                console.error('설정 파싱 오류:', e);
                UI.updateStatus('설정을 불러오는 중 오류가 발생했습니다.', 'error');
            }
        }
        
        // DOM 요소가 초기화된 후에 설정 값 적용
        if (this.elements.notionToken) {
            this.elements.notionToken.value = this.api.notionToken;
            this.elements.notionDatabaseId.value = this.api.notionDatabaseId;
            this.elements.geminiApiKey.value = this.api.geminiApiKey;
        }
    },
    
    // 설정 저장
    saveConfig: function() {
        const config = {
            token: this.api.notionToken,
            database_id: this.api.notionDatabaseId,
            gemini_api_key: this.api.geminiApiKey,
            autoSave: this.state.autoSave,
            autoPreview: this.state.autoPreview
        };
        
        try {
            localStorage.setItem('notionPostConfig', JSON.stringify(config));
            UI.updateStatus('설정이 저장되었습니다.');
            
            // API 키 유효성 검사
            if (!this.api.geminiApiKey) {
                UI.updateStatus('Gemini API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.', 'warning');
            }
            if (!this.api.notionToken) {
                UI.updateStatus('Notion 토큰이 설정되지 않았습니다. 설정에서 토큰을 입력해주세요.', 'warning');
            }
        } catch (e) {
            console.error('설정 저장 오류:', e);
            UI.updateStatus('설정을 저장하는 중 오류가 발생했습니다.', 'error');
        }
    },
    
    // DOM 요소 초기화
    initElements: function() {
        // 탭 관련 요소
        this.elements.tabButtons = document.querySelectorAll('.tab-btn');
        this.elements.tabPanes = document.querySelectorAll('.tab-pane');
        this.elements.toolTabButtons = document.querySelectorAll('.tool-tab-btn');
        this.elements.toolTabPanes = document.querySelectorAll('.tool-tab-pane');
        
        // 주요 입력 요소
        this.elements.titleEntry = document.getElementById('title-entry');
        this.elements.contentText = document.getElementById('content-text');
        this.elements.previewText = document.getElementById('preview-text');
        this.elements.fullPreviewText = document.getElementById('full-preview-text');
        this.elements.previewTitle = document.getElementById('preview-title');
        
        // 형식 설정 요소
        this.elements.formatCombo = document.getElementById('format-combo');
        this.elements.categoryEntry = document.getElementById('category-entry');
        this.elements.tagsEntry = document.getElementById('tags-entry');
        
        // 버튼 요소
        this.elements.generateBtn = document.getElementById('generate-btn');
        this.elements.clearBtn = document.getElementById('clear-btn');
        this.elements.refreshPreviewBtn = document.getElementById('refresh-preview-btn');
        this.elements.postBtn = document.getElementById('post-btn');
        this.elements.refreshFullPreviewBtn = document.getElementById('refresh-full-preview-btn');
        this.elements.postFromPreviewBtn = document.getElementById('post-from-preview-btn');
        
        // 템플릿 관련 요소
        this.elements.templateListbox = document.getElementById('template-listbox');
        this.elements.templateName = document.getElementById('template-name');
        this.elements.templateContent = document.getElementById('template-content');
        this.elements.applyTemplateBtn = document.getElementById('apply-template-btn');
        this.elements.deleteTemplateBtn = document.getElementById('delete-template-btn');
        this.elements.loadToTemplateBtn = document.getElementById('load-to-template-btn');
        this.elements.saveTemplateBtn = document.getElementById('save-template-btn');
        
        // 히스토리 관련 요소
        this.elements.historyListbox = document.getElementById('history-listbox');
        this.elements.searchEntry = document.getElementById('search-entry');
        this.elements.searchHistoryBtn = document.getElementById('search-history-btn');
        this.elements.loadHistoryBtn = document.getElementById('load-history-btn');
        this.elements.deleteHistoryBtn = document.getElementById('delete-history-btn');
        this.elements.historyPreview = document.getElementById('history-preview');
        
        // 설정 관련 요소
        this.elements.notionToken = document.getElementById('notion-token');
        this.elements.notionDatabaseId = document.getElementById('notion-database-id');
        this.elements.geminiApiKey = document.getElementById('gemini-api-key');
        this.elements.pageId = document.getElementById('page-id');
        this.elements.autoSaveCheckbox = document.getElementById('autosave-checkbox');
        this.elements.autoPreviewCheckbox = document.getElementById('autopreview-checkbox');
        this.elements.saveSettingsBtn = document.getElementById('save-settings-btn');
        this.elements.checkIntegrationBtn = document.getElementById('check-integration-btn');
        this.elements.createDatabaseBtn = document.getElementById('create-database-btn');
        
        // 도움말 버튼
        this.elements.tokenHelpBtn = document.getElementById('token-help-btn');
        this.elements.databaseHelpBtn = document.getElementById('database-help-btn');
        this.elements.geminiHelpBtn = document.getElementById('gemini-help-btn');
        this.elements.pageIdHelpBtn = document.getElementById('page-id-help-btn');
        
        // 상태 및 기타 요소
        this.elements.statusMessage = document.getElementById('status-message');
        this.elements.modal = document.getElementById('modal');
        this.elements.modalTitle = document.getElementById('modal-title');
        this.elements.modalMessage = document.getElementById('modal-message');
        this.elements.modalConfirmBtn = document.getElementById('modal-confirm-btn');
        this.elements.modalCancelBtn = document.getElementById('modal-cancel-btn');
        this.elements.closeModalBtn = document.querySelector('.close-btn');
        this.elements.loadingSpinner = document.getElementById('loading-spinner');
        this.elements.loadingMessage = document.getElementById('loading-message');
        
        // 설정 값 초기화
        this.elements.notionToken.value = this.api.notionToken;
        this.elements.notionDatabaseId.value = this.api.notionDatabaseId;
        this.elements.geminiApiKey.value = this.api.geminiApiKey;
        this.elements.autoSaveCheckbox.checked = this.state.autoSave;
        this.elements.autoPreviewCheckbox.checked = this.state.autoPreview;
    },
    
    // 이벤트 리스너 초기화
    initEventListeners: function() {
        // 탭 전환 이벤트
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabName = button.getAttribute('data-tab');
                UI.switchTab(tabName);
            });
        });
        
        // 도구 탭 전환 이벤트
        this.elements.toolTabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const toolTabName = button.getAttribute('data-tool-tab');
                UI.switchToolTab(toolTabName);
            });
        });
        
        // 버튼 이벤트
        this.elements.generateBtn.addEventListener('click', () => {
            ContentManager.generateContent();
        });
        
        this.elements.clearBtn.addEventListener('click', () => {
            ContentManager.clearContent();
        });
        
        this.elements.refreshPreviewBtn.addEventListener('click', () => {
            ContentManager.refreshPreview();
        });
        
        this.elements.postBtn.addEventListener('click', () => {
            NotionManager.postToNotion();
        });
        
        this.elements.refreshFullPreviewBtn.addEventListener('click', () => {
            ContentManager.refreshPreview();
        });
        
        this.elements.postFromPreviewBtn.addEventListener('click', () => {
            NotionManager.postFromPreview();
        });
        
        // 템플릿 관련 이벤트
        this.elements.applyTemplateBtn.addEventListener('click', () => {
            TemplateManager.applyTemplate();
        });
        
        this.elements.deleteTemplateBtn.addEventListener('click', () => {
            TemplateManager.deleteTemplate();
        });
        
        this.elements.loadToTemplateBtn.addEventListener('click', () => {
            TemplateManager.loadCurrentToTemplate();
        });
        
        this.elements.saveTemplateBtn.addEventListener('click', () => {
            TemplateManager.saveTemplate();
        });
        
        // 히스토리 관련 이벤트
        this.elements.searchHistoryBtn.addEventListener('click', () => {
            HistoryManager.searchHistory();
        });
        
        this.elements.loadHistoryBtn.addEventListener('click', () => {
            HistoryManager.loadHistory();
        });
        
        this.elements.deleteHistoryBtn.addEventListener('click', () => {
            HistoryManager.deleteHistory();
        });
        
        // 설정 관련 이벤트
        this.elements.saveSettingsBtn.addEventListener('click', () => {
            SettingsManager.saveSettings();
        });
        
        this.elements.checkIntegrationBtn.addEventListener('click', () => {
            NotionManager.checkIntegration();
        });
        
        this.elements.createDatabaseBtn.addEventListener('click', () => {
            NotionManager.createDatabase();
        });
        
        // 도움말 버튼 이벤트
        this.elements.tokenHelpBtn.addEventListener('click', () => {
            UI.showHelp('token');
        });
        
        this.elements.databaseHelpBtn.addEventListener('click', () => {
            UI.showHelp('database');
        });
        
        this.elements.geminiHelpBtn.addEventListener('click', () => {
            UI.showHelp('gemini');
        });
        
        this.elements.pageIdHelpBtn.addEventListener('click', () => {
            UI.showHelp('pageId');
        });
        
        // 모달 관련 이벤트
        this.elements.closeModalBtn.addEventListener('click', () => {
            UI.closeModal();
        });
        
        // Enter 키로 검색
        this.elements.searchEntry.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                HistoryManager.searchHistory();
            }
        });
        
        // 자동 미리보기
        if (this.state.autoPreview) {
            this.elements.contentText.addEventListener('input', debounce(() => {
                ContentManager.refreshPreview();
            }, 1000));
        }
    },
    
    // 스플래시 화면 숨기기
    hideSplashScreen: function() {
        setTimeout(() => {
            document.getElementById('splash-screen').style.display = 'none';
            document.getElementById('app-container').style.display = 'block';
        }, 2000);
    },
    
    // 자동 저장 시작
    startAutoSave: function() {
        if (this.state.autoSave) {
            this.state.autoSaveTimerId = setInterval(() => {
                ContentManager.autoSave();
            }, 300000); // 5분마다
        }
    },
    
    // 자동 저장 중지
    stopAutoSave: function() {
        if (this.state.autoSaveTimerId) {
            clearInterval(this.state.autoSaveTimerId);
            this.state.autoSaveTimerId = null;
        }
    }
};

// 디바운스 함수 (연속 호출 방지)
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// 페이지 로드 시 앱 초기화
document.addEventListener('DOMContentLoaded', () => {
    // 앱 초기화를 먼저 수행
    APP.init();
    
    // 앱 초기화 후 템플릿 목록 로드
    TemplateManager.loadTemplates();
    
    // 히스토리 목록 로드
    HistoryManager.loadHistoryList();
});