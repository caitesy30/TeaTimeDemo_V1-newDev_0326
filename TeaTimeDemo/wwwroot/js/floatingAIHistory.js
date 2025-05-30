// wwwroot/js/floatingAIHistory.js
// 功能：歷史訊息顯示/隱藏，隱藏後按鈕浮到AI對話框（mainBox）左上角！
class FloatingAIHistory {
    static historyDiv = null;
    static toggleBtn = null;
    static visible = true;
    static init() {
        // 歷史訊息區
        this.historyDiv = document.createElement('div');
        Object.assign(this.historyDiv.style, {
            width: '240px', minWidth: '0', padding: '8px', backgroundColor: '#f7f7f7',
            overflowY: 'auto', height: '100%', boxSizing: 'border-box', position: 'relative'
        });
        // 隱藏/顯示SVG按鈕
        this.toggleBtn = document.createElement('div');
        this.toggleBtn.title = '隱藏歷史對話區';
        this.toggleBtn.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24">
            <g>
                <ellipse cx="12" cy="12" rx="9" ry="7" fill="#4fc3f7" stroke="#0288d1" stroke-width="2"/>
                <path d="M3 3l18 18" stroke="#f44336" stroke-width="2" fill="none"/>
                <circle cx="12" cy="12" r="3.5" fill="#fff176" stroke="#fbc02d" stroke-width="2"/>
            </g>
        </svg>`;
        Object.assign(this.toggleBtn.style, {
            position: 'absolute', top: '8px', left: '8px', width: '32px', height: '32px', background: 'transparent',
            border: 'none', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: '1002', padding: '0'
        });
        this.toggleBtn.onclick = () => this.toggle();
        this.historyDiv.appendChild(this.toggleBtn);

        // 插入到主內容
        setTimeout(() => {
            if (window.FloatingAIMain && window.FloatingAIMain.mainWrap)
                FloatingAIMain.mainWrap.insertBefore(this.historyDiv, FloatingAIMain.mainWrap.firstChild);
        }, 200);
    }
    // 隱藏時把按鈕移到主對話框（mainBox）左上角！
    static toggle() {
        this.visible = !this.visible;
        if (!this.visible) {
            this.historyDiv.style.display = 'none';
            this.toggleBtn.style.position = 'absolute';
            this.toggleBtn.style.top = '8px';
            this.toggleBtn.style.left = '8px';
            this.toggleBtn.style.zIndex = '1002';
            // **移到主對話框左上角！**
            if (window.FloatingAIMain && window.FloatingAIMain.mainBox)
                window.FloatingAIMain.mainBox.appendChild(this.toggleBtn);
            this.toggleBtn.title = '顯示歷史對話區';
        } else {
            this.historyDiv.style.display = '';
            this.toggleBtn.style.position = 'absolute';
            this.toggleBtn.style.top = '4px';
            this.toggleBtn.style.left = '4px';
            this.toggleBtn.style.zIndex = '10';
            this.toggleBtn.title = '隱藏歷史對話區';
            this.historyDiv.appendChild(this.toggleBtn);
        }
    }
}
window.FloatingAIHistory = FloatingAIHistory;
