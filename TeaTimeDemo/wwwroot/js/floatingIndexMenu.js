/**
 * floatingIndexMenu.js
 * 功能：在 Index 頁面加入懸浮功能鍵，提供匯入、匯出、設定、收合等操作
 */
class FloatingIndexMenu {
    // 懸浮容器、切換按鈕、功能列
    static container;
    static toggleBtn;
    static menuBar;
    static initialized = false;

    static init() {
        if (this.initialized) return;
        this.initialized = true;


        // —— 新增：隱藏的檔案輸入框
        this.fileInput = document.createElement('input');
        this.fileInput.type = 'file';
        this.fileInput.accept = '.xlsx,.xls';
        this.fileInput.style.display = 'none';
        this.fileInput.addEventListener('change', async e => {
            const file = e.target.files[0];
            if (!file) return;
            const form = new FormData();
            form.append('file', file);
            try {
                const res = await fetch('/Customer/DataSync/ImportAll', {
                    method: 'POST',
                    body: form
                });
                const json = await res.json();
                alert(json.success ? '匯入完成' : `匯入失敗：${json.message}`);
                // 改用 F5 方式重整，避免 null.offsetWidth
                window.location.reload();


            } catch (err) {
                alert('匯入錯誤：' + err.message);
            }
        });
        document.body.appendChild(this.fileInput);


        // 1. 建立固定定位的容器
        const container = document.createElement("div");
        container.id = "indexMenuContainer";
        container.classList.add("no-print");
        Object.assign(container.style, {
            position: "fixed",
            top: "150px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            zIndex: "10000",
            cursor: "move"
        });
        document.body.appendChild(container);
        this.container = container;

        // 2. 切換按鈕（☰）
        const toggleBtn = document.createElement("div");
        toggleBtn.id = "indexMenuToggle";
        toggleBtn.innerText = "☰";
        toggleBtn.title = "功能選單";
        Object.assign(toggleBtn.style, {
            width: "50px",
            height: "50px",
            backgroundColor: "#007bff",
            color: "#fff",
            borderRadius: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.6em"
        });
        container.appendChild(toggleBtn);
        this.toggleBtn = toggleBtn;

        // 3. 功能列（預設隱藏）
        const menuBar = document.createElement("div");
        menuBar.id = "indexMenuBar";
        Object.assign(menuBar.style, {
            padding: "6px",
            backgroundColor: "#f1f1f1",
            border: "1px solid #ccc",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px"
        });
        container.appendChild(menuBar);
        this.menuBar = menuBar;

        // 4. 定義功能按鈕：匯入、匯出、設定、收合
        const actions = [
            { icon: "📥", tooltip: "匯入", fn: () => FloatingIndexMenu.importData() },
            { icon: "📤", tooltip: "匯出", fn: () => FloatingIndexMenu.exportData() },
            { icon: "⚙️", tooltip: "設定", fn: () => FloatingIndexMenu.openSettings() },

            { icon: "⬅️", tooltip: "收合", fn: () => FloatingIndexMenu.toggleMenu() }
        ];
        actions.forEach(act => {
            const btn = document.createElement("div");
            btn.innerText = act.icon;
            btn.title = act.tooltip;
            Object.assign(btn.style, {
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: "1.5em",
                backgroundColor: "#fff",
                borderRadius: "6px",
                border: "1px solid #ddd"
            });
            btn.addEventListener("click", act.fn);
            menuBar.appendChild(btn);
        });

        // 5. 切換功能列顯示／隱藏
        toggleBtn.addEventListener("click", () => FloatingIndexMenu.toggleMenu());

        // 6. 容器可拖曳
        this.makeDraggable(container);
    }

    /** 切換功能列顯示或隱藏 */
    static toggleMenu() {
        this.menuBar.style.display = (this.menuBar.style.display === "none") ? "flex" : "none";
    }

    /** 匯入資料（待實作） */
    static importData() {
        this.fileInput.value = null;
        this.fileInput.click();
    }

    /** 匯出資料（待實作） */
    static exportData() {
        window.location.href = '/Customer/DataSync/ExportAll';
    }

    /** 開啟設定視窗（待實作） */
    static openSettings() {
        alert("設定功能尚未實作，請加入實際邏輯。");
    }

    /** 讓元素可拖曳 */
    static makeDraggable(elem) {
        let isDown = false, startX, startY, startTop, startRight;
        elem.addEventListener("mousedown", e => {
            isDown = true;
            startX = e.clientX;
            startY = e.clientY;
            const cs = window.getComputedStyle(elem);
            startTop = parseInt(cs.top, 10);
            startRight = parseInt(cs.right, 10);
            e.preventDefault();
        });
        document.addEventListener("mousemove", e => {
            if (!isDown) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            elem.style.top = (startTop + dy) + "px";
            elem.style.right = (startRight - dx) + "px";
        });
        document.addEventListener("mouseup", () => { isDown = false; });
    }
}

// 啟動
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => FloatingIndexMenu.init());
} else {
    FloatingIndexMenu.init();
}
