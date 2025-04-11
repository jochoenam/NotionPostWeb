/**
 * NotionPost Web - 히스토리 관리 JavaScript 파일
 * 히스토리 저장, 불러오기, 검색 등의 기능 담당
 */

const HistoryManager = {
    // 히스토리 저장소 키
    STORAGE_KEY: 'notionpost_history',
    
    // 저장된 히스토리 목록 가져오기
    getHistory: function() {
        const historyJSON = localStorage.getItem(this.STORAGE_KEY);
        return historyJSON ? JSON.parse(historyJSON) : [];
    },
    
    // 히스토리 저장하기
    saveHistoryToStorage: function(history) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    },
    
    // 히스토리에 저장
    saveToHistory: function(title, content) {
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '').substring(0, 14);
        
        // 히스토리 데이터 생성
        const historyData = {
            title: title,
            content: content,
            timestamp: timestamp,
            created_at: new Date().toISOString()
        };
        
        // 기존 히스토리 목록 불러오기
        let history = this.getHistory();
        
        // 새 히스토리 추가
        history.push(historyData);
        
        // 저장
        this.saveHistoryToStorage(history);
        
        // 목록 업데이트
        this.loadHistoryList();
    },
    
    // 히스토리 목록 로드
    loadHistoryList: function() {
        const history = this.getHistory();
        const listbox = APP.elements.historyListbox;
        
        // 목록 초기화 전에 요소 확인
        if (!listbox) {
            console.error('히스토리 목록 요소(historyListbox)를 찾을 수 없습니다.');
            return; // 요소가 없으면 함수 종료
        }
        
        // 목록 초기화
        listbox.innerHTML = '';
        
        // 최신순으로 정렬
        history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 히스토리 추가
        history.forEach(item => {
            const option = document.createElement('option');
            const date = new Date(item.created_at);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            option.textContent = `${formattedDate} - ${item.title}`;
            option.value = item.timestamp;
            listbox.appendChild(option);
        });
    },
    
    // 히스토리 검색
    searchHistory: function() {
        const searchTerm = APP.elements.searchEntry.value.toLowerCase();
        const history = this.getHistory();
        const listbox = APP.elements.historyListbox;
        
        // 목록 초기화
        listbox.innerHTML = '';
        
        // 검색어가 없으면 전체 목록 로드
        if (!searchTerm) {
            this.loadHistoryList();
            return;
        }
        
        // 최신순으로 정렬
        history.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 검색 결과 필터링
        const filteredHistory = history.filter(item => 
            item.title.toLowerCase().includes(searchTerm) || 
            item.content.toLowerCase().includes(searchTerm)
        );
        
        // 결과 추가
        filteredHistory.forEach(item => {
            const option = document.createElement('option');
            const date = new Date(item.created_at);
            const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
            option.textContent = `${formattedDate} - ${item.title}`;
            option.value = item.timestamp;
            listbox.appendChild(option);
        });
        
        UI.updateStatus(`검색 결과: ${filteredHistory.length}개 항목 찾음`);
    },
    
    // 히스토리 미리보기 업데이트
    updateHistoryPreview: function(historyItem) {
        if (!historyItem) {
            APP.elements.historyPreview.value = '';
            return;
        }
        
        APP.elements.historyPreview.value = `제목: ${historyItem.title}\n\n${historyItem.content}`;
    },
    
    // 선택한 히스토리 불러오기
    loadHistory: function() {
        const listbox = APP.elements.historyListbox;
        if (listbox.selectedIndex === -1) {
            UI.showAlert('히스토리를 선택해주세요.');
            return;
        }
        
        const timestamp = listbox.options[listbox.selectedIndex].value;
        const history = this.getHistory();
        const historyItem = history.find(h => h.timestamp === timestamp);
        
        if (!historyItem) {
            UI.showAlert('선택한 히스토리를 찾을 수 없습니다.');
            return;
        }
        
        // 현재 내용을 지울지 확인
        if (APP.elements.contentText.value.trim()) {
            UI.showConfirm('현재 내용을 히스토리로 대체하시겠습니까?', () => {
                // 히스토리 내용 적용
                APP.elements.titleEntry.value = historyItem.title;
                APP.elements.contentText.value = historyItem.content;
                
                // 미리보기 업데이트
                ContentManager.refreshPreview();
                
                // 히스토리 미리보기 업데이트
                this.updateHistoryPreview(historyItem);
                
                UI.updateStatus(`히스토리 '${new Date(historyItem.created_at).toLocaleString()}' 불러오기 완료`);
            });
        } else {
            // 내용이 없으면 바로 적용
            APP.elements.titleEntry.value = historyItem.title;
            APP.elements.contentText.value = historyItem.content;
            
            // 미리보기 업데이트
            ContentManager.refreshPreview();
            
            // 히스토리 미리보기 업데이트
            this.updateHistoryPreview(historyItem);
            
            UI.updateStatus(`히스토리 '${new Date(historyItem.created_at).toLocaleString()}' 불러오기 완료`);
        }
    },
    
    // 선택한 히스토리 삭제
    deleteHistory: function() {
        const listbox = APP.elements.historyListbox;
        if (listbox.selectedIndex === -1) {
            UI.showAlert('히스토리를 선택해주세요.');
            return;
        }
        
        const timestamp = listbox.options[listbox.selectedIndex].value;
        const selectedText = listbox.options[listbox.selectedIndex].text;
        
        UI.showConfirm(`히스토리 '${selectedText}'을(를) 삭제하시겠습니까?`, () => {
            const history = this.getHistory();
            const filteredHistory = history.filter(h => h.timestamp !== timestamp);
            
            this.saveHistoryToStorage(filteredHistory);
            this.loadHistoryList();
            
            // 히스토리 미리보기 지우기
            APP.elements.historyPreview.value = '';
            
            UI.updateStatus(`히스토리 '${selectedText}' 삭제 완료`);
        });
    },
    
    // 선택한 히스토리 미리보기
    previewHistory: function() {
        const listbox = APP.elements.historyListbox;
        if (listbox.selectedIndex === -1) {
            APP.elements.historyPreview.value = '';
            return;
        }
        
        const timestamp = listbox.options[listbox.selectedIndex].value;
        const history = this.getHistory();
        const historyItem = history.find(h => h.timestamp === timestamp);
        
        if (historyItem) {
            this.updateHistoryPreview(historyItem);
        }
    }
};

// 히스토리 리스트박스 선택 이벤트 리스너 추가
document.addEventListener('DOMContentLoaded', () => {
    const historyListbox = document.getElementById('history-listbox');
    
    // 요소가 없으면 이벤트 리스너 추가하지 않음
    if (!historyListbox) {
        console.error('히스토리 목록 요소(history-listbox)를 찾을 수 없습니다.');
        return;
    }
    
    historyListbox.addEventListener('change', () => {
        HistoryManager.previewHistory();
    });
});