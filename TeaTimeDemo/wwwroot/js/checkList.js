//const tsr = Swal.mixin({
//    toast: true,
//    position: "top-end",
//    showCancelButton: false,
//    showConfirmButton: false,
//    timer: 2500,
//    timerProgressBar: true,
//});

document.addEventListener("DOMContentLoaded", () => {
    const table = document.getElementById("tblData");
    if (!table) return;

    table.addEventListener("click", function (e) {
        const target = e.target.closest("button.btn-submit-vali");
        if (target) {
            CheckList.checkWindow(e);
        }
    });
});

class CheckList {
    static async checkWindow(e) {
        e.preventDefault();
        const result = await Swal.fire({
            title: '送審前請確認以下事項',
            width: '40%',
            html: document.querySelector('#checklist').innerHTML,

            showCancelButton: true,
            confirmButtonText: '完成',
            cancelButtonText: '取消',
            didOpen: () => {
                document.querySelectorAll('.checklist-textarea').forEach(textarea => {
                    textarea.style.height = 'auto'
                    textarea.addEventListener('input', () => {
                        textarea.style.height = 'auto'
                        textarea.style.height = textarea.scrollHeight + 'px'
                    });
                });
            },

            preConfirm: () => {
                const rows = document.querySelectorAll('.checklist-row');
                const result = [];

                for (const row of rows) {
                    const checkbox = row.querySelector('input[type="checkbox"]');
                    const textarea = row.querySelector('textarea');
                    const label = row.dataset.label;


                    if (!checkbox.checked) {
                        Swal.showValidationMessage(`請勾選 "${label}"`);
                        return false;
                    }

                    if (textarea.value.trim() === '') {
                        Swal.showValidationMessage(`請填寫 "${label}" 的備註`);
                        return false;
                    }

                    result.push(`${label}:\n${textarea.value.trim()}\n`);
                }

                return result;
            }
        }).then(async (result) => {

            ///料號 <- Id、使用者工號、寫的內容
            if (result.isConfirmed) {
                const form = document.querySelector('#valiForm');
                const id = form.querySelector('input[name="Id"]').value;
                const textContent = result.value.join('\n');

                const res = await fetch(`/Admin/Order/GetMtNum?id=${id}`);
                const data = await res.json();
                if (!res.ok || !data.mtNum) {
                    console.log("查詢 mtNum 失敗");
                    return;
                }
                const formData = new FormData();
                formData.append("content", textContent);
                formData.append("mtNum", data.mtNum);
                formData.append("jobNum", data.jobNum);
                formData.append("jobName", data.jobName);
                fetch('/Admin/Order/ValiAgreement', {
                    method: 'POST',
                    body: formData
                }).then(res => {
                    if (res.ok) {


                        console.log('✅ 儲存成功', '', 'success');
                        tsr.fire({
                            title: '提交成功！請等待審核...',
                            icon: 'success'
                        }).then(() => {
                            form.submit();
                        });
                        
                    } else {
                        console.log('❌ 儲存失敗', '', 'error');
                    }
                });
                


                ///下禮拜:後端儲存填空備註成txt
                //const response = await fetch('', {
                //    method: 'POST',
                //    body: formData
                //});

            }
        })
        
    }
}