// querySelection.js

document.addEventListener('DOMContentLoaded', function () {
    // —— 1. 建立查詢按鈕（直接掛到 body，使用 fixed 定位） ——
    const queryBtn = document.createElement('button');  // ➡️ 新增：宣告並建立元素
    queryBtn.id = 'deepseek-query-btn';                 // 修正：正確設定 id
    queryBtn.className = 'btn btn-primary btn-sm shadow-sm';
    queryBtn.innerHTML = '<i class="bi bi-search"></i> 查詢';
    // 一開始隱藏，等選字才顯示
    queryBtn.style.display = 'none';
    // 改成 fixed，相對視窗定位，就能緊貼游標
    queryBtn.style.position = 'fixed';
    queryBtn.style.zIndex = '9999';
    document.body.appendChild(queryBtn);

    // —— 2. 建立結果面板（帶「續問」輸入框） ——
    const resultPanel = document.createElement('div');
    resultPanel.id = 'deepseek-result-panel';
    resultPanel.className = 'card shadow-lg';
    resultPanel.style.display = 'none';
    resultPanel.style.position = 'fixed';
    resultPanel.style.top = '20%';
    resultPanel.style.left = '50%';
    resultPanel.style.transform = 'translateX(-50%)';
    resultPanel.style.width = '400px';
    resultPanel.style.maxHeight = '60vh';
    resultPanel.style.overflow = 'auto';
    resultPanel.innerHTML = `
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center py-2">
            <h6 class="mb-0">查詢結果</h6>
            <button class="btn btn-sm btn-light close-btn">&times;</button>
        </div>
        <div class="card-body p-3">
            <div class="explanation-content mb-3"></div>
            <!-- 續問輸入框 -->
            <div class="input-group mb-2">
                <input type="text" class="form-control ask-again-input" placeholder="再問一個問題…">
                <button class="btn btn-outline-secondary ask-again-btn">續問</button>
            </div>
            <div class="d-flex justify-content-between align-items-center">
                <small class="source-info text-muted"></small>
                <button class="btn btn-sm btn-success save-btn" disabled>
                    <i class="bi bi-save"></i> 儲存
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(resultPanel);

    // —— 3. 選字後顯示查詢按鈕 ——
    document.addEventListener('mouseup', function (e) {
        const selection = window.getSelection().toString().trim();
        if (selection.length > 1 && !isInsidePanel(e.target)) {
            const range = window.getSelection().getRangeAt(0);
            const rect = range.getBoundingClientRect();
            // 固定定位直接用 fixed 座標
            queryBtn.style.top = `${rect.top + window.scrollY - 35}px`;
            queryBtn.style.left = `${rect.left + window.scrollX + rect.width / 2 - 30}px`;
            queryBtn.dataset.queryText = selection;
            queryBtn.style.display = 'block';
        } else {
            queryBtn.style.display = 'none';
        }
    });

    // —— 4. 點擊「查詢」叫後端查 Deepseek ——
    queryBtn.addEventListener('click', () => doQuery(queryBtn.dataset.queryText));

    // —— 5. 點擊關閉鍵 ——
    resultPanel.querySelector('.close-btn')
        .addEventListener('click', () => { resultPanel.style.display = 'none'; });

    // —— 6. 「續問」按鈕事件 ——
    resultPanel.querySelector('.ask-again-btn')
        .addEventListener('click', () => {
            const nextQ = resultPanel.querySelector('.ask-again-input').value.trim();
            if (nextQ) doQuery(nextQ);
        });

    // —— 查詢函式 ——
    async function doQuery(queryText) {
        resultPanel.style.display = 'block';
        resultPanel.querySelector('.explanation-content').innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary"></div>
                <div class="mt-2">正在查詢「${escapeHtml(queryText)}」…</div>
            </div>`;
        resultPanel.querySelector('.source-info').textContent = '';
        resultPanel.querySelector('.save-btn').disabled = true;

        try {
            const res = await fetch('/Customer/Query/GetExplanation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ QueryText: queryText })
            });
            const data = await res.json();
            if (data.success) showResult(data.query, data.explanation, data.source);
            else showError(data.error || '查詢失敗');
        } catch (err) {
            showError(`網路錯誤: ${err.message}`);
        }
    }

    function showResult(query, explanation, source) {
        const sourceText = { cache: '快取', database: '知識庫', api: 'Deepseek AI' }[source] || '';
        resultPanel.querySelector('.explanation-content').innerHTML = `
            <h5 class="text-primary mb-2">${escapeHtml(query)}</h5>
            <div class="border-start border-3 ps-3 text-break">${formatExplanation(explanation)}</div>`;
        resultPanel.querySelector('.source-info').textContent = `— 來自 ${sourceText}`;
        resultPanel.querySelector('.save-btn').disabled = false;
        const input = resultPanel.querySelector('.ask-again-input');
        input.value = ''; input.focus();
    }

    function showError(msg) {
        resultPanel.querySelector('.explanation-content').innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i> ${escapeHtml(msg)}
            </div>`;
        resultPanel.querySelector('.source-info').textContent = '';
    }

    function escapeHtml(text) {
        const d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    function formatExplanation(text) {
        return escapeHtml(text)
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    function isInsidePanel(el) {
        while (el) {
            if (el === resultPanel || el === queryBtn) return true;
            el = el.parentElement;
        }
        return false;
    }
});
