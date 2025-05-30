// wwwroot/js/floatingAIHelper.js
// AI問卷逐題助理（全盤快取唯一ID，下拉選單選題，上下題、即時重掃、容錯）

class FloatingAIHelper {
    // 題目清單與索引
    static questions = [];
    static curIdx = -1;
    static lastAiIdea = '';
    static questionSelector = null;

    // ===== 啟動AI輔助（支援重掃、唯一ID） =====
    static startAIHelp(forceReload = false) {
        // 強制重建快取 or 沒有快取
        if (forceReload || !this.questions.length) {
            this.questions = [];
            // 全盤快取所有可識別題目
            document.querySelectorAll('.ModuleBlock[data-question-mode="true"]').forEach((block, i) => {
                // 取唯一ID，沒有就用流水號
                let qid = block.getAttribute('data-qid');
                if (!qid) {
                    qid = 'q' + (i + 1);
                    block.setAttribute('data-qid', qid); // 補上唯一ID
                }
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
            // 建立/刷新下拉選單
            this.buildQuestionSelector();
        }
        if (!this.questions.length) {
            FloatingAIChat.appendMessage('user', '未找到可讀取的題目區塊！');
            return;
        }
        this.curIdx = 0;
        this.showCurrentQuestion();
    }

    // ======= 下拉選單功能 =======
    static buildQuestionSelector() {
        // 避免重複建立
        if (!this.questionSelector) {
            this.questionSelector = document.createElement('select');
            this.questionSelector.id = 'ai-q-selector';
            this.questionSelector.className = 'form-select form-select-sm';
            this.questionSelector.style.width = 'auto';
            this.questionSelector.style.display = 'inline-block';
            this.questionSelector.style.marginRight = '10px';
            // 加入事件：選擇題目時自動跳轉
            this.questionSelector.addEventListener('change', () => {
                this.curIdx = Number(this.questionSelector.value);
                this.showCurrentQuestion();
            });
            // 插入到AI助教控制列最前方
            setTimeout(() => {
                if (FloatingAIChat.aiAssistBar) {
                    FloatingAIChat.aiAssistBar.insertBefore(this.questionSelector, FloatingAIChat.aiAssistBar.firstChild);
                }
            }, 200); // 確保aiAssistBar已渲染
        }
        // 重建所有題目選項
        this.questionSelector.innerHTML = '';
        this.questions.forEach((q, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.innerText = `第${idx + 1}題：${q.title.substring(0, 18)}`;
            this.questionSelector.appendChild(opt);
        });
        this.questionSelector.value = this.curIdx;
    }

    // ====== 顯示目前題目 ======
    static async showCurrentQuestion() {
        if (this.curIdx < 0 || this.curIdx >= this.questions.length) return;
        // 切換下拉選單同步顯示
        if (this.questionSelector) this.questionSelector.value = this.curIdx;
        const q = this.questions[this.curIdx];
        FloatingAIChat.appendMessage('user', `題目${this.curIdx + 1}：${q.title}\n選項：${q.options.join(' / ')}`);
        let aiPrompt = `請針對以下題目，根據題意先提出一個最合理的回答建議（僅回選項或填空內容）：\n題目：${q.title}\n選項：${q.options.join(' / ')}\n請給我AI想法：`;
        const idea = await this.askAI(aiPrompt);
        this.lastAiIdea = idea;
        FloatingAIChat.appendMessage('assistant', `AI想法：${idea}\n\n👉 若認同想法請點「回填」，否則可「換一個」或「略過」`);
        FloatingAIChat.showAIAssistControls();
    }

    // ===== 用AI想法回填 =====
    static async fillCurrentQuestion() {
        if (this.curIdx < 0 || this.curIdx >= this.questions.length) return;
        const q = this.questions[this.curIdx];
        const answer = this.lastAiIdea;
        let filled = false;
        // 填單選/複選
        q.block.querySelectorAll('.option_checkbox').forEach(opt => {
            let label = opt.parentElement.querySelector('.fakeLabels')?.innerText.trim() ?? '';
            if (answer.includes(label)) {
                opt.checked = true; filled = true;
            }
        });
        // 填空題
        q.block.querySelectorAll('.fakeInputText, textarea').forEach(txt => {
            txt.value = answer; filled = true;
        });
        this.showTempMsg(q.block, filled ? "AI已填寫，請確認！😎" : "AI沒找到明確答案，但還是幫你加油！💪");
        this.nextQuestion();
    }

    // ===== 下一題 =====
    static nextQuestion() {
        if (this.curIdx < this.questions.length - 1) {
            this.curIdx++;
            this.showCurrentQuestion();
        } else {
            FloatingAIChat.appendMessage('assistant', '所有題目都已AI輔助過啦，恭喜！🎉');
            FloatingAIChat.hideAIAssistControls();
        }
    }

    // ===== 上一題 =====
    static prevQuestion() {
        if (this.curIdx > 0) {
            this.curIdx--;
            this.showCurrentQuestion();
        }
    }

    // ===== 換AI想法 =====
    static async newAIidea() {
        await this.showCurrentQuestion();
    }

    // ===== AI問答呼叫 =====
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

    // ===== 顯示暫時提示 =====
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

// ========== 額外支援：即時重掃快取按鈕 ==========
// 你可以在AI助教控制列或外部，增加一個"重新掃描題庫"按鈕，呼叫：FloatingAIHelper.startAIHelp(true);
