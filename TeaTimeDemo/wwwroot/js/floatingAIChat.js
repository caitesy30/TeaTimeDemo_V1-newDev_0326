// wwwroot/js/floatingAIChat.js
// 功能：動畫頭像浮在對話框上方中央，AI問卷支援AI助教控制列（回填/換一個/上一題/下一題），舊有互動全部保留！

class FloatingAIChat {
    static messagesDiv = null;
    static aiAssistBar = null;

    static init() {
        // 1. 外層 container（可拖曳）
        const container = document.createElement('div');
        Object.assign(container.style, {
            position: 'fixed',
            top: '150px',
            right: '90px',
            zIndex: 10000,
            touchAction: 'none'
        });
        document.body.appendChild(container);

        // 2. 主對話框
        const chatBox = document.createElement('div');
        Object.assign(chatBox.style, {
            position: 'relative',
            width: '600px',
            height: '400px',
            display: 'none',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            overflow: 'hidden'
        });
        container.appendChild(chatBox);

        // 2.5 標題列
        const titleBar = document.createElement('div');
        titleBar.innerText = 'AI 助理對話';
        Object.assign(titleBar.style, {
            width: '100%',
            height: '44px',
            background: 'linear-gradient(90deg, #e5fbe5 60%, #c5eec5 100%)',
            color: '#388e3c',
            fontWeight: 'bold',
            fontSize: '1.2em',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '18px',
            borderBottom: '1px solid #e6eaf2',
            position: 'relative',
            userSelect: 'none'
        });
        chatBox.appendChild(titleBar);

        // ---- 啟用AI助教逐題答題 按鈕（插在標題列，回填的左邊） ----
        const helperBtn = document.createElement('button');
        helperBtn.id = 'btnAiAssist';
        helperBtn.innerText = '啟用 AI 助教逐題答題';
        Object.assign(helperBtn.style, {
            position: 'absolute',
            top: '7px',
            right: '230px',
            background: '#ffb300',
            color: '#fff',
            border: '1px solid #ffb300',
            borderRadius: '6px',
            padding: '3px 14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1em',
            zIndex: 33
        });
        titleBar.appendChild(helperBtn);
        helperBtn.onclick = () => {
            FloatingAIHelper.startAIHelp();
        };

        // 放大按鈕
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.title = '全螢幕顯示/還原';
        fullscreenBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24">
  <rect x="3" y="3" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
  <rect x="14" y="3" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
  <rect x="14" y="14" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
  <rect x="3" y="14" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
</svg>`;
        Object.assign(fullscreenBtn.style, {
            position: 'absolute',
            top: '7px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            zIndex: 30
        });
        titleBar.appendChild(fullscreenBtn);
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                chatBox.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        });

        // 齒輪按鈕
        const gearBtn = document.createElement('button');
        gearBtn.title = '設定';
        gearBtn.innerHTML = `<img src="/images/設定.png" alt="設定" style="width:28px;height:28px;display:block;">`;
        Object.assign(gearBtn.style, {
            position: 'absolute',
            top: '9px',
            right: '48px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            zIndex: 31
        });
        titleBar.appendChild(gearBtn);

        // 「讀題」按鈕
        const readBtn = document.createElement('button');
        readBtn.title = '讀取所有題目';
        readBtn.innerText = '讀題';
        Object.assign(readBtn.style, {
            position: 'absolute',
            top: '7px',
            right: '90px',
            background: '#fff',
            color: '#1976d2',
            border: '1px solid #1976d2',
            borderRadius: '6px',
            padding: '3px 14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1em',
            zIndex: 32
        });
        titleBar.appendChild(readBtn);

        // 「回填」按鈕
        const fillBtn = document.createElement('button');
        fillBtn.title = 'AI回填全部題目';
        fillBtn.innerText = '回填';
        Object.assign(fillBtn.style, {
            position: 'absolute',
            top: '7px',
            right: '148px',
            background: '#28a745',
            color: '#fff',
            border: '1px solid #28a745',
            borderRadius: '6px',
            padding: '3px 14px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1em',
            zIndex: 32
        });
        titleBar.appendChild(fillBtn);

        // 齒輪下拉選單
        const gearMenu = document.createElement('div');
        gearMenu.style.position = 'absolute';
        gearMenu.style.top = '44px';
        gearMenu.style.right = '8px';
        gearMenu.style.background = '#fff';
        gearMenu.style.border = '1px solid #b2dfdb';
        gearMenu.style.borderRadius = '6px';
        gearMenu.style.boxShadow = '0 2px 10px #b2dfdb55';
        gearMenu.style.minWidth = '128px';
        gearMenu.style.display = 'none';
        gearMenu.style.zIndex = 99;
        gearMenu.style.fontSize = '1em';
        gearMenu.style.color = '#388e3c';
        gearMenu.innerHTML = `
<div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂GTP</div>
<div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂模型</div>
<div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂知識庫</div>
<div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂GTP</div>
<div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;border-top:1px solid #e0f2f1;">版本說明</div>
`;
        titleBar.appendChild(gearMenu);
        gearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            gearMenu.style.display = gearMenu.style.display === 'block' ? 'none' : 'block';
        });
        document.addEventListener('click', () => { gearMenu.style.display = 'none'; });
        gearMenu.addEventListener('click', e => e.stopPropagation());
        const gearItems = gearMenu.querySelectorAll('.gear-menu-item');
        gearItems[0].addEventListener('click', () => { gearMenu.style.display = 'none'; alert('🚧 自訂GTP功能開發中，敬請期待！'); });
        gearItems[1].addEventListener('click', () => { gearMenu.style.display = 'none'; alert('🚧 自訂模型功能開發中，敬請期待！'); });
        gearItems[2].addEventListener('click', () => { gearMenu.style.display = 'none'; alert('🚧 自訂知識庫功能開發中，敬請期待！'); });
        gearItems[3].addEventListener('click', () => { gearMenu.style.display = 'none'; alert('🚧 自訂GTP功能開發中，敬請期待！'); });
        gearItems[4].addEventListener('click', () => { gearMenu.style.display = 'none'; showVersionInfo(); });
        function showVersionInfo() {
            alert(`🌳 AI 助理對話窗 v1.0.0

- 支援AI聊天互動，浮動頭像，歷史對話展收
- 森林淡翠綠主題，全螢幕支援
- 設定選單預留「自訂GTP」與「版本說明」
- 介面直覺、操作簡單

🕒 最後更新：2025-05-23

🎉 歡迎體驗！未來將陸續加入更多AI創新功能，敬請期待！`);
        }


        // 3. 浮動頭像
        const avatarBox = document.createElement('div');
        Object.assign(avatarBox.style, {
            position: 'fixed',
            left: '40%',
            top: '0px',
            width: '64px',
            height: '64px',
            zIndex: 10001,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: '0 2px 10px rgba(0,0,0,0.13)',
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px solid #e0e0e0',
            overflow: 'hidden',
            transition: 'top 0.2s'
        });
        const avatarVid = document.createElement('video');
        avatarVid.src = '/images/angel.mp4';
        avatarVid.loop = avatarVid.muted = avatarVid.autoplay = avatarVid.playsInline = true;
        Object.assign(avatarVid.style, {
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            borderRadius: '50%'
        });
        avatarBox.appendChild(avatarVid);
        document.body.appendChild(avatarBox);

        // 4. 啟動按鈕（小圖示）
        const btn = document.createElement('div');
        btn.title = '燿華GTP';
        Object.assign(btn.style, {
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'transform 0.2s',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        });
        const vidBtn = document.createElement('video');
        vidBtn.src = '/images/angel.mp4';
        vidBtn.loop = vidBtn.muted = vidBtn.autoplay = vidBtn.playsInline = true;
        Object.assign(vidBtn.style, {
            width: '100%',
            height: '100%',
            objectFit: 'cover'
        });
        btn.appendChild(vidBtn);
        container.appendChild(btn);

        // 5. 主體內容
        const mainWrap = document.createElement('div');
        Object.assign(mainWrap.style, {
            display: 'flex',
            width: '100%',
            height: 'calc(100% - 44px)',
            position: 'absolute',
            top: '44px',
            left: 0
        });
        chatBox.appendChild(mainWrap);

        // 5a. 歷史對話區
        const historyDiv = document.createElement('div');
        Object.assign(historyDiv.style, {
            width: '240px',
            minWidth: '0',
            padding: '8px',
            backgroundColor: '#f7f7f7',
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'width 0.2s, min-width 0.2s, padding 0.2s',
            height: '100%',
            boxSizing: 'border-box',
            position: 'relative'
        });
        mainWrap.appendChild(historyDiv);

        // 5a.1 隱藏/顯示按鈕
        const histToggle = document.createElement('div');
        histToggle.title = '隱藏歷史對話區';
        histToggle.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 24 24">
            <g>
                <ellipse cx="12" cy="12" rx="9" ry="7" fill="#4fc3f7" stroke="#0288d1" stroke-width="2"/>
                <path d="M3 3l18 18" stroke="#f44336" stroke-width="2" fill="none"/>
                <circle cx="12" cy="12" r="3.5" fill="#fff176" stroke="#fbc02d" stroke-width="2"/>
            </g>
        </svg>
        `;
        Object.assign(histToggle.style, {
            position: 'absolute',
            top: '4px',
            left: '4px',
            width: '32px',
            height: '32px',
            background: 'transparent',
            border: 'none',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: '20',
            padding: '0'
        });
        historyDiv.appendChild(histToggle);

        // 5a.2 歷史訊息內容
        const histMessages = document.createElement('div');
        Object.assign(histMessages.style, {
            marginTop: '40px',
            overflowY: 'auto',
            height: 'calc(100% - 48px)'
        });
        historyDiv.appendChild(histMessages);

        // 5b. 右側聊天內容+輸入
        const rightDiv = document.createElement('div');
        Object.assign(rightDiv.style, {
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 0%',
            minWidth: 0,
            height: '100%',
            position: 'relative'
        });
        mainWrap.appendChild(rightDiv);

        // 5b.1 訊息區
        FloatingAIChat.messagesDiv = document.createElement('div');
        Object.assign(FloatingAIChat.messagesDiv.style, {
            flex: '1 1 0%',
            minHeight: '0',
            padding: '8px',
            overflowY: 'auto',
            overflowX: 'hidden',
            fontSize: '0.9em',
            background: 'transparent'
        });
        rightDiv.appendChild(FloatingAIChat.messagesDiv);

        // ===== AI 助教控制列容器（聊天訊息下方）=====
        FloatingAIChat.aiAssistBar = document.createElement('div');
        Object.assign(FloatingAIChat.aiAssistBar.style, {
            width: '100%',
            display: 'none',
            gap: '10px',
            margin: '8px 0',
            justifyContent: 'center'
        });
        rightDiv.appendChild(FloatingAIChat.aiAssistBar);

        // 5b.2 輸入列
        const inputWrap = document.createElement('div');
        Object.assign(inputWrap.style, {
            display: 'flex',
            borderTop: '1px solid #eee',
            flexShrink: '0',
            background: '#fff'
        });
        rightDiv.appendChild(inputWrap);

        const input = document.createElement('textarea');
        input.rows = 1;
        input.placeholder = '輸入問題…';
        Object.assign(input.style, {
            flex: '1',
            padding: '6px',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontSize: '0.9em'
        });
        inputWrap.appendChild(input);

        const sendBtn = document.createElement('button');
        sendBtn.innerText = '送出';
        Object.assign(sendBtn.style, {
            padding: '6px 12px',
            border: 'none',
            backgroundColor: '#28a745',
            color: '#fff',
            cursor: 'pointer'
        });
        inputWrap.appendChild(sendBtn);

        // ===== 控制邏輯與動畫頭像機制 =====
        function syncAvatarPos() {
            if (chatBox.style.display === 'none') {
                avatarBox.style.display = 'none';
                return;
            }
            const rect = chatBox.getBoundingClientRect();
            avatarBox.style.left = `${rect.left + rect.width / 2 + 200}px`;
            avatarBox.style.top = `${rect.top - 64}px`;
            avatarBox.style.display = '';
        }

        btn.addEventListener('click', () => {
            btn.style.transform = 'scale(1.2)';
            setTimeout(() => btn.style.transform = 'scale(1)', 200);
            chatBox.style.display = '';
            btn.style.display = 'none';
            syncAvatarPos();
            input.focus();
            histMessages.textContent = '載入歷史對話…';
        });

        document.addEventListener('mousedown', function (e) {
            if (chatBox.style.display !== 'none' && !container.contains(e.target)) {
                chatBox.style.display = 'none';
                btn.style.display = '';
                avatarBox.style.display = 'none';
                restoreHistory();
                if (!historyDiv.contains(histToggle)) {
                    historyDiv.appendChild(histToggle);
                }
            }
        });

        let down = false, sx = 0, sy = 0, st = 0, sr = 0;
        container.addEventListener('mousedown', e => {
            if ([input, sendBtn, btn].includes(e.target)) return;
            down = true;
            sx = e.clientX; sy = e.clientY;
            st = parseInt(container.style.top, 10);
            sr = parseInt(container.style.right, 10);
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!down) return;
            container.style.top = `${st + (e.clientY - sy)}px`;
            container.style.right = `${sr - (e.clientX - sx)}px`;
            syncAvatarPos();
        });
        document.addEventListener('mouseup', () => { down = false; });
        window.addEventListener('resize', syncAvatarPos);

        let histVisible = true;
        histToggle.addEventListener('click', () => {
            histVisible = !histVisible;
            if (!histVisible) {
                historyDiv.style.width = '0';
                historyDiv.style.minWidth = '0';
                historyDiv.style.padding = '0';
                historyDiv.style.visibility = 'hidden';
                rightDiv.appendChild(histToggle);
                Object.assign(histToggle.style, {
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    zIndex: 21
                });
            } else {
                historyDiv.style.width = '240px';
                historyDiv.style.minWidth = '240px';
                historyDiv.style.padding = '8px';
                historyDiv.style.visibility = 'visible';
                historyDiv.appendChild(histToggle);
                Object.assign(histToggle.style, {
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    zIndex: 20
                });
            }
            setTimeout(syncAvatarPos, 220);
        });
        function restoreHistory() {
            histVisible = true;
            historyDiv.style.width = '240px';
            historyDiv.style.minWidth = '240px';
            historyDiv.style.padding = '8px';
            historyDiv.style.visibility = 'visible';
            historyDiv.appendChild(histToggle);
            Object.assign(histToggle.style, {
                position: 'absolute',
                top: '4px',
                left: '4px',
                zIndex: 20
            });
        }

        input.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        });
        sendBtn.addEventListener('click', async () => {
            const q = input.value.trim();
            if (!q) return;
            appendMessage(FloatingAIChat.messagesDiv, 'user', q);
            input.value = '';
            try {
                const res = await fetch('/Customer/Chat/Ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: q })
                });
                const { answer } = await res.json();
                appendMessage(FloatingAIChat.messagesDiv, 'assistant', answer);
            } catch {
                appendMessage(FloatingAIChat.messagesDiv, 'assistant', '發生錯誤，請稍後再試。');
            }
        });

        // =======【AI自動答題 - 新增「讀題/回填」功能】=======
        readBtn.addEventListener('click', () => {
            let msg = '';
            document.querySelectorAll('.ModuleBlock[data-question-mode="true"]').forEach((block, i) => {
                const title = block.querySelector('.fakeLabels')?.innerText.trim() ?? '';
                let options = [];
                block.querySelectorAll('.option_checkbox').forEach(opt => {
                    let label = opt.parentElement.querySelector('.fakeLabels')?.innerText.trim() ?? '';
                    options.push(label);
                });
                block.querySelectorAll('.fakeInputText, textarea').forEach(txt => {
                    options.push(txt.placeholder || '');
                });
                msg += `題目${i + 1}：${title}\n選項：${options.join(' / ')}\n\n`;
            });
            if (!msg) msg = '未找到可讀取的題目區塊！';
            appendMessage(FloatingAIChat.messagesDiv, 'user', '[讀題]\n' + msg);
        });

        fillBtn.addEventListener('click', async () => {
            let blocks = Array.from(document.querySelectorAll('.ModuleBlock[data-question-mode="true"]'));
            if (!blocks.length) {
                appendMessage(FloatingAIChat.messagesDiv, 'assistant', '沒有可AI回填的題目！');
                return;
            }
            for (let block of blocks) {
                await aiAnswerAndFill(block, true);
            }
            appendMessage(FloatingAIChat.messagesDiv, 'assistant', '🎉 全部題目已AI回填完成！（如有疑問可手動調整）');
        });

        async function aiAnswerAndFill(block, forBatch = false) {
            const questionText = block.querySelector('.fakeLabels')?.innerText.trim() ?? '';
            let options = [];
            block.querySelectorAll('.option_checkbox').forEach(opt => {
                if (opt.type === 'radio' || opt.type === 'checkbox') {
                    let label = opt.parentElement.querySelector('.fakeLabels')?.innerText.trim() ?? '';
                    options.push({ id: opt.id, label, type: opt.type });
                }
            });
            block.querySelectorAll('.fakeInputText, textarea').forEach(txt => {
                options.push({ id: txt.id, label: txt.placeholder || '', type: 'text' });
            });

            let aiPrompt = `請根據下列題目，自動回答一個合理答案（僅回選項文字或填空內容）：\n題目：${questionText}\n選項：${options.map(o => o.label).join(' / ')}\n請作答：`;
            let answer = await askAI(aiPrompt);

            let filled = false;
            for (let opt of options) {
                if ((opt.type === 'radio' || opt.type === 'checkbox') && answer.includes(opt.label)) {
                    let input = document.getElementById(opt.id);
                    if (input) { input.checked = true; filled = true; }
                }
            }
            if (!filled) {
                for (let opt of options) {
                    if (opt.type === 'text') {
                        let input = document.getElementById(opt.id);
                        if (input) { input.value = answer; filled = true; }
                    }
                }
            }
            if (!forBatch) {
                if (filled) showTempMsg(block, "AI已幫你填寫答案，歡迎再手動調整！😎");
                else showTempMsg(block, "AI沒找到明確答案，但還是幫你加油！💪");
            }
        }
        async function askAI(q) {
            try {
                let res = await fetch('/Customer/Chat/Ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: q })
                });
                let data = await res.json();
                return data.answer.trim();
            } catch {
                return '';
            }
        }
        function appendMessage(dom, role, text) {
            const msg = document.createElement('div');
            msg.innerText = (role === 'user' ? '你：' : 'GPT：') + text;
            Object.assign(msg.style, {
                margin: '4px 0',
                textAlign: role === 'user' ? 'right' : 'left'
            });
            dom.appendChild(msg);
            dom.scrollTop = dom.scrollHeight;
        }
        function showTempMsg(block, msg) {
            let tip = document.createElement('div');
            tip.innerText = msg;
            Object.assign(tip.style, {
                position: 'absolute', top: '-30px', left: '0', background: '#d4efdf', color: '#2471a3',
                padding: '4px 12px', borderRadius: '6px', zIndex: 10001, fontSize: '1em', boxShadow: '0 2px 10px #ccc'
            });
            block.style.position = 'relative';
            block.appendChild(tip);
            setTimeout(() => { tip.remove(); }, 1800);
        }

        // ============ AI 助教控制列 - 新增/移除 =============
        FloatingAIChat.showAIAssistControls = function () {
            // 清空
            FloatingAIChat.aiAssistBar.innerHTML = '';
            // 回填
            const fillBtn = document.createElement('button');
            fillBtn.innerText = '回填';
            fillBtn.className = 'btn btn-success btn-sm';
            fillBtn.onclick = () => FloatingAIHelper.fillCurrentQuestion();
            FloatingAIChat.aiAssistBar.appendChild(fillBtn);

            // 換一個
            const newBtn = document.createElement('button');
            newBtn.innerText = '換一個';
            newBtn.className = 'btn btn-warning btn-sm';
            newBtn.onclick = () => FloatingAIHelper.newAIidea();
            FloatingAIChat.aiAssistBar.appendChild(newBtn);

            // 上一題
            const prevBtn = document.createElement('button');
            prevBtn.innerText = '上一題';
            prevBtn.className = 'btn btn-secondary btn-sm';
            prevBtn.onclick = () => FloatingAIHelper.prevQuestion();
            FloatingAIChat.aiAssistBar.appendChild(prevBtn);

            // 下一題
            const nextBtn = document.createElement('button');
            nextBtn.innerText = '下一題';
            nextBtn.className = 'btn btn-info btn-sm';
            nextBtn.onclick = () => FloatingAIHelper.nextQuestion();
            FloatingAIChat.aiAssistBar.appendChild(nextBtn);

            FloatingAIChat.aiAssistBar.style.display = 'flex';
        };
        FloatingAIChat.hideAIAssistControls = function () {
            FloatingAIChat.aiAssistBar.innerHTML = '';
            FloatingAIChat.aiAssistBar.style.display = 'none';
        };
        // 給 Helper 直接呼叫訊息區
        FloatingAIChat.appendMessage = function (role, text) {
            appendMessage(FloatingAIChat.messagesDiv, role, text);
        };
    }
}

// 初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FloatingAIChat.init());
} else {
    FloatingAIChat.init();
}
