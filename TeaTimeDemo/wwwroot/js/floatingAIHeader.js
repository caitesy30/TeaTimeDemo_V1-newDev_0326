// wwwroot/js/floatingAIHeader.js
// 功能：標題列、設定、AI啟動、放大、齒輪下拉、讀題、回填、主題切換
class FloatingAIHeader {
    static headerDiv = null;
    static init() {
        // ========== 標題列 ==========
        this.headerDiv = document.createElement('div');
        Object.assign(this.headerDiv.style, {
            width: '100%', height: '44px',
            background: 'linear-gradient(90deg,#e5fbe5 60%,#c5eec5 100%)',
            color: '#388e3c', fontWeight: 'bold', fontSize: '1.2em',
            display: 'flex', alignItems: 'center', paddingLeft: '38px',
            borderBottom: '1px solid #e6eaf2', position: 'relative', userSelect: 'none'
        });
        this.headerDiv.innerText = 'AI 助理對話';

        // ======= 新功能：主題切換 =======
        //const styleSelector = document.createElement('select');
        //styleSelector.title = '切換問卷主題風格';
        //Object.assign(styleSelector.style, {
        //    position: 'absolute', top: '7px', right: '320px',
        //    borderRadius: '6px', fontSize: '0.87em', padding: '4px 8px', zIndex: 40
        //});
        //styleSelector.innerHTML = `
        //    <option value="flag">🎏 旗標條色塊</option>
        //    <option value="bubble">💬 氣泡分層</option>
        //    <option value="classic">📋 經典卡片</option>
        //`;
        //styleSelector.value = window.floatingAIAssistHelper?.questionStyle || 'flag';
        //styleSelector.onchange = function () {
        //    if (window.floatingAIAssistHelper)
        //        window.floatingAIAssistHelper.setQuestionStyle(this.value);
        //};
        //this.headerDiv.appendChild(styleSelector);

        // ===== 啟用AI助教逐題答題 =====
        const helperBtn = document.createElement('button');
        helperBtn.id = 'btnAiAssist';
        helperBtn.innerText = '啟用 AI 助教逐題答題';
        Object.assign(helperBtn.style, {
            position: 'absolute', top: '7px', right: '230px',
            background: '#ffb300', color: '#fff', border: '1px solid #ffb300',
            borderRadius: '6px', padding: '3px 14px', cursor: 'pointer',
            fontSize: '0.75em', zIndex: 33
        });
        helperBtn.onclick = () => window.floatingAIAssistHelper && window.floatingAIAssistHelper.startAIHelp && window.floatingAIAssistHelper.startAIHelp();
        this.headerDiv.appendChild(helperBtn);

        // ===== 讀題 按鈕 =====
        const readBtn = document.createElement('button');
        readBtn.title = '讀取所有題目';
        readBtn.innerText = '讀題';
        Object.assign(readBtn.style, {
            position: 'absolute', top: '5px', right: '90px', background: '#fff',
            color: '#1976d2', border: '1px solid #1976d2', borderRadius: '6px',
            padding: '3px 14px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', zIndex: 32
        });
        readBtn.onclick = () => window.floatingAIAssistHelper && window.floatingAIAssistHelper.readAllQuestions && window.floatingAIAssistHelper.readAllQuestions();
        this.headerDiv.appendChild(readBtn);

        // ===== 回填 按鈕 =====
        const fillBtn = document.createElement('button');
        fillBtn.title = 'AI回填全部題目';
        fillBtn.innerText = '回填';
        Object.assign(fillBtn.style, {
            position: 'absolute', top: '5px', right: '148px', background: '#28a745', color: '#fff',
            border: '1px solid #28a745', borderRadius: '6px', padding: '3px 14px',
            cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9em', zIndex: 32
        });
        fillBtn.onclick = () => window.floatingAIAssistHelper && window.floatingAIAssistHelper.fillAllQuestions && window.floatingAIAssistHelper.fillAllQuestions();
        this.headerDiv.appendChild(fillBtn);

        // ===== 齒輪設定 =====
        const gearBtn = document.createElement('button');
        gearBtn.title = '設定';
        gearBtn.innerHTML = `<img src="/images/設定.png" alt="設定" style="width:28px;height:28px;display:block;">`;
        Object.assign(gearBtn.style, {
            position: 'absolute', top: '9px', right: '48px',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0', zIndex: 31
        });
        this.headerDiv.appendChild(gearBtn);

        // ===== 齒輪下拉選單 =====
        const gearMenu = document.createElement('div');
        Object.assign(gearMenu.style, {
            position: 'absolute', top: '44px', right: '8px', background: '#fff', border: '1px solid #b2dfdb',
            borderRadius: '6px', boxShadow: '0 2px 10px #b2dfdb55', minWidth: '128px',
            display: 'none', zIndex: 99, fontSize: '1em', color: '#388e3c'
        });
        gearMenu.innerHTML = `
            <div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂GTP</div>
            <div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂模型</div>
            <div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂知識庫</div>
            <div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂GTP</div>
              <div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;">自訂佈景主題</div>
            <div class="gear-menu-item" style="padding:10px 18px;cursor:pointer;white-space:nowrap;border-top:1px solid #e0f2f1;">版本說明</div>
        `;
        this.headerDiv.appendChild(gearMenu);
        gearBtn.onclick = (e) => {
            e.stopPropagation();
            gearMenu.style.display = gearMenu.style.display === 'block' ? 'none' : 'block';
        };
        document.addEventListener('click', () => { gearMenu.style.display = 'none'; });
        gearMenu.addEventListener('click', e => e.stopPropagation());
        const gearItems = gearMenu.querySelectorAll('.gear-menu-item');
        gearItems[0].onclick = () => { gearMenu.style.display = 'none'; alert('🚧 自訂GTP功能開發中，敬請期待！'); };
        gearItems[1].onclick = () => { gearMenu.style.display = 'none'; alert('🚧 自訂模型功能開發中，敬請期待！'); };
        gearItems[2].onclick = () => { gearMenu.style.display = 'none'; alert('🚧 自訂知識庫功能開發中，敬請期待！'); };
        gearItems[3].onclick = () => { gearMenu.style.display = 'none'; alert('🚧 自訂GTP功能開發中，敬請期待！'); };
        gearItems[4].onclick = () => {
            gearMenu.style.display = 'none';
            window.floatingAIAssistHelper && window.floatingAIAssistHelper.showThemeSelector();
        };
        gearItems[5].onclick = () => {
            gearMenu.style.display = 'none';
            alert(`🌳 AI 助理對話窗 v1.0.0\n\n- 支援AI聊天互動，浮動頭像，歷史對話展收\n- 森林淡翠綠主題，全螢幕支援\n- 設定選單預留「自訂GTP」與「版本說明」\n- 介面直覺、操作簡單\n\n🕒 最後更新：2025-05-23\n\n🎉 歡迎體驗！未來將陸續加入更多AI創新功能，敬請期待！`);
        };

        // ===== 放大（全螢幕） =====
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.title = '全螢幕顯示/還原';
        fullscreenBtn.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24">
  <rect x="3" y="3" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
  <rect x="14" y="3" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
  <rect x="14" y="14" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
  <rect x="3" y="14" width="7" height="7" stroke="#1976d2" fill="none" stroke-width="2"/>
</svg>`;
        Object.assign(fullscreenBtn.style, {
            position: 'absolute', top: '7px', right: '16px',
            background: 'none', border: 'none', cursor: 'pointer', padding: '0', zIndex: 30
        });
        fullscreenBtn.onclick = () => {
            let box = window.FloatingAIMain.mainBox;
            if (!document.fullscreenElement) box.requestFullscreen();
            else document.exitFullscreen();
        };
        this.headerDiv.appendChild(fullscreenBtn);

        // ===== 插入 header =====
        setTimeout(() => {
            if (window.FloatingAIMain && FloatingAIMain.mainBox)
                FloatingAIMain.mainBox.insertBefore(this.headerDiv, FloatingAIMain.mainBox.firstChild);
        }, 100);
    }
}
window.FloatingAIHeader = FloatingAIHeader;
