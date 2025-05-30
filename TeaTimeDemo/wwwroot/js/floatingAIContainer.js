// 功能：只有動畫小鈕可拖曳移動，主對話框/輸入區完全不影響點選、選字、複製
class FloatingAIContainer {
    static container = null;
    static avatarBox = null;
    static startBtn = null;

    static init() {
        // 外層容器（不再支援整個拖曳，改由小鈕拖動）
        this.container = document.createElement('div');
        Object.assign(this.container.style, {
            position: 'fixed', top: '150px', right: '90px', zIndex: 10000, touchAction: 'none'
        });
        document.body.appendChild(this.container);

        // 動畫小鈕（可拖曳）
        this.startBtn = document.createElement('div');
        this.startBtn.title = '開啟AI對話';
        Object.assign(this.startBtn.style, {
            width: '50px', height: '50px', borderRadius: '50%', overflow: 'hidden',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', background: '#fff', userSelect: 'none'
        });
        let vid = document.createElement('video');
        vid.src = '/images/angel.mp4';
        vid.loop = vid.muted = vid.autoplay = vid.playsInline = true;
        Object.assign(vid.style, { width: '100%', height: '100%', objectFit: 'cover' });
        this.startBtn.appendChild(vid);
        this.container.appendChild(this.startBtn);

        // 浮動頭像
        this.avatarBox = document.createElement('div');
        Object.assign(this.avatarBox.style, {
            position: 'fixed', left: 'calc(50vw - 32px)', top: '100px', width: '64px', height: '64px', zIndex: 10001,
            background: '#fff', borderRadius: '50%', boxShadow: '0 2px 10px #0002',
            display: 'none', border: '2px solid #e0e0e0', overflow: 'hidden'
        });
        let avatarVid = document.createElement('video');
        avatarVid.src = '/images/angel.mp4';
        avatarVid.loop = avatarVid.muted = avatarVid.autoplay = avatarVid.playsInline = true;
        Object.assign(avatarVid.style, { width: '100%', height: '100%', objectFit: 'cover' });
        this.avatarBox.appendChild(avatarVid);
        document.body.appendChild(this.avatarBox);

        // 點小鈕顯示主視窗
        this.startBtn.addEventListener('click', () => {
            window.FloatingAIMain.show();
            this.startBtn.style.display = 'none';
            this.avatarBox.style.display = '';
            this.syncAvatarPos();
        });

        // --- 只有動畫小圖示可拖曳 ---
        let down = false, sx = 0, sy = 0, st = 0, sr = 0;
        this.startBtn.addEventListener('mousedown', e => {
            // 只允許左鍵
            if (e.button !== 0) return;
            down = true;
            sx = e.clientX; sy = e.clientY;
            st = parseInt(this.container.style.top, 10);
            sr = parseInt(this.container.style.right, 10);
            // 拖曳時避免觸發選取文字
            this.startBtn.style.cursor = 'grabbing';
            e.preventDefault();
        });
        document.addEventListener('mousemove', e => {
            if (!down) return;
            this.container.style.top = `${st + (e.clientY - sy)}px`;
            this.container.style.right = `${sr - (e.clientX - sx)}px`;
            this.syncAvatarPos();
        });
        document.addEventListener('mouseup', () => {
            if (down) this.startBtn.style.cursor = 'grab';
            down = false;
        });
        window.addEventListener('resize', () => this.syncAvatarPos());
    }

    // 浮動頭像跟著主視窗移動
    static syncAvatarPos() {
        const mainBox = window.FloatingAIMain?.mainBox;
        if (mainBox && mainBox.style.display !== 'none') {
            const rect = mainBox.getBoundingClientRect();
            this.avatarBox.style.left = `${rect.left + rect.width / 2 - 32}px`;
            this.avatarBox.style.top = `${rect.top - 74}px`;
            this.avatarBox.style.display = '';
        } else {
            this.avatarBox.style.display = 'none';
        }
    }
    static show() { this.container.style.display = ''; }
    static hide() { this.container.style.display = 'none'; }
}
window.FloatingAIContainer = FloatingAIContainer;
