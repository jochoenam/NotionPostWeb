/**
 * NotionPost Web - 템플릿 관리 JavaScript 파일
 * 템플릿 저장, 불러오기, 적용, 삭제 등의 기능 담당
 */

const TemplateManager = {
    // 템플릿 저장소 키
    STORAGE_KEY: 'notionpost_templates',
    
    // 저장된 템플릿 목록 가져오기
    getTemplates: function() {
        const templatesJSON = localStorage.getItem(this.STORAGE_KEY);
        return templatesJSON ? JSON.parse(templatesJSON) : [];
    },
    
    // 템플릿 저장하기
    saveTemplateToStorage: function(templates) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
    },
    
    // 템플릿 목록 로드
    loadTemplates: function() {
        const templates = this.getTemplates();
        const listbox = APP.elements.templateListbox;
        
        // 목록 초기화 전에 요소 확인
        if (!listbox) {
            console.error('템플릿 목록 요소(templateListbox)를 찾을 수 없습니다.');
            return; // 요소가 없으면 함수 종료
        }
        
        // 목록 초기화
        listbox.innerHTML = '';
        
        // 템플릿 추가
        templates.forEach(template => {
            const option = document.createElement('option');
            option.textContent = template.name;
            option.value = template.name;
            listbox.appendChild(option);
        });
    },
    
    // 템플릿 저장
    saveTemplate: function() {
        const templateName = APP.elements.templateName.value.trim();
        if (!templateName) {
            UI.showAlert('템플릿 이름을 입력해주세요.');
            return;
        }
        
        const content = APP.elements.templateContent.value.trim();
        if (!content) {
            UI.showAlert('템플릿 내용을 입력해주세요.');
            return;
        }
        
        // 기존 템플릿 목록 불러오기
        let templates = this.getTemplates();
        
        // 동일한 이름의 템플릿이 있는지 확인
        const existingIndex = templates.findIndex(t => t.name === templateName);
        
        // 템플릿 데이터 생성
        const templateData = {
            name: templateName,
            content: content,
            created_at: new Date().toISOString()
        };
        
        // 기존 템플릿 업데이트 또는 새로 추가
        if (existingIndex !== -1) {
            UI.showConfirm(`'${templateName}' 템플릿이 이미 존재합니다. 덮어쓰시겠습니까?`, () => {
                templates[existingIndex] = templateData;
                this.saveTemplateToStorage(templates);
                this.loadTemplates();
                UI.updateStatus(`템플릿 '${templateName}' 업데이트 완료`);
                UI.showAlert(`템플릿 '${templateName}'이(가) 업데이트되었습니다.`);
            });
        } else {
            templates.push(templateData);
            this.saveTemplateToStorage(templates);
            this.loadTemplates();
            UI.updateStatus(`템플릿 '${templateName}' 저장 완료`);
            UI.showAlert(`템플릿 '${templateName}'이(가) 저장되었습니다.`);
        }
    },
    
    // 현재 내용을 템플릿 편집기로 가져오기
    loadCurrentToTemplate: function() {
        const title = APP.elements.titleEntry.value;
        const content = APP.elements.contentText.value.trim();
        
        if (!title && !content) {
            UI.showAlert('현재 내용이 비어있습니다.');
            return;
        }
        
        if (title && !APP.elements.templateName.value) {
            APP.elements.templateName.value = title;
        }
        
        APP.elements.templateContent.value = content;
        
        UI.updateStatus('현재 내용을 템플릿 편집기로 가져왔습니다.');
    },
    
    // 선택한 템플릿 적용
    applyTemplate: function() {
        const listbox = APP.elements.templateListbox;
        if (listbox.selectedIndex === -1) {
            UI.showAlert('템플릿을 선택해주세요.');
            return;
        }
        
        const templateName = listbox.options[listbox.selectedIndex].value;
        const templates = this.getTemplates();
        const template = templates.find(t => t.name === templateName);
        
        if (!template) {
            UI.showAlert('선택한 템플릿을 찾을 수 없습니다.');
            return;
        }
        
        // 현재 내용을 지울지 확인
        if (APP.elements.contentText.value.trim()) {
            UI.showConfirm('현재 내용을 템플릿으로 대체하시겠습니까?', () => {
                // 템플릿 내용 적용
                APP.elements.contentText.value = template.content;
                
                // 제목 변경
                if (!APP.elements.titleEntry.value && template.name) {
                    APP.elements.titleEntry.value = template.name;
                }
                
                // 미리보기 업데이트
                ContentManager.refreshPreview();
                
                UI.updateStatus(`템플릿 '${templateName}' 적용 완료`);
            });
        } else {
            // 내용이 없으면 바로 적용
            APP.elements.contentText.value = template.content;
            
            // 제목 변경
            if (!APP.elements.titleEntry.value && template.name) {
                APP.elements.titleEntry.value = template.name;
            }
            
            // 미리보기 업데이트
            ContentManager.refreshPreview();
            
            UI.updateStatus(`템플릿 '${templateName}' 적용 완료`);
        }
    },
    
    // 선택한 템플릿 삭제
    deleteTemplate: function() {
        const listbox = APP.elements.templateListbox;
        if (listbox.selectedIndex === -1) {
            UI.showAlert('템플릿을 선택해주세요.');
            return;
        }
        
        const templateName = listbox.options[listbox.selectedIndex].value;
        
        UI.showConfirm(`템플릿 '${templateName}'을(를) 삭제하시겠습니까?`, () => {
            const templates = this.getTemplates();
            const filteredTemplates = templates.filter(t => t.name !== templateName);
            
            this.saveTemplateToStorage(filteredTemplates);
            this.loadTemplates();
            
            UI.updateStatus(`템플릿 '${templateName}' 삭제 완료`);
        });
    }
};