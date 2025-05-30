/**
 * floatingSurveyMenu.js
 * 功能：問卷功能列懸浮化，垂直顯示圖示按鈕、懸停 tooltip、一次點擊展開/收合、可拖曳
 * 調整：統一由 container 進行定位與拖曳，展開狀態預設顯示
 */
class FloatingSurveyMenu {
    static container = null;
    static minimizedBtn = null;
    static expandedBar = null;
    static initialized = false;

    static init() {
        if (FloatingSurveyMenu.initialized) return;
        FloatingSurveyMenu.initialized = true;
        if (document.getElementById("surveyMenuContainer")) return;

        // 1. 建立 container，統一定位
        const container = document.createElement("div");
        container.id = "surveyMenuContainer";
        container.classList.add("no-print");
        Object.assign(container.style, {
            position: "fixed", top: "120px", right: "20px",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: "8px", zIndex: "10000", cursor: "move"
        });
        document.body.appendChild(container);
        this.container = container;

        // 2. 縮小按鈕
        const btn = document.createElement("div");
        btn.id = "surveyMenuMin";
        btn.innerText = "☰";
        btn.title = "問卷功能";
        Object.assign(btn.style, {
            width: "48px", height: "48px",
            backgroundColor: "#007bff", color: "#fff",
            borderRadius: "8px", display: "none",
            alignItems: "center", justifyContent: "center",
            fontSize: "1.5em"
        });
        container.appendChild(btn);
        this.minimizedBtn = btn;

        // 3. 展開工具列
        const bar = document.createElement("div");
        bar.id = "surveyMenuBar";
        Object.assign(bar.style, {
            padding: "4px", backgroundColor: "#f8f9fa",
            border: "1px solid #ccc", borderRadius: "8px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
            display: "flex", flexDirection: "column",
            alignItems: "center", gap: "8px"
        });
        container.appendChild(bar);
        this.expandedBar = bar;

        // 4. 圖示按鈕群
        const actions = [
            { icon: "💾", tooltip: "儲存", fn: () => SaveAndLoadAnswerMgr.saveAnswer() },
            { icon: "📂", tooltip: "匯入", fn: () => setLoadBtnMgr.importTxtAndProcess() },
            { icon: "🗑️", tooltip: "清除", fn: () => window.location.reload() },
            { icon: "🕑", tooltip: "修訂歷史", fn: () => alert("修訂歷史...") },
            { icon: "⚙️", tooltip: "頁面設定", fn: () => alert("頁面設置...") },
            { icon: "🖨️", tooltip: "列印", fn: () => { SurveyPrintMgr.print(); } },
                // ↓ 新增：Notes 清單 改為 📝 圖示
            {
                icon: "📝", tooltip: "Notes清單", fn: () => {
                    window.location.href = "https://localhost:7021/Admin/Order";
                }
            }


        ];
        actions.forEach(a => {
            const b = document.createElement("div");
            b.innerText = a.icon;
            b.title = a.tooltip;
            Object.assign(b.style, {
                width: "48px", height: "48px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "1.5em",
                backgroundColor: "#fff", borderRadius: "6px",
                border: "1px solid #ddd"
            });
            b.addEventListener("click", a.fn);
            bar.appendChild(b);
        });

        // 5. 收合按鈕
        const collapseBtn = document.createElement("div");
        collapseBtn.innerText = "⬅️";
        collapseBtn.title = "收合";
        Object.assign(collapseBtn.style, {
            width: "48px", height: "48px",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", fontSize: "1.5em",
            backgroundColor: "#fff", borderRadius: "6px",
            border: "1px solid #ddd"
        });
        bar.appendChild(collapseBtn);

        // 6. 切換函式
        const toggle = () => {
            const isOpen = bar.style.display === "flex";
            if (isOpen) {
                bar.style.display = "none";
                btn.style.display = "flex";
            } else {
                btn.style.display = "none";
                bar.style.display = "flex";
            }
        };
        btn.addEventListener("click", toggle);
        collapseBtn.addEventListener("click", toggle);

        // 初始預設展開
        bar.style.display = "flex";
        btn.style.display = "none";

        // 7. 拖曳 container
        this.makeDraggable(container);
    }

    // 拖曳 container
    static makeDraggable(elem) {
        let isDown = false, startX, startY, startTop, startRight;
        elem.addEventListener('mousedown', e => {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            // parse existing top/right
            const cs = window.getComputedStyle(elem);
            startTop = parseInt(cs.top, 10);
            startRight = parseInt(cs.right, 10);
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!isDown) return;
            const dy = e.clientY - startY;
            const dx = e.clientX - startX;
            elem.style.top = (startTop + dy) + 'px';
            elem.style.right = (startRight - dx) + 'px';
        });
        document.addEventListener('mouseup', () => { isDown = false; });
    }
}

// 啟動
if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", () => FloatingSurveyMenu.init());
} else {
    FloatingSurveyMenu.init();
}
