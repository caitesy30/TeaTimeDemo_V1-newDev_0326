
document.addEventListener('DOMContentLoaded', () => {
    const checkExist = setInterval(() => {
        if (document.querySelector("#floatingNavigator")) {
            clearInterval(checkExist); 
            //console.log("#floatingNavigator 已載入");
            validation.init();
        }
    }, 500); // 每 500 毫秒檢查一次
});

class validation {
    static init() {
        const area = document.querySelector('.navigator-content');
        const btn = document.createElement('button');
        btn.classList.add('btn', 'btn-info');
        btn.title = "檢核題目 -桃(未選),紅(未填)";
        btn.innerHTML = '<i class="bi bi-bug-fill"></i>';
        if (area == null) {
            return;
        }
        area.appendChild(btn);
        btn.addEventListener('click', () => {
            AllQuestionsAnsweredMgr.CheckAllQuestionsAnswered_SetColor();
            if (validation.checkVali()) {
                alert('還有題目尚未填寫');
            } else {
                alert('填寫完成！');
            }
        });
    }


    static checkVali() {

        const NoAnswerYetCls = document.querySelector('.NoAnswerYet');
       

        return NoAnswerYetCls;
    }
}