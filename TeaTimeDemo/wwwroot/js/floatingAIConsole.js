// wwwroot/js/floatingAIConsole.js
// 統一全域控制，呼叫各區域初始化
class FloatingAIConsole {
    static init() {
        FloatingAIContainer.init();
        FloatingAIHeader.init();
        FloatingAIHistory.init();
        FloatingAIMain.init();
        if (window.FloatingAIHelper && window.FloatingAIHelper.init)
            FloatingAIHelper.init();
    }
    static show() { FloatingAIContainer.show(); }
    static hide() { FloatingAIContainer.hide(); }
}
window.FloatingAIConsole = FloatingAIConsole;

// 建議直接於main.js 或 main layout引入後自動初始化：
// if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => FloatingAIConsole.init());
// } else {
//     FloatingAIConsole.init();
// }
