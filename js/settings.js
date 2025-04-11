/**
 * NotionPost Web - 설정 관리 JavaScript 파일
 * 앱 설정 저장, 불러오기 등의 기능 담당
 */

const SettingsManager = {
    // 설정 저장소 키
    STORAGE_KEY: 'notionPostConfig',
    
    // 설정 저장
    saveSettings: function() {
        const config = {
            token: APP.elements.notionToken.value,
            database_id: APP.elements.notionDatabaseId.value,
            format: APP.elements.formatCombo.value,
            category: APP.elements.categoryEntry.value,
            tags: APP.elements.tagsEntry.value.split(',').map(tag => tag.trim()).filter(tag => tag),
            gemini_api_key: APP.elements.geminiApiKey.value,
            autoSave: APP.elements.autoSaveCheckbox.checked,
            autoPreview: APP.elements.autoPreviewCheckbox.checked
        };
        
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
            
            // 앱 상태 업데이트
            APP.api.notionToken = config.token;
            APP.api.notionDatabaseId = config.database_id;
            APP.api.geminiApiKey = config.gemini_api_key;
            APP.state.autoSave = config.autoSave;
            APP.state.autoPreview = config.autoPreview;
            
            // 자동 저장 설정 업데이트
            if (config.autoSave) {
                APP.startAutoSave();
            } else {
                APP.stopAutoSave();
            }
            
            // 자동 미리보기 설정 업데이트 (페이지 새로고침 필요)
            
            UI.showAlert('설정이 저장되었습니다.');
            UI.updateStatus('설정 저장 완료');
        } catch (error) {
            UI.showAlert(`설정 저장 중 오류가 발생했습니다: ${error.message || error}`);
            UI.updateStatus('설정 저장 실패');
        }
    },
    
    // 설정 로드
    loadSettings: function() {
        const configJSON = localStorage.getItem(this.STORAGE_KEY);
        if (!configJSON) return null;
        
        try {
            return JSON.parse(configJSON);
        } catch (error) {
            console.error('설정 파싱 오류:', error);
            return null;
        }
    },
    
    // 설정 초기화
    resetSettings: function() {
        UI.showConfirm('모든 설정을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.', () => {
            const defaultConfig = {
                token: '',
                database_id: '',
                format: 'blog',
                category: 'AI',
                tags: ['AI', 'Gemini', '자동화'],
                gemini_api_key: 'AIzaSyCtwyzmDuhb6j177sA26JL6P3K2-pOJ5OQ',
                autoSave: true,
                autoPreview: true
            };
            
            // UI 업데이트
            APP.elements.notionToken.value = defaultConfig.token;
            APP.elements.notionDatabaseId.value = defaultConfig.database_id;
            APP.elements.formatCombo.value = defaultConfig.format;
            APP.elements.categoryEntry.value = defaultConfig.category;
            APP.elements.tagsEntry.value = defaultConfig.tags.join(',');
            APP.elements.geminiApiKey.value = defaultConfig.gemini_api_key;
            APP.elements.autoSaveCheckbox.checked = defaultConfig.autoSave;
            APP.elements.autoPreviewCheckbox.checked = defaultConfig.autoPreview;
            
            // 설정 저장
            this.saveSettings();
            
            UI.updateStatus('설정이 초기화되었습니다.');
        });
    },
    
    // 데이터 내보내기
    exportData: function() {
        try {
            const exportData = {
                config: this.loadSettings(),
                templates: TemplateManager.getTemplates(),
                history: HistoryManager.getHistory()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
            
            const exportFileName = `notionpost_export_${new Date().toISOString().slice(0, 10)}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileName);
            linkElement.style.display = 'none';
            
            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
            
            UI.updateStatus('데이터 내보내기 완료');
        } catch (error) {
            UI.showAlert(`데이터 내보내기 중 오류가 발생했습니다: ${error.message || error}`);
            UI.updateStatus('데이터 내보내기 실패');
        }
    },
    
    // 데이터 가져오기
    importData: function(file) {
        if (!file) {
            UI.showAlert('가져올 파일을 선택해주세요.');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importData = JSON.parse(e.target.result);
                
                // 유효성 검사
                if (!importData.config && !importData.templates && !importData.history) {
                    UI.showAlert('유효하지 않은 파일 형식입니다.');
                    return;
                }
                
                UI.showConfirm('기존 데이터를 모두 덮어쓰게 됩니다. 계속하시겠습니까?', () => {
                    // 설정 가져오기
                    if (importData.config) {
                        localStorage.setItem(SettingsManager.STORAGE_KEY, JSON.stringify(importData.config));
                    }
                    
                    // 템플릿 가져오기
                    if (importData.templates) {
                        localStorage.setItem(TemplateManager.STORAGE_KEY, JSON.stringify(importData.templates));
                        TemplateManager.loadTemplates();
                    }
                    
                    // 히스토리 가져오기
                    if (importData.history) {
                        localStorage.setItem(HistoryManager.STORAGE_KEY, JSON.stringify(importData.history));
                        HistoryManager.loadHistoryList();
                    }
                    
                    UI.showAlert('데이터 가져오기가 완료되었습니다. 페이지를 새로고침합니다.');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1500);
                });
            } catch (error) {
                UI.showAlert(`데이터 가져오기 중 오류가 발생했습니다: ${error.message || error}`);
                UI.updateStatus('데이터 가져오기 실패');
            }
        };
        
        reader.readAsText(file);
    }
};

// 설정 페이지에 추가 기능 버튼 추가
document.addEventListener('DOMContentLoaded', () => {
    // 설정 저장 프레임에 버튼 추가
    const settingsSaveFrame = document.querySelector('.settings-save-frame');
    
    if (settingsSaveFrame) {
        // 설정 초기화 버튼
        const resetButton = document.createElement('button');
        resetButton.id = 'reset-settings-btn';
        resetButton.className = 'normal-btn';
        resetButton.textContent = '설정 초기화';
        resetButton.style.marginRight = '10px';
        resetButton.addEventListener('click', () => {
            SettingsManager.resetSettings();
        });
        
        // 데이터 내보내기 버튼
        const exportButton = document.createElement('button');
        exportButton.id = 'export-data-btn';
        exportButton.className = 'normal-btn';
        exportButton.textContent = '데이터 내보내기';
        exportButton.style.marginRight = '10px';
        exportButton.addEventListener('click', () => {
            SettingsManager.exportData();
        });
        
        // 데이터 가져오기 버튼 및 파일 입력
        const importInput = document.createElement('input');
        importInput.type = 'file';
        importInput.id = 'import-data-input';
        importInput.accept = '.json';
        importInput.style.display = 'none';
        
        const importButton = document.createElement('button');
        importButton.id = 'import-data-btn';
        importButton.className = 'normal-btn';
        importButton.textContent = '데이터 가져오기';
        importButton.addEventListener('click', () => {
            importInput.click();
        });
        
        importInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                SettingsManager.importData(e.target.files[0]);
            }
        });
        
        // 버튼 추가
        settingsSaveFrame.insertBefore(resetButton, settingsSaveFrame.firstChild);
        settingsSaveFrame.insertBefore(exportButton, settingsSaveFrame.firstChild);
        settingsSaveFrame.insertBefore(importButton, settingsSaveFrame.firstChild);
        settingsSaveFrame.insertBefore(importInput, settingsSaveFrame.firstChild);
    }
});