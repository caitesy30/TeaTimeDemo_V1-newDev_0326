

//公用小提醒
const tsr = Swal.mixin({
    toast: true,
    position: "top-end",
    showCancelButton: false,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
});

var dataTable;
$(document).ready(function () {
    SurveyOption.init();
    //$('#tblData').DataTable({
    //    orderCellsTop: true,
    //    fixedHeader: true
    //});
    Notes.logsInit();
});

//$(function () {
//    var url = window.location.search;
//    console.log(url)
//    if (url.includes("Processing")) {
//        loadDataTable("Processing");
//    }
//    else {
//        if (url.includes("Pending")) {
//           // loadDataTable("Pending");
//        }
//        else {
//            if (url.includes("Ready")) {
//               // loadDataTable("Ready");
//            }
//            else {
//                if (url.includes("Completed")) {
//                    //loadDataTable("Completed");
//                }
//                else {
//                   // loadDataTable("all");
//                }
//            }
//        }

//    }

//});


//function loadDataTable(status) {
//    dataTable = $('#tblData').DataTable({
//        "ajax": {
//            url: '/admin/order/getall?status=' + status
//        },
//        "columns": [
//            { data: 'id', "width": "10%" },
//            { data: 'name', "width": "15%" },
//            { data: 'phoneNumber', "width": "20%" },
//            { data: 'applicationUser.email', "width": "20%" },
//            { data: 'orderStatus', "width": "10%" },
//            { data: 'orderTotal', "width": "10%" },
//            {
//                data: 'id',
//                "render": function (data) {
//                    return `
//                        <div class="w-75 btn-group" role="group">
//                            <a href="/admin/order/details?orderId=${data}"
//                            class="btn btn-primary mx-2"><i class="bi bi-pencil-square"></i></a>
                            
//                        </div>`;
//                },
//                "width": "15%"
//            }
//        ]
//    });
//}


    




function AddNotes(_PcbCategoryId)
{
    // 取得 input 元素
    let pcbCategoryId = document.querySelector('select[name=pcbCategoryId]');
    let productId =     document.querySelector('input[name=productId]');
    let reProductId =   document.querySelector('input[name=ReProductId]');


    if (_PcbCategoryId == 0) {
        toastr.warning("PCB類別 不得為 無");

        resetQuerySelector();
        return;
    }
    // 確認兩者值不為空，且內容一致
    if (productId.value !== "" && reProductId.value !== "" && productId.value === reProductId.value)
    {
       
        AddNotes_ajax(productId.value, _PcbCategoryId)
    }
    else {
        // 如果不一致或有空值
        toastr.warning("productId 和 ReProductId 必須一致且不可為空");

        resetQuerySelector();
    }

    
}

function resetQuerySelector()
{
    document.querySelector('select[name=pcbCategoryId]').value = 0;;
    document.querySelector('input[name=productId]').value = "";
    document.querySelector('input[name=ReProductId]').value = "";
}

                                                                                                                                          

function AddNotes_ajax(_MtNum, _pcbCategoryId) {

   

    // 使用 jQuery 的 AJAX 發送請求
    $.ajax({
        url: '/Admin/Order/AddNotes',  // API 接口 URL
        type: 'GET',  // 請求方法
        data: {
            MtNum: _MtNum,
            PcbCategoryId: _pcbCategoryId,
        },   // 傳送的資料
        success: function (response) {
            // 成功時的處理邏輯，假設返回的 response 是成功訊息
            if (response.success) {
                toastr.success(response.message);
                location.reload();
                //alert("提交成功！");
                // 這裡可以進行跳轉，或其他處理
               // window.location.href = response.redirectUrl;  // 如有需要跳轉
               // window.location.href = '/Admin/Order/Index'
            } else {
                toastr.warning(response.message);
                //alert("提交失敗，請稍後再試！");
            }
            resetQuerySelector();
            //window.location.href = window.location.href;
            //window.location.href = '/Admin/Order/Index'
        },
        error: function (xhr, status, error) {
            // 當 AJAX 請求發生錯誤時的處理
            console.error("AJAX 請求失敗: " + error);
            //alert("提交過程中發生錯誤，請稍後再試！");
            toastr.success("提交過程中發生錯誤，請稍後再試！")
        }
    });
}


function restrictInput(event) {
    const input = event.target;

    setTimeout(() => {
        input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }, 0);
}


/*顯示表單*/
function ToggleForm() {
    var form = document.getElementById("NewPageSection");
    var canvas = document.querySelector('main');
    if (form.style.display === "none") form.style.display = "block";
    else form.style.display = "none";
    canvas.style.setProperty('padding-bottom', '40px', 'important');
}   

function Delete(MtNum) {
    Swal.fire({
        title: "確定刪除?",
        text: "您將無法恢復此狀態！",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "是的, 刪除它!",
        cancelButtonText: "取消"
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                type: 'DELETE',
                url: '/Admin/Order/DeleteNotes?MtNum=' + MtNum,
                success: function (data) {
                    tsr.fire({
                        title: `刪除成功！`,
                        icon: "success"
                    }).then(() => {
                        location.reload();
                    });
                    //toastr.success(data.message);
                }
            });
            
        }
    });
}



class Notes {
    static table = null;
    static draggedPdfFile = null;

    static logsInit() {
        Notes.table = $('#tblData').DataTable(); // 指派給 static 屬性
        $('#tblData tbody').on('click', 'td.details-control button', Notes.logBtn);
    }

    static handlePdfUpload(file) {
        const iframe = document.getElementById('pdfIframe');
        const reader = new FileReader();
        
        reader.onload = function (e) {
            const fileURL = URL.createObjectURL(file);
            iframe.src = fileURL;
            //noPdfCheckbox.checked = false; // 清掉無PDF選項
        };
        const blob = file.slice(0, 1024);
        reader.readAsText(blob);
        //reader.readAsDataURL(file); // 預覽用 base64
    }

    static iframeDragInit() {
        const overlay = document.getElementById('iframeDropOverlay');
        //const iframe = document.getElementById('pdfIframe'); 
        //const iframeContainer = iframe.parentNode;
        //const pdfFileInput = document.querySelector('#pdfUpload');

        document.addEventListener('dragenter', (e) => {
            e.preventDefault();
            overlay.style.borderColor = 'blue';
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        });

        overlay.addEventListener('dragover', (e) => {
            e.preventDefault();
            overlay.style.borderColor = 'blue';
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
        });

        overlay.addEventListener('dragleave', (e) => {
            overlay.style.borderColor = 'transparent';
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        });

        document.addEventListener('dragend', () => {
            overlay.style.borderColor = 'transparent';
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
        });


        overlay.addEventListener('drop', (e) => {
            e.preventDefault();
            overlay.style.borderColor = 'transparent';
            overlay.style.opacity = '0';
            overlay.style.pointerEvents = 'none';
            
            const files = e.dataTransfer.files;
            Notes.draggedPdfFile = files[0];
            if (files.length > 0 && files[0].type === "application/pdf") {
                //FloatingBookWindow.bindPdfFileInput(pdfFileInput, iframe);
                Notes.handlePdfUpload(files[0]);
            } else {
                //tsr.fire({
                //    title: "請拖曳 PDF 檔案",
                //    icon: "error"
                //})
                alert('請拖曳 PDF 檔案');
            }
        });
    }

    static updateConfirmButtonState() {
        const swalBtn = document.querySelector('.swal2-confirm');
        const differencesTextArea = document.querySelector('#txtDifferences');
        const pdfIframe = document.querySelector('#pdfIframe');
        if (differencesTextArea.value.trim() === '') {
            swalBtn.disabled = true;
        } else {
            swalBtn.disabled = false;
        }
        //if (noPdfCheckbox.checked) {
        //    swalBtn.disabled = false;
        //} else {
        //    if (pdfIframe && pdfIframe.src && differencesTextArea.value.trim() !='') {
        //        //if (FloatingBookWindow.pdfIsEncrypted) {
        //        //    swalBtn.disabled = (pdfPasswordInput.value.trim() === "");
        //        //} else {
        //            swalBtn.disabled = false;
        //        //}
        //    } else {
        //        swalBtn.disabled = true;
        //    }
        //}

    }
    
    static async showAgreement(mtNum) {
        const result = await Swal.fire({
            title: '複製同意',
            width: '90%',
            html: document.querySelector('#duplicate').innerHTML,
            showCancelButton: true,
            confirmButtonText: '送出',
            cancelButtonText: '取消',
            didOpen: async () => {

                ///初始化變數、綁定
                const swalPopup = Swal.getPopup();
                const pdfFileInput = swalPopup.querySelector('#pdfUpload');
                const pdfIframe = swalPopup.querySelector('#pdfIframe');
                const confirmBtn = Swal.getConfirmButton();
                const noPdfCheckbox = swalPopup.querySelector('#noPdfCheckbox');
                const differencesTextArea = swalPopup.querySelector('#txtDifferences');
                //const passwordInput = swalPopup.querySelector('#pdfPassword');
                try {
                    const response = await fetch(`/Admin/Order/GetPdf?mtNum=${encodeURIComponent(mtNum)}`, {
                        method: 'GET'
                    });
                    if (!response.ok) {
                        try {
                            const errJson = await response.json();
                            console.warn('PDF 無法載入:', errJson.message || '未知錯誤');
                        } catch {
                            console.warn('PDF 無法載入，且非 JSON 回應');
                        }
                    }
                    const blob = await response.blob();
                    const fileURL = URL.createObjectURL(blob);
                    document.getElementById('pdfIframe').src = fileURL;

                } catch (err) {
                    console.log(err.message);
                }

                //全螢幕按鈕
                pdfIframe.addEventListener('load', () => {

                    //把上傳區的字給隱藏
                    const overlay = document.querySelector('#iframeDropOverlay');
                    overlay.style.borderColor = 'transparent';
                    overlay.style.opacity = '0';
                    overlay.style.pointerEvents = 'none';

                    const existBtn = document.querySelector('#pdfToFullScreen');
                    if (existBtn) {
                        existBtn.remove();
                    }
                    const parent = pdfIframe.parentNode;
                    const fullScreenBtn = document.createElement('button');
                    fullScreenBtn.id = 'pdfToFullScreen';
                    fullScreenBtn.setAttribute('title', '全螢幕');
                    fullScreenBtn.innerHTML = '<i class="bi bi-arrows-fullscreen"></i>';
                    parent.appendChild(fullScreenBtn);
                    fullScreenBtn.addEventListener('click', () => {
                        if (pdfIframe.requestFullscreen) {
                            pdfIframe.requestFullscreen();
                        } else {
                            tsr.fire({
                                title: "此瀏覽器不支援",
                                icon: "error"
                            })
                            //alert("此瀏覽器不支援 requestFullscreen。");
                        }
                    });
                    Notes.updateConfirmButtonState();
                });
                Notes.iframeDragInit();

                /*noPdfCheckbox.addEventListener('change', Notes.updateConfirmButtonState);*/
                differencesTextArea.addEventListener('input', Notes.updateConfirmButtonState);
                confirmBtn.disabled = true;
                //FloatingBftsrookWindow.bindPdfFileInput(pdfFileInput, pdfIframe);
            }

        });

        if (result.isConfirmed) {
            //const swalPopup = Swal.getPopup();
            const pdfFileInput = document.querySelector('#pdfUpload');
            const differencesTextArea = document.querySelector('#txtDifferences');
            //const passwordInput = document.querySelector('#pdfPassword');

            const formData = new FormData();
            formData.append("mtNum", mtNum);
            formData.append("text", differencesTextArea.value || "");
            //formData.append("pdfPassword", passwordInput.value || "");
            if (!noPdfCheckbox.checked) {
                if(Notes.draggedPdfFile) {
                    formData.append("pdf", Notes.draggedPdfFile);
                } else if (pdfFileInput.files.length > 0) {
                    formData.append("pdf", pdfFileInput.files[0]);
                }
                //formData.append("pdf", pdfFileInput.files[0]);
            }
            
            
            const { value: newNum } = await Swal.fire({
                title: "請輸入新料號：",
                input: "text"
            });
            const response = await fetch('/Admin/Order/UploadPdf', {
                method: 'POST',
                body: formData
            });
            if (!response.ok) {
                try {
                    const errJson = await response.json();
                    console.warn('PDF 無法載入:', errJson.message || '未知錯誤');
                } catch {
                    console.warn('PDF 無法載入，且非 JSON 回應');
                }
            }
            if (!newNum) return null;

            return newNum;
        } else {
            return null;
        }

    }

    static async Duplicate(mtNum) {

        const newNum = await Notes.showAgreement(mtNum);
        

        //var newNum = prompt("請輸入新的料號：");
        if (!newNum) return;
        try {


            const response = await fetch('/Admin/Order/Duplicate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: new URLSearchParams({
                    mtNum: mtNum,
                    newNum: newNum
                })
            });
            const result = await response.json();

            if (result.success) {
                tsr.fire({
                    icon: "success",
                    title: "複製成功！"
                }).then(() => {
                    window.location.reload();
                });
            } else {
                tsr.fire({
                    title: `錯誤：${result.message}`,
                    icon: "error"
                });
                //alert('錯誤' + result.message);
            }
        } catch (error) {
            tsr.fire({
                title: `錯誤：${error.message}`,
                icon: "error"
            });

            //alert("錯誤" + error.message);
        };
            
    }

    static async Add() {

        const mtNum = document.getElementById('productId').value;
        const remtNum = document.getElementById('ReProductId').value;
        if (mtNum !== remtNum) {
            tsr.fire({
                title: "料號不一致請再確認一次！",
                icon: "error"
            });
            return;
        }
        try {
            const checkResponse = await $.ajax({
                url: '/Admin/Order/CheckExistNotes?mtNum=' + mtNum,
                type: 'GET',
                contentType: 'application/json'
            });
            if (checkResponse.exist) {

                tsr.fire({
                    title: "此料號已存在，請勿重複新增！",
                    icon: "error"
                });

                return;
            }
        } catch (error) {
            tsr.fire({
                title: `檢查料號發生錯誤請稍後再試！ERROR：${error}`,
                icon: "error"
            });
            console.error('錯誤：' + error);
            return;
        }
        const categoryId = document.getElementById('PcbCategoryId').value;

        const selectedList = [];


        const promises = Array.from(document.querySelectorAll('[data-process-type]')).map(async (dropdown) => {
            const value = dropdown.dataset.value || 0;
            let processName = dropdown.textContent;
            const typeName = dropdown.getAttribute(('data-process-type'));
            let pageList = [];

            
            if (value > 0) {
                try {
                    // 呼叫 API 取得 BlankSurvey 和其 SelectedIds
                    const response = await $.ajax({
                        url: `/Admin/Order/GetBlankSurvey/${value}`,
                        type: 'GET',
                        contentType: 'application/json',
                    });

                    if (response.success && response.data) {
                        pageList = response.data.map(survey => ({
                            surveyId: survey.surveyId,
                            version: survey.version
                        }));
                    }
                } catch (error) {
                    tsr.fire({
                        title: `取得料號資料發生錯誤！ERROR：${error}`,
                        icon: "error"
                    });
                    console.log.error("發生錯誤")
                }
            } else if (value == 0) {

                if (typeName === '其它') return;

                const layer = dropdown.getAttribute(('data-process-type'));
                processName = "一般";
                try {
                    const response = await $.ajax({
                        url: `/Admin/Order/GetBlankSurveyDefault?categoryId=${categoryId}&layer=${layer}`,
                        type: 'GET',
                        contentType: 'application/json',
                    });
                    if (response.success && response.data) {
                        pageList = response.data.map(survey => ({
                            surveyId: survey.surveyId,
                            version: survey.version
                        }));
                    }
                } catch (error) {
                    tsr.fire({
                        title: `取得料號資料發生錯誤！ERROR：${error}`,
                        icon: "error"
                    });
                    console.log.error("發生錯誤")
                }
            }

            selectedList.push({
                processName: typeName + " : " + processName,
                value: parseInt(value),
                pageList
            });
        });


        await Promise.all(promises);


        //document.querySelectorAll('[data-process-type]').forEach(dropdown => {
        //    selectedList.push({
        //        processType: dropdown.getAttribute('data-process-type'),
        //        Value: dropdown.dataset.value || 0,
        //    });
        //});

        const requestData = {
            MtNum: mtNum,
            PcbCategoryId: categoryId,
            OptionList: selectedList
        }

        $.ajax({
            url: '/Admin/Order/AddNotes',  // API 接口 URL
            type: 'POST',  // 請求方法
            contentType: 'application/json',
            data: JSON.stringify(requestData),
            success: function (response) {
                if (response.success) {
                    
                    tsr.fire({
                        icon: "success",
                        title: "建立成功！"
                    }).then(() => {
                        location.reload(); // 刷新頁面
                    });

                } else {
                    tsr.fire({
                        title: `新增料號發生錯誤！ERROR：${response.message}`,
                        icon: "error"
                    });
                    //alert('錯誤: ' + response.message);
                }
            },
            error: function (xhr) {
                tsr.fire({
                    title: `伺服器錯誤！ERROR：${xhr.status}`,
                    icon: "error"
                });
                //alert('伺服器錯誤: ' + xhr.status);
            }
        });
    }

    static logForm(logs) {
        if (!logs || logs.length === 0) return '<p class="text-muted">無修改紀錄</p>';

        const rows = logs.map(l => `
                <tr>
                    <td>${l.status}</td>
                    <td>${l.remark}</td>
                    <td>${l.jobNum}</td>
                    <td>${l.jobName}</td>
                    <td>${l.completeTime}</td>
                    <td></td>
                </tr>
            `).join('');

        return `
                <div class="p-3 border rounded bg-light">
                    <table class="table table-bordered">
                        <thead>
                            <tr class="align-middle">
                                <th>狀態</th>
                                <th>備註</th>
                                <th>編輯者工號</th>
                                <th>編輯者姓名</th>
                                <th>最後編輯時間</th>
                                <th>操作</th>
                            </tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
            `;
    }

    static logBtn() {
        const tr = $(this).closest('tr');
        const row = Notes.table.row(tr);
        const id = tr.data('id');

        if (row.child.isShown()) {
            row.child.hide();
            $(this).find('i').removeClass('bi-chevron-up').addClass('bi-chevron-down');
        } else {
            row.child('<p class="text-muted">載入中...</p>').show();

            fetch(`/Admin/Order/GetNoteLogs/${id}`)
                .then(res => {
                    if (!res.ok) throw new Error('Network response was not ok');
                    return res.json();
                })
                .then(data => {
                    row.child(Notes.logForm(data)).show(); // ✅ 修正前綴
                })
                .catch(() => {
                    row.child('<p class="text-danger">無法載入紀錄</p>').show();
                });

            $(this).find('i').removeClass('bi-chevron-down').addClass('bi-chevron-up');
        }
    }

}

class SurveyOption {
    static selectedSurveyIds = [];
    static dataTableInstance = null; 

    static init() {
        if (!document.getElementById('PcbCategoryId')) return;
        document.getElementById('PcbCategoryId').addEventListener('change', SurveyOption.getCategory);
        
    }
    static Add(processType) {
        const select = document.querySelector('.form-select');
        const selectValue = select.value;
        if (selectValue == 0) {

            tsr.fire({
                title: "請先選擇Notes類別！",
                icon: "error"
            });

            //alert('請先選擇Notes類別！');
            return;
        }
        SurveyOption.selectedSurveyIds = [];
        let modal = new bootstrap.Modal(document.getElementById('addOption'));
        
        modal.show();
        SurveyOption.loadDataTable(selectValue, processType);

        //document.getElementById('saveNewOption').removeEventListener('click', SurveyOption.handleCreate);
        //document.getElementById('saveNewOption').addEventListener('click', () => {
        //    SurveyOption.handleCreate(selectValue, processType);
        //}, { once: true });

        $('#saveNewOption').off('click').one('click', function () {
            SurveyOption.handleCreate(selectValue, processType);
        });
        
    }

    static getCategory() {
        const categoryId = this.value;
        const processDropdowns = document.querySelectorAll('[data-process-type]');

        processDropdowns.forEach(dropdown => {
            const processType = dropdown.getAttribute('data-process-type');
            SurveyOption.loadProcessOptions(categoryId, processType, dropdown);
        });

    }

    static SetSwitch() {
        let menu = this.closest('.dropdown');
        let selectedText = this.textContent.trim(); // 取得選中的文字
        let selectedValue = this.getAttribute("data-value"); // 取得選中的 value
        let selectedProcess = this.getAttribute('data-process-type');
        let dropdownButton = menu.querySelector(".dropdown-toggle"); // 取得對應的按鈕
        let categoryId = document.getElementById('PcbCategoryId').value;
        let existingModifyBtn = menu.parentNode.querySelector('.modifyBtn');
        
        //let optionId = dropdownButton.dataset.value;
        if (existingModifyBtn) {
            existingModifyBtn.remove(); // 如果有，先刪除
        }
        const modifyBtn = document.createElement('button');
        modifyBtn.classList.add('btn', 'btn-secondary', 'modifyBtn');
        modifyBtn.innerHTML = '<i class="bi bi-pencil"></i>'
        modifyBtn.addEventListener('click', () => {

            let modal = new bootstrap.Modal(document.getElementById('addOption'));

            modal.show();

            SurveyOption.loadDataTable(categoryId, selectedProcess, selectedValue, selectedText);


            $('#saveNewOption').off('click').one('click', function () {
                SurveyOption.update(selectedValue);
            });
        });
        menu.parentNode.appendChild(modifyBtn);
    
        // 修改按鈕的文字與 data-value
        dropdownButton.textContent = selectedText;
        dropdownButton.setAttribute("data-value", selectedValue);
    }

    static loadProcessOptions(categoryId, processType, dropdownElement) {
        if (categoryId === "0") {
            return;
        }

        $.ajax({
            url: '/Admin/Order/GetProcessesByCategory',
            type: 'GET',
            data: {
                categoryId: categoryId,
                processType: processType
            },
            success: function (response) {
                dropdownElement.textContent = dropdownElement.getAttribute('data-original-text');
                var dropdownMenu = dropdownElement.parentNode.querySelector('.dropdown-menu');
                dropdownMenu.innerHTML = ''; 
                if (!response.success) return;
                // 添加新选项
                response.data.forEach(process => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                    <button class="dropdown-item" data-value="${process.id}">
                        ${process.name}
                    </button>
                `;
                    dropdownMenu.appendChild(li);
                    const addNewButton = li.querySelector('button');
                    addNewButton.addEventListener('click', SurveyOption.SetSwitch);
                });

                // 添加分隔线和「新增其他」按钮
                const divider = document.createElement('li');
                divider.innerHTML = '<hr class="dropdown-divider">';
                dropdownMenu.appendChild(divider);

                const addNewItem = document.createElement('li');
                addNewItem.innerHTML = `
                <button class="dropdown-item" data-value="0" 
                    onclick="SurveyOption.Add('${processType}')">
                    >新增其他
                </button>
            `;
                dropdownMenu.appendChild(addNewItem);
                

            },
            error: function () {
                tsr.fire({
                    title: "載入流程失敗！",
                    icon: "error"
                });
                //alert('加载流程失败！');
            }
        });
    }

    static handleCreate(categoryId, processName) {
        let newOptionText = document.getElementById("newOptionInput").value.trim(); // 取得輸入值

        if (!newOptionText) {
            tsr.fire({
                title: "請輸入有效的選項名稱！",
                icon: "error"
            });
            //alert("請輸入有效的選項名稱！");
            return;
        }

        // 發送 AJAX 請求到後端
        $.ajax({
            url: "/Admin/Order/AddSurveyOption",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({
                CategoryId: categoryId,       // 類別名稱
                ProcessName: processName,      // 流程名稱
                OptionName: newOptionText,     //新框架名稱
                SurveyIds: SurveyOption.selectedSurveyIds  // 原 surveyIds → SurveyIds
            }),
            success: function (response) {
                if (response.success) {
                    const dropdownElement = document.querySelector(`[data-process-type="${processName}"]`)
                    // 關閉 Modal
                    let modal = bootstrap.Modal.getInstance(document.getElementById('addOption'));
                    modal.hide();
                    tsr.fire({
                        title: "添加成功！",
                        icon: "success"
                    });
                    //alert('添加成功！');
                    SurveyOption.loadProcessOptions(categoryId, processName, dropdownElement);
                    //location.reload();
                    
                } else {

                    tsr.fire({
                        title: `儲存失敗, ERROR：${response.message}`,
                        icon: "error"
                    });
                    //alert("儲存失敗: " + response.message);
                }
            },
            error: function () {

                tsr.fire({
                    title: "發生錯誤，請稍後再試！",
                    icon: "error"
                });
                //alert("發生錯誤，請稍後再試！");
            }
        });
    }

    static update(blankSurveyId) {


        
        let newOptionText = document.getElementById("newOptionInput").value.trim(); // 取得輸入值
        const obj = {
            BlankSurveyId: blankSurveyId,
            OptionName: newOptionText,     //新框架名稱
            
            SurveyIds: SurveyOption.selectedSurveyIds  // 原 surveyIds → 
        }
        $.ajax({
            url: "/Admin/Order/UpdateSurveyOptions",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(obj),
            success: function (response) {
                if (response.success) {
                    /*const dropdownElement = document.querySelector(`[data-process-type="${processName}"]`)*/
                    // 關閉 Modal
                    let modal = bootstrap.Modal.getInstance(document.getElementById('addOption'));
                    if (modal) {
                        modal.dispose(); // 銷毀 modal 實例
                        //modal.remove();   // 選擇性地從 DOM 中移除元素
                    }
                    //alert('更新成功！');
                    tsr.fire({
                        title: "更新成功！",
                        icon: "success"
                    }).then(() => {
                        location.reload();
                    });
                    
                    //toastr.success(response.message);
                    /*SurveyOption.loadProcessOptions(categoryId, processName, dropdownElement);*/
                    //location.reload();

                } else {
                    tsr.fire({
                        title: `儲存失敗, ERROR：${response.message}`,
                        icon: "error"
                    });
                    //alert("儲存失敗: " + response.message);
                }
            },
            error: function () {

                tsr.fire({
                    title: "發生錯誤，請稍後再試",
                    icon: "error"
                });
                //alert("發生錯誤，請稍後再試！");
            }
        });

    }

    static async loadDataTable(categoryId, processName, blankSurveyId, selectedText) {

        if (SurveyOption.dataTableInstance) {
            SurveyOption.dataTableInstance.destroy();
            $('#MtblData').empty().removeAttr('style');
        }
        //console.log(`/Admin/Order/GetSurvey?categoryId=${categoryId}&processName=${processName}`);

        try {
            const response = await $.ajax({
                url: `/Admin/Order/GetBlankSurveyToOption/${blankSurveyId}`,
                type: 'GET',
                contentType: 'application/json'
            });
            if (response.success && response.data) {
                // 直接使用後端傳回的 List<int>
                SurveyOption.selectedSurveyIds = response.data.selectedIds || [];
                processName = response.data.processName;
                

            } else {
                SurveyOption.selectedSurveyIds = [];
            }
        } catch (error) {
            tsr.fire({
                title: `"載入BlankSurvey發生錯誤, ERROR：${error}"`,
                icon: "error"
            });

            console.error("載入 BlankSurvey 失敗:", error);
            SurveyOption.selectedSurveyIds = [];
        }

        SurveyOption.dataTableInstance = $('#MtblData').DataTable({
            "ajax": {
                url: `/Admin/Order/GetSurvey?categoryId=${categoryId}&processName=${processName}`,
                type: "GET",
                /*datatype: "json",*/
                dataSrc: "data",
            },
            "fixedHeader": true,
            "columns": [
                {
                    "data": "id",
                    "render": function (data, type, row) {
                        const isChecked = SurveyOption.selectedSurveyIds.includes(data) ? "checked" : "";
                        return `<input type="checkbox" class="survey-checkbox" value="${data}" ${isChecked}>`;
                    },
                    "width": "5%"
                },
                { "data": "category", "width": "10%" },  // 確保與 SurveyDTO 的 CategoryName 對應
                { "data": "station", "width": "15%" },
                { "data": "pageNo", "width": "10%" },
                { "data": "documentId", "width": "15%" },
                {"data": "version", "width": "10%"}
            ],
            "columnDefs": [
                {
                    // 自定義排序欄位，根據是否勾選排序
                    "targets": 0, // 自定義排序的欄位
                    "orderDataType": "checkbox-selected" // 自定義排序函數名字
                }
            ],
            "order": [[0, 'asc']],//升序排列

            "initComplete": function (settings, json) {
                // 假設後端回傳的 json 中有 newOptionName 欄位
                if (selectedText) {
                    $('#newOptionInput').val(selectedText);
                }
            },
            "language": {
                "url": "/js/i18n/Chinese-traditional.json"
            },
            "drawCallback": function () {
                //切換daatTable頁數後保持已選中的問卷
                $('#MtblData input.survey-checkbox').each(function () {
                    const surveyId = parseInt($(this).val());
                    $(this).prop('checked', SurveyOption.selectedSurveyIds.includes(surveyId));
                });
            },
        });
         //自定義排序函數
        $.fn.dataTable.ext.order['checkbox-selected'] = function (settings, col) {
            return this.api().column(col, { order: 'index' }).nodes().map(function (cell) {
                // 根據是否在 `selectedSurveyIds` 中進行排序
                var checkboxValue = parseInt($(cell).find('.survey-checkbox').val());
                return SurveyOption.selectedSurveyIds.includes(checkboxValue) ? 0 : 1; // 已選中返回 0, 未選中返回 1
            });
        };
        // 監聽複選框變更
        $(document).off("change", "#MtblData tbody input.survey-checkbox");
        $(document).on("change", "#MtblData tbody input.survey-checkbox", function () {
            let surveyId = parseInt($(this).val());
            if ($(this).is(":checked")) {
                if (!SurveyOption.selectedSurveyIds.includes(surveyId)) {
                    SurveyOption.selectedSurveyIds.push(surveyId);
                }
            } else {
                SurveyOption.selectedSurveyIds = SurveyOption.selectedSurveyIds.filter(id => id !== surveyId);
            }
        });
    }

    static loadUpdateTblData() {
        $('#updateTblData').DataTable({
            "ajax": {
                url: '/Admin/Order/GetExistingSurvey', // 更新資料的 API，回傳現有問卷資料
                type: "GET",
                dataSrc: "data"
            },
            "columns": [
                // 同樣定義欄位
            ],
            "order": [[0, 'asc']],
            "language": {
                "url": "/js/i18n/Chinese-traditional.json"
            },
            "drawCallback": function () {
                $('#updateTblData input.survey-checkbox').each(function () {
                    const surveyId = parseInt($(this).val());
                    $(this).prop('checked', SurveyOption.selectedSurveyIds.includes(surveyId));
                });
            }
        });
    }
}

            