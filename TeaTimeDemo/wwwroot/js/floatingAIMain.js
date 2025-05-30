// wwwroot/js/FloatingAIMain.js
// 功能：AI主對話窗（右側聊天、AI控制列、輸入區），支援拖拉右下角縮放、LINE風訊息泡泡
class FloatingAIMain {
    static mainBox = null;
    static mainWrap = null;
    static messagesDiv = null;
    static aiAssistBar = null;
    static inputArea = null;
    static sendBtn = null;

    static init() {
        // 主對話框
        this.mainBox = document.createElement('div');
        Object.assign(this.mainBox.style, {
            position: 'relative', width: '600px', height: '400px', backgroundColor: '#fff',
            border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 8px #0002', overflow: 'hidden', display: 'none',
            minWidth: '350px', minHeight: '260px', resize: 'none'
        });

        // ========== 右下角縮放拉柄 ==========
        const resizeHandle = document.createElement('div');
        Object.assign(resizeHandle.style, {
            position: 'absolute', right: '2px', bottom: '2px', width: '26px', height: '26px',
            cursor: 'nwse-resize', background: 'rgba(120,120,120,0.02)', zIndex: 9999,
            borderRadius: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
            userSelect: 'none'
        });
        resizeHandle.innerHTML = `
            <svg width="20" height="20">
                <polyline points="2,18 18,18 18,2" stroke="#999" stroke-width="2" fill="none"/>
                <circle cx="17" cy="17" r="2.5" fill="#1976d2"/>
            </svg>
        `;
        this.mainBox.appendChild(resizeHandle);

        // --- 拉動縮放行為 ---
        let resizing = false, startX, startY, startW, startH;
        resizeHandle.addEventListener('mousedown', e => {
            e.preventDefault(); e.stopPropagation();
            resizing = true;
            startX = e.clientX; startY = e.clientY;
            const rect = this.mainBox.getBoundingClientRect();
            startW = rect.width; startH = rect.height;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', e => {
            if (!resizing) return;
            let newW = Math.max(350, startW + (e.clientX - startX));
            let newH = Math.max(260, startH + (e.clientY - startY));
            this.mainBox.style.width = newW + 'px';
            this.mainBox.style.height = newH + 'px';
            // 同步頭像
            if (window.FloatingAIContainer && FloatingAIContainer.avatarBox)
                FloatingAIContainer.syncAvatarPos();
        });
        document.addEventListener('mouseup', () => {
            if (resizing) {
                resizing = false;
                document.body.style.userSelect = '';
            }
        });

        // ========== 主內容區 ==========
        this.mainWrap = document.createElement('div');
        Object.assign(this.mainWrap.style, {
            display: 'flex', width: '100%', height: 'calc(100% - 44px)', position: 'absolute', top: '44px', left: 0
        });
        this.mainBox.appendChild(this.mainWrap);

        // 右側聊天區
        let rightDiv = document.createElement('div');
        Object.assign(rightDiv.style, {
            display: 'flex', flexDirection: 'column', flex: '1 1 0%', minWidth: 0, height: '100%', position: 'relative'
        });
        this.mainWrap.appendChild(rightDiv);

        // 訊息區
        this.messagesDiv = document.createElement('div');
        Object.assign(this.messagesDiv.style, {
            flex: '1 1 0%', padding: '8px', overflowY: 'auto', fontSize: '0.9em'
        });
        rightDiv.appendChild(this.messagesDiv);

        // AI助教控制列
        this.aiAssistBar = document.createElement('div');
        Object.assign(this.aiAssistBar.style, {
            width: '100%', display: 'none', gap: '10px', margin: '8px 0', justifyContent: 'center'
        });
        rightDiv.appendChild(this.aiAssistBar);

        // 輸入欄
        let inputWrap = document.createElement('div');
        Object.assign(inputWrap.style, {
            display: 'flex', borderTop: '1px solid #eee', flexShrink: '0', background: '#fff'
        });
        this.inputArea = document.createElement('textarea');
        this.inputArea.rows = 1;
        this.inputArea.placeholder = '輸入問題…';
        Object.assign(this.inputArea.style, { flex: '1', padding: '6px', border: 'none', outline: 'none', fontSize: '0.9em', resize: 'none' });
        inputWrap.appendChild(this.inputArea);

        this.sendBtn = document.createElement('button');
        this.sendBtn.innerText = '送出';
        Object.assign(this.sendBtn.style, { padding: '6px 12px', border: 'none', backgroundColor: '#28a745', color: '#fff' });
        inputWrap.appendChild(this.sendBtn);

        // Shift+Enter換行，Enter送出
        this.inputArea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendBtn.click();
            }
        });

        // 點空白收合（輸入區、對話區仍可互動）
        document.addEventListener('mousedown', (e) => {
            const mainBox = window.FloatingAIMain && FloatingAIMain.mainBox;
            const aiBtn = window.FloatingAIContainer && FloatingAIContainer.container;
            const themeDialog = document.querySelector('.floating-theme-dialog');
            if (
                mainBox && mainBox.style.display !== 'none' &&
                !mainBox.contains(e.target) &&
                !(aiBtn && aiBtn.contains(e.target)) &&
                !(themeDialog && themeDialog.contains(e.target))
            ) {
                FloatingAIMain.hide();
                if (window.FloatingAIContainer && FloatingAIContainer.startBtn)
                    window.FloatingAIContainer.startBtn.style.display = '';
                if (themeDialog) themeDialog.remove();
            }
        });

        // 訊息送出事件
        this.sendBtn.addEventListener('click', async () => {
            const q = this.inputArea.value.trim();
            if (!q) return;
            this.appendMessage('user', q);
            this.inputArea.value = '';
            try {
                const res = await fetch('/Customer/Chat/Ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: q })
                });
                const { answer } = await res.json();
                this.appendMessage('assistant', answer);
            } catch {
                this.appendMessage('assistant', '發生錯誤，請稍後再試。');
            }
        });

        rightDiv.appendChild(inputWrap);

        // 插入主容器
        setTimeout(() => {
            if (window.FloatingAIContainer && FloatingAIContainer.container)
                FloatingAIContainer.container.appendChild(this.mainBox);
        }, 200);
    }

    static show() {
        this.mainBox.style.display = '';
        if (window.FloatingAIContainer && window.FloatingAIContainer.avatarBox)
            window.FloatingAIContainer.syncAvatarPos();
    }
    static hide() {
        this.mainBox.style.display = 'none';
        if (window.FloatingAIContainer && window.FloatingAIContainer.avatarBox)
            window.FloatingAIContainer.avatarBox.style.display = 'none';
    }

    // === LINE風格氣泡訊息！===
    static appendMessage(role, text) {
        // 避免產生空訊息
        if (!text || !text.trim()) return;

        // 外層主結構
        const wrap = document.createElement('div');
        wrap.style.display = 'flex';
        wrap.style.margin = '16px 0';
        wrap.style.alignItems = 'flex-end';
        wrap.style.justifyContent = (role === 'user') ? 'flex-end' : 'flex-start';

        // 頭像
        const avatar = document.createElement(role === 'user' ? 'img' : 'video');
        if (role === 'user') {
            avatar.src = '/images/user-default.png';
            avatar.style.background = '#e7f7e9';
        } else {
            avatar.src = '/images/angel.mp4';
            avatar.autoplay = avatar.muted = avatar.loop = avatar.playsInline = true;
            avatar.style.background = '#e4f0fa';
        }
        Object.assign(avatar.style, {
            width: '40px', height: '40px', borderRadius: '50%',
            margin: role === 'user' ? '0 0 0 12px' : '0 12px 0 0',
            objectFit: 'cover', boxShadow: '0 2px 8px #e2e2e2'
        });

        // 暱稱
        const nick = document.createElement('div');
        nick.innerText = role === 'user' ? '你' : 'GPT';
        nick.style.fontSize = '0.93em';
        nick.style.color = '#b3b3b3';
        nick.style.marginBottom = '3px';
        nick.style.textAlign = role === 'user' ? 'right' : 'left';

        // 聊天泡泡外層
        const bubbleWrap = document.createElement('div');
        bubbleWrap.style.display = 'flex';
        bubbleWrap.style.flexDirection = 'column';
        bubbleWrap.style.alignItems = role === 'user' ? 'flex-end' : 'flex-start';
        bubbleWrap.style.maxWidth = '70vw';

        // 聊天泡泡主體（純 CSS，圓角、漸層、陰影）
        const bubble = document.createElement('div');
        bubble.innerText = text;
        bubble.style.maxWidth = '360px';
        bubble.style.minHeight = '54px';
        bubble.style.wordBreak = 'break-word';
        bubble.style.padding = '22px 30px 22px 30px'; // 上右下左
        bubble.style.fontSize = '1.08em';
        bubble.style.lineHeight = '1.85';
        bubble.style.position = 'relative';
        bubble.style.marginRight = role === 'user' ? '10px' : '0';
        bubble.style.marginLeft = role === 'user' ? '0' : '10px';
        bubble.style.marginBottom = '3px';
        bubble.style.transition = 'transform 0.22s cubic-bezier(.7,1.6,.38,.97), opacity 0.18s';
        bubble.style.transform = 'scale(0.92)';
        bubble.style.opacity = '0';

        // 不同角色使用不同漸層與圓角
        if (role === 'user') {
            bubble.style.background = 'linear-gradient(135deg, #eaffde 85%, #bafad8 100%)';
            bubble.style.borderRadius = '24px';
            bubble.style.boxShadow = '0 4px 18px #d2efd3a8, 0 1.5px 2.5px #ddeae3';
            bubble.style.color = '#215d29';
        } else {
            bubble.style.background = 'linear-gradient(135deg, #fff 88%, #e1efff 100%)';
            bubble.style.borderRadius = '24px';
            bubble.style.boxShadow = '0 4px 18px #d4e6fb44, 0 1.5px 2.5px #ddeae3';
            bubble.style.color = '#2a4887';
        }

        // 動畫進場
        setTimeout(() => {
            bubble.style.transform = 'scale(1)';
            bubble.style.opacity = '1';
        }, 10);

        // 組合
        bubbleWrap.appendChild(bubble);
        bubbleWrap.appendChild(nick);

        if (role === 'user') {
            wrap.appendChild(bubbleWrap);
            wrap.appendChild(avatar);
        } else {
            wrap.appendChild(avatar);
            wrap.appendChild(bubbleWrap);
        }

        this.messagesDiv.appendChild(wrap);
        this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight;
    }





}
window.FloatingAIMain = FloatingAIMain;
