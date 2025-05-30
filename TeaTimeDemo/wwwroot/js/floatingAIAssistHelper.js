// wwwroot/js/FloatingAIAssistHelper.js
// 功能：逐題AI答題、上下題、回填、換一個、下拉選題、讀題、三大主題切換+主題選擇彈窗
class FloatingAIAssistHelper {
    static questions = [];
    static curIdx = -1;
    static lastAiIdea = '';
    static questionSelector = null;
    static questionStyle = 'classic'; // 預設主題

    // 主題選擇彈窗
    static showThemeSelector() {
        document.querySelectorAll('.floating-theme-dialog').forEach(e => e.remove());
        let dialog = document.createElement('div');
        dialog.className = 'floating-theme-dialog';
        dialog.innerHTML = `
        <div style="font-weight:800;color:#008080;font-size:1.15em;text-align:center;margin-bottom:18px;">自訂佈景主題</div>
        <div style="text-align:center;">
            <select id="ai-theme-select" style="font-size:1.05em;border-radius:6px;padding:7px 16px;margin-bottom:20px;">
                <option value="flag">🎏 旗標條色塊（活潑）</option>
                <option value="bubble">💬 氣泡分層（可愛）</option>
                <option value="classic">📋 經典卡片（正式）</option>
            </select>
        </div>
        <div style="text-align:center;">
            <button id="theme-ok" style="background:#1976d2;color:#fff;border:none;border-radius:7px;padding:7px 22px;font-size:1em;margin-right:10px;">套用主題</button>
            <button id="theme-cancel" style="background:#bbb;color:#fff;border:none;border-radius:7px;padding:7px 20px;font-size:1em;">取消</button>
        </div>
        `;
        let parent;
        let mainBox = window.FloatingAIMain && FloatingAIMain.mainBox;
        let isFull = document.fullscreenElement && mainBox && document.fullscreenElement.contains(mainBox);
        if (isFull && mainBox) {
            parent = mainBox;
            Object.assign(dialog.style, {
                position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 99999, background: '#fff', border: '2px solid #b2dfdb',
                borderRadius: '12px', boxShadow: '0 6px 30px #b2dfdb55',
                padding: '32px 36px 18px 36px', minWidth: '290px', minHeight: '60px'
            });
        } else {
            parent = document.body;
            Object.assign(dialog.style, {
                position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%,-50%)',
                zIndex: 99999, background: '#fff', border: '2px solid #b2dfdb',
                borderRadius: '12px', boxShadow: '0 6px 30px #b2dfdb55',
                padding: '32px 36px 18px 36px', minWidth: '290px', minHeight: '60px'
            });
        }
        parent.appendChild(dialog);

        dialog.querySelector('#ai-theme-select').value = this.questionStyle;
        dialog.querySelector('#theme-ok').onclick = () => {
            let sel = dialog.querySelector('#ai-theme-select').value;
            this.setQuestionStyle(sel);
            dialog.remove();
        };
        dialog.querySelector('#theme-cancel').onclick = () => dialog.remove();
        setTimeout(() => { dialog.querySelector('#ai-theme-select').focus(); }, 200);
    }

    // 切換主題
    static setQuestionStyle(style) {
        this.questionStyle = style;
        this.readAllQuestions();
    }

    // 讀題渲染主題
    static readAllQuestions(style = null) {
        if (style) this.questionStyle = style;
        this.questions = [];
        document.querySelectorAll('.ModuleBlock[data-question-mode="true"]').forEach((block, i) => {
            let qid = block.getAttribute('data-qid') || ('q' + (i + 1));
            block.setAttribute('data-qid', qid);
            const title = block.querySelector('.fakeLabels')?.innerText.trim() ?? `未命名題目${i + 1}`;
            let options = [];
            block.querySelectorAll('.option_checkbox').forEach(opt => {
                let label = opt.parentElement.querySelector('.fakeLabels')?.innerText.trim() ?? '';
                options.push(label);
            });
            block.querySelectorAll('.fakeInputText, textarea').forEach(txt => {
                options.push(txt.placeholder || '');
            });
            this.questions.push({ qid, title, block, options });
        });
        if (!this.questions.length) {
            window.FloatingAIMain.appendMessage('user', '未找到可讀取的題目區塊！');
            return;
        }
        window.FloatingAIMain.messagesDiv.innerHTML = '';
        this.questions.forEach((q, idx) => {
            window.FloatingAIMain.messagesDiv.appendChild(this.renderQuestionCard(q, idx));
        });
        setTimeout(() => {
            window.FloatingAIMain.messagesDiv.scrollTop = window.FloatingAIMain.messagesDiv.scrollHeight;
        }, 120);
    }

    // 下拉選單建置
    static buildQuestionSelector() {
        if (!this.questionSelector) {
            this.questionSelector = document.createElement('select');
            this.questionSelector.id = 'ai-q-selector';
            this.questionSelector.className = 'form-select form-select-sm';
            Object.assign(this.questionSelector.style, {
                width: 'auto', display: 'inline-block', marginRight: '10px'
            });
            this.questionSelector.addEventListener('change', () => {
                this.curIdx = Number(this.questionSelector.value);
                this.showCurrentQuestion();
            });
            setTimeout(() => {
                if (window.FloatingAIMain && FloatingAIMain.aiAssistBar)
                    FloatingAIMain.aiAssistBar.insertBefore(this.questionSelector, FloatingAIMain.aiAssistBar.firstChild);
            }, 200);
        }
        this.questionSelector.innerHTML = '';
        this.questions.forEach((q, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.innerText = `第${idx + 1}題：${q.title.substring(0, 18)}`;
            this.questionSelector.appendChild(opt);
        });
        this.questionSelector.value = this.curIdx;
    }

    // ====== 選項去重(不重複標題) ======
    static getCleanOptions(q) {
        let titleTrim = q.title.replace(/[　\s]/g, '').trim();
        return q.options.filter(opt => {
            let optTrim = (opt || '').replace(/[　\s]/g, '').trim();
            return optTrim && optTrim !== titleTrim && !optTrim.includes(titleTrim);
        });
    }

    // =========== 主題渲染：題目/AI卡片 ==============
    static renderQuestionCard(q, idx) {
        let card = document.createElement('div');
        if (this.questionStyle === 'flag') {
            // 旗標條色塊
            Object.assign(card.style, {
                background: 'linear-gradient(135deg,#fffbe8 40%,#ffc378 100%)',
                color: '#28315c',
                borderRadius: '13px',
                padding: '18px 18px 13px 10px',
                margin: '15px 0 12px 0',
                boxShadow: '0 3px 18px #ffe7ab80',
                position: 'relative',
                overflow: 'hidden',
                fontWeight: 'bold',
                fontSize: '1.12em',
                display: 'flex', alignItems: 'center'
            });
            let cleanOptions = this.getCleanOptions(q);
            card.innerHTML = `
                <div style="
                    background:linear-gradient(120deg,#ff833c 70%,#ffb326 100%);
                    color:#fff; font-size:1.35em; font-weight:900;
                    border-radius:0 12px 12px 0;
                    padding:18px 18px 18px 20px;
                    margin-right:15px;
                    box-shadow:0 3px 9px #ffc87e99;
                    animation:flagWave 1.5s infinite alternate;
                ">🏳️‍🌈 ${idx + 1}</div>
                <div>
                    <div style="color:#ff8300;font-size:1.11em;font-weight:800;margin-bottom:3px;letter-spacing:1.5px;">${q.title}</div>
                    <div style="margin-top:4px;">
                        ${cleanOptions.length
                    ? cleanOptions.map(opt => `<span style="background:#fffbe0;color:#da880c;border-radius:5px;padding:3px 10px;margin-right:7px;font-size:0.97em;box-shadow:0 1px 2px #e7b77244;">${opt}</span>`).join('')
                    : '<span style="color:#aaa;">（本題無選項）</span>'
                }
                    </div>
                </div>
                <style>
                @keyframes flagWave {
                    from { transform: scaleY(1.0) rotate(-2deg);}
                    to   { transform: scaleY(1.05) rotate(2deg);}
                }
                </style>
            `;
        } else if (this.questionStyle === 'bubble') {
            // 氣泡分層
            let isLeft = idx % 2 === 0;
            Object.assign(card.style, {
                background: isLeft ? 'linear-gradient(135deg,#e5f5ff 60%,#fff 100%)' : 'linear-gradient(135deg,#fff3e9 60%,#fff 100%)',
                color: isLeft ? '#1976d2' : '#ff8a34',
                borderRadius: '22px',
                padding: '15px 22px 13px 22px',
                margin: isLeft ? '15px 60px 15px 10px' : '15px 10px 15px 60px',
                boxShadow: '0 2px 10px #c4e1f4a0',
                fontWeight: '500',
                fontSize: '1.11em',
                display: 'block',
                maxWidth: '92%',
                alignSelf: isLeft ? 'flex-start' : 'flex-end',
                textAlign: 'left',
                border: `2.5px solid ${isLeft ? '#a5d5fa' : '#ffd4b7'}`
            });
            let cleanOptions = this.getCleanOptions(q);
            let titleHtml = `
                <div style="
                    font-size:1.16em;
                    font-weight:800;
                    color:${isLeft ? '#155fa0' : '#e56d00'};
                    letter-spacing:1.2px;
                    margin-bottom:3px;">
                    <span style="background:${isLeft ? '#d1eafd' : '#ffe0cb'};border-radius:6px;padding:4px 12px 4px 9px;display:inline-block;">
                    ${isLeft ? '🟦' : '🟧'} 題目${idx + 1}：${q.title}
                    </span>
                </div>
            `;
            let sepLine = `<hr style="border:none;border-bottom:1.5px dashed #b6b6b655; margin:10px 0 7px 0;">`;
            let optionsHtml = '';
            if (cleanOptions.length > 0) {
                optionsHtml = `
                    <div style="margin-top:0;">
                        <span style="font-size:0.98em;font-weight:700;color:#7c7c7c;">選項：</span>
                        <ul style="margin:4px 0 0 0;padding-left:18px;">
                        ${cleanOptions.map(opt => `
                            <li style="
                                margin-bottom:2px;
                                background:${isLeft ? '#f2faff' : '#fff4eb'};
                                color:${isLeft ? '#0072b3' : '#e06a14'};
                                border-radius:5px;
                                display:inline-block;
                                font-size:0.99em;
                                padding:3px 12px;
                                margin-right:5px;
                                box-shadow:0 1px 4px #b2dfdb22;">
                                <span style="margin-right:5px;font-weight:700;">🟢</span>${opt}
                            </li>
                        `).join('')}
                        </ul>
                    </div>
                `;
            } else {
                optionsHtml = `<div style="font-size:0.96em;color:#bbbbbb;font-style:italic;">（本題無選項）</div>`;
            }
            card.innerHTML = titleHtml + sepLine + optionsHtml;
        } else {
            // 經典卡片
            Object.assign(card.style, {
                background: 'linear-gradient(90deg,#e3f3ff 70%,#f5fafc 100%)',
                color: '#0066b3',
                borderRadius: '10px',
                padding: '16px 15px 11px 16px',
                margin: '10px 0 8px 0',
                fontWeight: 'bold',
                fontSize: '1.08em',
                boxShadow: '0 1px 6px #b3d7f7a0',
                borderLeft: '6px solid #47a8ff',
                display: 'flex', alignItems: 'flex-start'
            });
            let cleanOptions = this.getCleanOptions(q);
            card.innerHTML = `<span style="font-size:1.5em; margin-right:12px;">❓</span>
                <div>
                    <span style="color:#1976d2;">題目${idx + 1}：</span>
                    <span style="font-size:1.08em; font-weight:bold;">${q.title}</span>
                    <br>
                    <span style="font-size:0.99em; color:#0277bd; font-weight:500;">
                        ${cleanOptions.length ? '選項：' + cleanOptions.map(opt => `<span style="background:#fffbe0; color:#ec8c1b; border-radius:3px; padding:2px 7px; margin-right:4px; font-size:0.96em;">${opt}</span>`).join('') : '<span style="color:#aaa;">（本題無選項）</span>'}
                    </span>
                </div>`;
        }
        return card;
    }

    // =========== AI想法卡片也主題同步！ ===========
    static renderAIAnswerCard(q, idx, aiIdea) {
        let card = document.createElement('div');
        if (this.questionStyle === 'flag') {
            Object.assign(card.style, {
                background: 'linear-gradient(90deg,#fff9eb 60%,#fffbe0 100%)',
                color: '#b98c10',
                borderRadius: '13px',
                padding: '14px 18px 12px 18px',
                margin: '12px 0 8px 0',
                fontWeight: 'bold',
                fontSize: '1.11em',
                borderLeft: '6px solid #ffc378',
                boxShadow: '0 1px 9px #ffe7ab99',
                display: 'flex', alignItems: 'flex-start'
            });
            card.innerHTML = `<span style="font-size:1.6em; margin-right:12px;">💡</span>
                <div>
                    <span style="color:#d39106;font-weight:800;">AI想法：</span>
                    <span style="font-size:1.05em; font-weight:600;">（${q.title.substring(0, 15)}...）</span><br>
                    <span style="font-size:1.09em; color:#a4770a;">
                        <span id="floating-ai-answer-content" style="word-break:break-all;line-height:1.7;">${aiIdea || "（AI沒有回應，請再試一次）"}</span>
                    </span>
                    <div style="font-size:0.96em; color:#b3880b; margin-top:4px;">👉 若認同想法請點「回填」，否則可「換一個」或「略過」</div>
                </div>`;
        } else if (this.questionStyle === 'bubble') {
            let isLeft = idx % 2 === 0;
            Object.assign(card.style, {
                background: isLeft ? 'linear-gradient(90deg,#eafff1 70%,#f7fff9 100%)' : 'linear-gradient(90deg,#fff6ec 70%,#fff8f1 100%)',
                color: isLeft ? '#1d8c54' : '#c07624',
                borderRadius: '22px',
                padding: '14px 24px 12px 22px',
                margin: isLeft ? '12px 80px 10px 15px' : '12px 15px 10px 80px',
                fontWeight: '500',
                fontSize: '1.10em',
                border: `2.5px solid ${isLeft ? '#a5eec8' : '#f5d3ad'}`,
                boxShadow: '0 2px 10px #b8f4e180',
                display: 'block',
                maxWidth: '92%',
                alignSelf: isLeft ? 'flex-start' : 'flex-end',
                textAlign: 'left'
            });
            card.innerHTML = `<span style="font-size:1.6em; margin-right:12px;">💡</span>
                <div>
                    <span style="color:${isLeft ? "#189e5e" : "#be8a1c"};font-weight:800;">AI想法：</span>
                    <span style="font-size:1.07em; font-weight:600;">（${q.title.substring(0, 15)}...）</span><br>
                    <span style="font-size:1.11em; color:${isLeft ? "#227d49" : "#bb860c"};">
                        <span id="floating-ai-answer-content" style="word-break:break-all;line-height:1.7;">${aiIdea || "（AI沒有回應，請再試一次）"}</span>
                    </span>
                    <div style="font-size:0.96em; color:#b3880b; margin-top:4px;">👉 若認同想法請點「回填」，否則可「換一個」或「略過」</div>
                </div>`;
        } else {
            Object.assign(card.style, {
                background: 'linear-gradient(90deg,#f8fff3 70%,#f5fff3 100%)',
                color: '#1a7f1a',
                borderRadius: '10px',
                padding: '14px 14px 12px 14px',
                margin: '8px 0 8px 0',
                fontWeight: 'bold',
                fontSize: '1.11em',
                boxShadow: '0 1px 5px #b7f7b3b0',
                borderLeft: '6px solid #64e764',
                display: 'flex', alignItems: 'flex-start'
            });
            card.innerHTML = `<span style="font-size:1.6em; margin-right:12px;">💡</span>
                <div>
                    <span style="color:#25a525;">AI想法：</span>
                    <span style="font-size:1.1em; font-weight:600;">（${q.title.substring(0, 15)}...）</span><br>
                    <span style="font-size:1.11em; color:#24761c;">
                        <span id="floating-ai-answer-content" style="word-break:break-all;line-height:1.7;">${aiIdea || "（AI沒有回應，請再試一次）"}</span>
                    </span>
                    <div style="font-size:0.96em; color:#b3880b; margin-top:4px;">👉 若認同想法請點「回填」，否則可「換一個」或「略過」</div>
                </div>`;
        }
        return card;
    }

    // ======= showCurrentQuestion：AI回答主題同步 =======
    static async showCurrentQuestion() {
        if (this.curIdx < 0 || this.curIdx >= this.questions.length) return;
        if (this.questionSelector) this.questionSelector.value = this.curIdx;
        const q = this.questions[this.curIdx];
        let questionCard = this.renderQuestionCard(q, this.curIdx);

        // 先產生空的AI想法卡片，等AI回覆後再補內容
        let aiAnswerCard = this.renderAIAnswerCard(q, this.curIdx, "AI回答生成中…");

        window.FloatingAIMain.appendMessage('user', '');
        let msgWrap = window.FloatingAIMain.messagesDiv;
        msgWrap.appendChild(questionCard);

        window.FloatingAIMain.appendMessage('assistant', '');
        msgWrap.appendChild(aiAnswerCard);

        // 載入AI答案（套用主題樣式）
        let cleanOptions = this.getCleanOptions(q);
        let aiPrompt = `請針對以下題目，根據題意先提出一個最合理的回答建議（僅回選項或填空內容）：\n題目：${q.title}\n選項：${cleanOptions.join(' / ')}\n請給我AI想法：`;
        const idea = await this.askAI(aiPrompt);
        this.lastAiIdea = idea;

        // 更新卡片答案內容
        let ansSpan = aiAnswerCard.querySelector('#floating-ai-answer-content');
        ansSpan.innerText = idea || '（AI沒有回應，請再試一次）';

        // 控制列（維持不變）
        window.FloatingAIMain.aiAssistBar.innerHTML = '';
        const fillBtn = document.createElement('button');
        fillBtn.innerText = '回填';
        fillBtn.className = 'btn btn-success btn-sm';
        fillBtn.onclick = () => this.fillCurrentQuestion();
        window.FloatingAIMain.aiAssistBar.appendChild(fillBtn);
        const newBtn = document.createElement('button');
        newBtn.innerText = '換一個';
        newBtn.className = 'btn btn-warning btn-sm';
        newBtn.onclick = () => this.newAIidea();
        window.FloatingAIMain.aiAssistBar.appendChild(newBtn);
        const prevBtn = document.createElement('button');
        prevBtn.innerText = '上一題';
        prevBtn.className = 'btn btn-secondary btn-sm';
        prevBtn.onclick = () => this.prevQuestion();
        window.FloatingAIMain.aiAssistBar.appendChild(prevBtn);
        const nextBtn = document.createElement('button');
        nextBtn.innerText = '下一題';
        nextBtn.className = 'btn btn-info btn-sm';
        nextBtn.onclick = () => this.nextQuestion();
        window.FloatingAIMain.aiAssistBar.appendChild(nextBtn);
        window.FloatingAIMain.aiAssistBar.style.display = 'flex';

        setTimeout(() => {
            msgWrap.scrollTop = msgWrap.scrollHeight;
        }, 100);
    }

    // ============= 其餘功能不變 =============
    static startAIHelp(forceReload = false) {
        if (forceReload || !this.questions.length) {
            this.questions = [];
            document.querySelectorAll('.ModuleBlock[data-question-mode="true"]').forEach((block, i) => {
                let qid = block.getAttribute('data-qid') || ('q' + (i + 1));
                block.setAttribute('data-qid', qid);
                const title = block.querySelector('.fakeLabels')?.innerText.trim() ?? `未命名題目${i + 1}`;
                let options = [];
                block.querySelectorAll('.option_checkbox').forEach(opt => {
                    let label = opt.parentElement.querySelector('.fakeLabels')?.innerText.trim() ?? '';
                    options.push(label);
                });
                block.querySelectorAll('.fakeInputText, textarea').forEach(txt => {
                    options.push(txt.placeholder || '');
                });
                this.questions.push({ qid, title, block, options });
            });
            this.buildQuestionSelector();
        }
        if (!this.questions.length) {
            window.FloatingAIMain.appendMessage('user', '未找到可讀取的題目區塊！');
            return;
        }
        this.curIdx = 0;
        this.showCurrentQuestion();
    }
    static async fillCurrentQuestion() {
        if (this.curIdx < 0 || this.curIdx >= this.questions.length) return;
        const q = this.questions[this.curIdx];
        const answer = this.lastAiIdea;
        let filled = false;
        q.block.querySelectorAll('.option_checkbox').forEach(opt => {
            let label = opt.parentElement.querySelector('.fakeLabels')?.innerText.trim() ?? '';
            if (answer.includes(label)) { opt.checked = true; filled = true; }
        });
        q.block.querySelectorAll('.fakeInputText, textarea').forEach(txt => {
            txt.value = answer; filled = true;
        });
        this.showTempMsg(q.block, filled ? "AI已填寫，請確認！😎" : "AI沒找到明確答案，但還是幫你加油！💪");
        this.nextQuestion();
    }
    static nextQuestion() {
        if (this.curIdx < this.questions.length - 1) {
            this.curIdx++;
            this.showCurrentQuestion();
        } else {
            window.FloatingAIMain.appendMessage('assistant', '所有題目都已AI輔助過啦，恭喜！🎉');
            window.FloatingAIMain.aiAssistBar.innerHTML = '';
            window.FloatingAIMain.aiAssistBar.style.display = 'none';
        }
    }
    static prevQuestion() {
        if (this.curIdx > 0) {
            this.curIdx--;
            this.showCurrentQuestion();
        }
    }
    static async newAIidea() {
        await this.showCurrentQuestion();
    }
    static async askAI(q) {
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
    static showTempMsg(block, msg) {
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
}
// 讓全域可用
window.floatingAIAssistHelper = FloatingAIAssistHelper;
