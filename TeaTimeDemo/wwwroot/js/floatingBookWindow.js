/****************************************************
 * floatingBookWindow.js (大自然深色 + 更寬鬆比對)
 * 功能：
 *   1) 浮動書本按鈕，可最小化/展開輸入視窗。
 *   2) 輸入表單 (Category / Station / PageNo / ...)
 *   3) 點擊「儲存」後呼叫 /SurveyEdit/ParseHtmlAndSave
 *   4) 若有重複 → 檢視舊新頁面差異 (.ModuleBlock為基準)
 *   5) 若文字有增刪改 → 舊模塊=淺紅底/深紅字，新模塊=藍框線/紅字。
 ****************************************************/

// 定義 FloatingBookWindow 類別，封裝所有功能
class FloatingBookWindow {
    // 儲存產生的元素參考（若需要後續操作）
    static minimizedBtn = null;
    static expandedDiv = null;
    static position = { top: 220, right: 90 }; // 💡共用位置變數

    // 用來記錄當前是否判斷出 PDF 為加密檔
    static pdfIsEncrypted = false;

    static init() {
        // 1) 檢查容器是否存在
        const container = document.getElementById("floatingBookContainer");
        if (!container) return;

        // 註冊自訂事件監聽，當 DocumentExport 資料載入時更新浮動輸入框
        window.addEventListener("DocumentExportLoaded", (e) => {
            FloatingBookWindow.handleDocumentExportLoaded(e);
        });

        // 2) 建立「最小化的書」按鈕
        const minimizedBtn = document.createElement("div");
        minimizedBtn.id = "floatingBookMinimized";
        minimizedBtn.innerHTML = "📙";
        minimizedBtn.title = "點擊展開輸入視窗";
        Object.assign(minimizedBtn.style, {
            position: "fixed",
            ...FloatingBookWindow._getPositionStyle(), // 同步位置
            cursor: "move",
            fontSize: "30px",
            zIndex: "9999",
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            borderRadius: "8px",
            width: "50px",
            height: "50px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "gold"
        });
        FloatingBookWindow.minimizedBtn = minimizedBtn;

        // 3) 建立「展開後視窗」
        const expandedDiv = document.createElement("div");
        expandedDiv.id = "floatingBookExpanded";
        Object.assign(expandedDiv.style, {
            position: "fixed",
            ...FloatingBookWindow._getPositionStyle(),
            width: "280px",
            minHeight: "200px",
            maxHeight: "80vh", // 限制最大高度，當內容超過時會出現捲軸
            overflowY: "auto", // 啟用垂直捲軸
            backgroundColor: "#fafafa",
            border: "1px solid #aaa",
            borderRadius: "8px",
            padding: "0px",
            zIndex: "9998",
            display: "none"
        });
        FloatingBookWindow.expandedDiv = expandedDiv;

        // 4) 建立標題列 (titleBar)
        const titleBar = document.createElement("div");
        Object.assign(titleBar.style, {
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            alignItems: "center",
            backgroundColor: "#eee",
            cursor: "move",
            padding: "5px",
            borderBottom: "1px solid #ddd",
            borderTopLeftRadius: "8px",
            borderTopRightRadius: "8px"
        });

        // 4.1) 建立縮小按鈕
        const btnMinimize = document.createElement("button");
        btnMinimize.id = "btnMinimize";
        btnMinimize.innerHTML = `<i class="bi bi-dash"></i>`;
        Object.assign(btnMinimize.style, {
            cursor: "pointer",
            marginRight: "5px"
        });
        titleBar.appendChild(btnMinimize);

        // 5) 建立內容區 (contentDiv) 與輸入表單
        const contentDiv = document.createElement("div");
        contentDiv.style.padding = "10px";
        contentDiv.innerHTML = `
        <h4>輸入模組</h4>

        <div style="margin-top:10px;">
          <label>種類：</label>
          <select id="txtCategory" class="form-select" style="width:100%">
            <option value="硬板">硬板</option>
            <option value="汽車板">汽車板</option>
            <option value="軟硬板">軟硬板</option>
            <option value="天龍八部">天龍八部</option>
          </select>
        </div>

        <div style="margin-top:10px;">
          <label>站別：</label>
          <select id="txtStation" class="form-select" style="width:100%">
            <option value="PNL">PNL</option>
            <option value="內層">內層</option>
            <option value="外層">外層</option>
            <option value="印字">印字</option>
            <option value="防焊">防焊</option>
            <option value="其它">其它</option>
          </select>
        </div>

        <div style="margin-top:10px;">
          <label>頁數：</label>
          <input type="number" id="txtPageNo" class="form-control" style="width:100%" />
        </div>
        <div style="margin-top:10px;">
          <label>文件編號：</label>
          <input type="text" id="txtDocumentId" class="form-control" style="width:100%" />
        </div>
        <div style="margin-top:10px;">
          <label>後綴：</label>
          <input type="text" id="txtSuffix" class="form-control" style="width:100%" placeholder="(若空則預設一般)" />
        </div>

        <div style="margin-top:15px; text-align:right;">
          <button id="btnConfirm" style="cursor:pointer;" class="btn btn-primary">儲存</button>
        </div>
      `;
        // 將 titleBar 與 contentDiv 加入展開後視窗
        expandedDiv.appendChild(titleBar);
        expandedDiv.appendChild(contentDiv);
        container.appendChild(minimizedBtn);
        container.appendChild(expandedDiv);

        // 6) 綁定「最小化書本」與「縮小按鈕」事件
        minimizedBtn.addEventListener("click", () => {
            minimizedBtn.style.display = "none";
            expandedDiv.style.display = "block";
            FloatingBookWindow._syncPosition(); // 開啟時再同步一次
        });
        btnMinimize.addEventListener("click", () => {
            minimizedBtn.style.display = "flex";
            expandedDiv.style.display = "none";
            FloatingBookWindow._syncPosition(); // 開啟時再同步一次
        });

        // 7) 綁定「儲存」按鈕事件邏輯
        const btnConfirm = contentDiv.querySelector("#btnConfirm");
        btnConfirm.addEventListener("click", () => {
            // 取得用戶輸入
            const categoryValue = document.getElementById("txtCategory").value.trim();
            const stationValue = document.getElementById("txtStation").value.trim();
            const pageNoValue = document.getElementById("txtPageNo").value.trim();
            const docIdValue = document.getElementById("txtDocumentId").value.trim();
            let suffixValue = document.getElementById("txtSuffix").value.trim();
            if (!suffixValue) suffixValue = "一般";

            // 抓取 #AutoScreen 內容
            const pageHtmlValue = document.getElementById("AutoScreen").outerHTML;

            // 建立傳送至後端的資料物件 (forceReplace 初始為 false)
            const bodyObj = {
                pageHtml: pageHtmlValue,
                category: categoryValue,
                station: stationValue,
                pageNo: pageNoValue,
                documentId: docIdValue,
                suffix: suffixValue,
                forceReplace: false
            };

            // 呼叫 sendParseHtmlAndSave 靜態方法
            FloatingBookWindow.sendParseHtmlAndSave(bodyObj);
        });

        // 8) 設定拖曳功能，讓「最小化書本」與「展開後視窗」可移動
        FloatingBookWindow._makeDraggable(minimizedBtn);
        //FloatingBookWindow._makeDraggable(titleBar, expandedDiv);
        FloatingBookWindow._makeDraggable(titleBar);


    }



    // 處理自訂事件：更新浮動輸入視窗的值
    static handleDocumentExportLoaded(e) {
        const data = e.detail;
        this.updateFloatingFields(data);
        window._documentExportData = data;
    }

    // 更新展開視窗中各輸入欄位的值；若資料為空則給預設值
    static updateFloatingFields(data) {
        const txtCategory = document.getElementById("txtCategory");
        const txtStation = document.getElementById("txtStation");
        const txtPageNo = document.getElementById("txtPageNo");
        const txtSuffix = document.getElementById("txtSuffix");
        const txtDocumentId = document.getElementById("txtDocumentId");
        if (txtCategory) txtCategory.value = data.category || "硬板";
        if (txtStation) txtStation.value = data.station || "PNL";
        if (txtPageNo) txtPageNo.value = data.pageNo || "";
        if (txtSuffix) txtSuffix.value = data.suffix || "一般";
        if (txtDocumentId) txtDocumentId.value = data.documentId || "";
    }

    // 靜態方法：呼叫後端 API 進行儲存
    static sendParseHtmlAndSave(bodyObj) {
        fetch('/Customer/SurveyEdit/ParseHtmlAndSave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyObj)
        })
            .then(resp => {
                if (!resp.ok) {
                    return resp.text().then(text => { throw new Error(text); });
                }
                return resp.json();
            })
            .then(data => {
                console.log("ParseHtmlAndSave 回傳:", data);
                if (data.success) {
                    // 儲存成功
                    Swal.fire({
                        icon: 'success',
                        title: '儲存成功',
                        text: data.message,
                        background: '#ECF4EC',
                        color: '#2B2B2B',
                        confirmButtonColor: '#86B386',
                        confirmButtonText: '關閉'
                    });
                } else {
                    // 若重複記錄，使用自訂彈窗（包括取代、檢視與複製同意按鈕）
                    if (data.isDuplicate) {
                        Swal.fire({
                            title: '已有相同紀錄！',
                            html: `<div>${data.message}</div>
                               <div style="margin-top:10px;">
                                 <button id="btnReplace" class="swal2-confirm swal2-styled">是的，取代它!</button>
                                 <button id="btnViewDiff" class="swal2-deny swal2-styled">檢視</button>
                                 <button id="btnCopyConsent" class="swal2-styled">複製同意</button>
                                 <button id="btnCancel" class="swal2-cancel swal2-styled">先不要</button>
                               </div>`,
                            showConfirmButton: false,
                            allowOutsideClick: false,
                            didOpen: () => {
                                const btnReplace = Swal.getPopup().querySelector('#btnReplace');
                                const btnViewDiff = Swal.getPopup().querySelector('#btnViewDiff');
                                const btnCopyConsent = Swal.getPopup().querySelector('#btnCopyConsent');
                                const btnCancel = Swal.getPopup().querySelector('#btnCancel');

                                btnReplace.addEventListener('click', () => {
                                    bodyObj.forceReplace = true;
                                    Swal.close();
                                    FloatingBookWindow.sendParseHtmlAndSave(bodyObj);
                                });
                                btnViewDiff.addEventListener('click', () => {
                                    Swal.close();
                                    // 呼叫檢視差異方法
                                    FloatingBookWindow.showViewDifferencesModal(data, bodyObj);
                                });
                                btnCopyConsent.addEventListener('click', () => {
                                    Swal.close();
                                    // 呼叫複製同意的視窗方法
                                    FloatingBookWindow.showCopyConsentModal(bodyObj);
                                });
                                btnCancel.addEventListener('click', () => {
                                    Swal.close();
                                    Swal.fire('已取消', '保留原資料', 'info');
                                });
                            }
                        });
                    } else {
                        // 其它儲存失敗的情況
                        Swal.fire({
                            icon: 'error',
                            title: '儲存失敗',
                            text: data.message || '不明錯誤',
                            background: '#E8F0E8',
                            color: '#2B2B2B',
                            confirmButtonColor: '#7FA47F',
                            confirmButtonText: '關閉'
                        });
                    }
                }
            })
            .catch(err => {
                console.error("ParseHtmlAndSave 例外:", err);
                Swal.fire({
                    icon: 'error',
                    title: '發生錯誤',
                    text: err.message,
                    background: '#E8F0E8',
                    color: '#2B2B2B',
                    confirmButtonColor: '#7FA47F',
                    confirmButtonText: '關閉'
                });
            });
    }


    // 此方法用於綁定 PDF 檔案上傳時的事件，並檢查檔案是否加密
    static bindPdfFileInput(pdfFileInput, pdfIframe) {
         pdfFileInput.addEventListener('change', () => {
            const file = pdfFileInput.files[0];
            if (!file) return;
            // 顯示在 iframe 中
            const fileUrl = URL.createObjectURL(file);
            pdfIframe.src = fileUrl;

            // 用 FileReader 讀取檔案前 1024 字元，檢查是否包含 "/Encrypt"
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result;
                if (text.includes("/Encrypt")) {
                    FloatingBookWindow.pdfIsEncrypted = true;
                    console.log("偵測到 PDF 為加密檔，請填入密碼。");
                } else {
                    FloatingBookWindow.pdfIsEncrypted = false;
                }
            };
            const blob = file.slice(0, 1024);
            reader.readAsText(blob);
        });
    }

    /**
     * _showCustomConfirm: 用原生 JS 生成自訂確認視窗，
     * 詢問使用者「請確認此 PDF 是否為加密檔案？」。
     * 當按【是的，送出】時，會將差異描述與 PDF 密碼合併後送出到後端；
     * 當按【否，重新填寫】時僅提示，保留原複製視窗，且不重置 PDF 欄位。
     *
     * @param {HTMLElement} diffTextArea - 差異描述的 <textarea> 元素
     * @param {HTMLInputElement} pdfFileInput - 上傳 PDF 的 <input> 元素
     * @param {HTMLInputElement} pdfPasswordInput - 輸入 PDF 密碼的 <input> 元素
     * @param {HTMLInputElement} noPdfCheckbox - 無PDF勾選框
     */
    static _showCustomConfirm(diffTextArea, pdfFileInput, pdfPasswordInput, noPdfCheckbox) {
        let overlay = document.getElementById('customConfirmOverlay');
        if (overlay) overlay.remove();

        overlay = document.createElement('div');
        overlay.id = 'customConfirmOverlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: '11000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        });

        const box = document.createElement('div');
        Object.assign(box.style, {
            backgroundColor: '#fff',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 0 10px rgba(0,0,0,0.3)',
            textAlign: 'center',
            width: '300px'
        });
        box.innerHTML = `
      <h3>請確認</h3>
      <p>請確認此 PDF 是否為加密檔案？</p>
      <div style="margin-top:20px;">
        <button id="customConfirmYes" style="margin-right:10px;">是的，送出</button>
        <button id="customConfirmNo">否，重新填寫</button>
      </div>
    `;
        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const btnYes = document.getElementById('customConfirmYes');
        const btnNo = document.getElementById('customConfirmNo');

        btnYes.addEventListener('click', () => {
            const diffs = diffTextArea.value.trim();
            const file = pdfFileInput.files[0];
            const noPdfCheckedVal = noPdfCheckbox.checked;
            const pdfPassword = pdfPasswordInput.value.trim();
            // 將差異描述與 PDF 密碼合併後送出，讓後端文字檔中也包含密碼資料
            const combinedText = diffs + "\nPDF Password: " + pdfPassword;

            const formData = new FormData();
            formData.append('differences', combinedText);
            if (!noPdfCheckedVal) {
                formData.append('pdf', file);
                formData.append('pdfPassword', pdfPassword);
            }
            formData.append('noPdf', noPdfCheckedVal);
            fetch('/Customer/SurveyEdit/CopyConsent', {
                method: 'POST',
                body: formData
            })
                .then(resp => resp.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('完成', data.message, 'success');
                    } else {
                        Swal.fire('錯誤', data.message, 'error');
                    }
                })
                .catch(err => {
                    Swal.fire('錯誤', err.message, 'error');
                })
                .finally(() => {
                    overlay.remove();
                });
        });

        btnNo.addEventListener('click', () => {
            // 使用者按否後僅提示，不重置 PDF 欄位，讓使用者可修改後重新送出
            //alert('送出已取消，請重新檢查並修改 PDF 及密碼後再送出。');
            overlay.remove();
        });
    }

    /**
     * showCopyConsentModal: 產生主要的「複製同意」彈窗（由 Swal.fire 產生），
     * 當使用者點下【送出】時，改用原生 JS (_showCustomConfirm) 生成第二層確認視窗，
     * 以確認是否為加密檔案。若使用者選擇【否，重新填寫】則回到原複製視窗，
     * 且保留原 PDF 輸入欄位資料以便修改後重新送出。
     *
     * @param {Object} bodyObj - 傳送到後端的其他資料物件（此處未直接使用，可依需求擴充）
     */
    static showCopyConsentModal(bodyObj) {
        Swal.fire({
            title: '複製同意',
            width: '90%',
            backdrop: 'rgba(0,0,0,0.4)',
            html: `
<div style="display: flex; flex-direction: row; gap:8px; height:80vh;">
  <!-- 左欄：同意書、差異描述、PDF 密碼與 PDF 上傳（寬度 25%） -->
  <div id="copyConsentLeft" style="flex:0.25; height:100%; overflow:auto; border:1px solid #ccc; padding:10px;">
    <strong>同意書</strong>
    <p>本人同意將前料號之設計資訊與資料內容，完整複製至新料號，以供後續重新設計或修改用途。</p>
    <p>本人承諾複製後之新料號設計，將依據新料號的設計規範與要求進行調整與驗證，並負責後續資料完整性及設計正確性之確認與管理。</p>
    <textarea id="txtDifferences" class="swal2-textarea" style="width:75%; height:120px;" placeholder="請填寫與前版料號的差異之處"></textarea>
    <div style="margin-top:10px; display: flex; align-items:center;">
      <input type="checkbox" id="noPdfCheckbox">
      <label for="noPdfCheckbox" style="margin-left:5px;">無PDF</label>
    </div>
    <div style="margin-top:10px; display: flex; align-items:center;">
      <input type="password" id="pdfPassword" class="swal2-input" placeholder="PDF 密碼(選填)" style="width:40%;">
      <span id="togglePassword" style="cursor:pointer; margin-left:5px;">👁️</span>
    </div>
    <div style="margin-top:10px;">
      <label>上傳PDF文件：</label>
      <input type="file" id="pdfUpload" accept="application/pdf">
    </div>
  </div>
  <!-- 右欄：PDF預覽（寬度 75%），保留全螢幕功能 -->
  <div id="copyConsentMiddle" style="flex:0.75; height:100%; border:1px solid #ccc; overflow:auto;">
    <div style="padding:5px;">
      <label>PDF 即時預覽 (需瀏覽器支援)：</label>
      <iframe id="pdfIframe" style="width:100%; height:75vh;" frameborder="0"></iframe>
    </div>
  </div>
</div>
      `,
            showCancelButton: true,
            confirmButtonText: '送出',
            cancelButtonText: '取消',
            didOpen: () => {
                const swalPopup = Swal.getPopup();
                const swalContainer = swalPopup.parentElement;
                if (swalContainer) swalContainer.style.zIndex = "10006";

                const differencesTextArea = swalPopup.querySelector('#txtDifferences');
                const noPdfCheckbox = swalPopup.querySelector('#noPdfCheckbox');
                const pdfPasswordInput = swalPopup.querySelector('#pdfPassword');
                const pdfFileInput = swalPopup.querySelector('#pdfUpload');
                const pdfIframe = swalPopup.querySelector('#pdfIframe');
                const confirmBtn = Swal.getConfirmButton();

                // 初始狀態：若「無PDF」被勾選則啟用送出；否則根據是否上傳檔案決定
                confirmBtn.disabled = noPdfCheckbox.checked ? false : true;

                const toggleIcon = swalPopup.querySelector('#togglePassword');
                toggleIcon.addEventListener('click', () => {
                    pdfPasswordInput.type = (pdfPasswordInput.type === 'password') ? 'text' : 'password';
                });

                function updateConfirmButtonState() {
                    if (differencesTextArea.value.trim() === '') {
                        confirmBtn.disabled = true;
                        return;
                    }
                    if (noPdfCheckbox.checked) {
                        confirmBtn.disabled = false;
                    } else {
                        if (pdfFileInput.files.length > 0) {
                            if (FloatingBookWindow.pdfIsEncrypted) {
                                confirmBtn.disabled = (pdfPasswordInput.value.trim() === "");
                            } else {
                                confirmBtn.disabled = false;
                            }
                        } else {
                            confirmBtn.disabled = true;
                        }
                    }
                }
                differencesTextArea.addEventListener('input', updateConfirmButtonState);
                pdfPasswordInput.addEventListener('input', updateConfirmButtonState);
                pdfFileInput.addEventListener('change', () => {
                    if (pdfFileInput.files.length > 0) {
                        setTimeout(updateConfirmButtonState, 200);
                    } else {
                        updateConfirmButtonState();
                    }
                });
                noPdfCheckbox.addEventListener('change', updateConfirmButtonState);

                FloatingBookWindow.bindPdfFileInput(pdfFileInput, pdfIframe);

                const swalActions = swalPopup.querySelector('.swal2-actions');
                if (swalActions) {
                    const btnFullScreenPdf = document.createElement('button');
                    btnFullScreenPdf.type = 'button';
                    btnFullScreenPdf.className = 'swal2-confirm swal2-styled';
                    btnFullScreenPdf.style.backgroundColor = '#3498db';
                    btnFullScreenPdf.textContent = '全螢幕放大';
                    btnFullScreenPdf.style.marginRight = '8px';
                    swalActions.insertBefore(btnFullScreenPdf, swalActions.firstChild);
                    btnFullScreenPdf.addEventListener('click', () => {
                        if (pdfIframe.requestFullscreen) {
                            pdfIframe.requestFullscreen();
                        } else {
                            alert("此瀏覽器不支援 requestFullscreen。");
                        }
                    });
                }

                // 改寫 confirm 按鈕的 click 事件：不直接送出，而是以原生 JS 生成自訂確認視窗
                confirmBtn.onclick = null;
                confirmBtn.addEventListener('click', function (e) {
                    e.preventDefault();
                    if (differencesTextArea.value.trim() === '') {
                        alert('請填寫與前版料號的差異描述');
                        return;
                    }
                    if (!noPdfCheckbox.checked && pdfFileInput.files.length === 0) {
                        alert('請上傳前版PDF文件或勾選「無PDF」');
                        return;
                    }
                    if (!noPdfCheckbox.checked && FloatingBookWindow.pdfIsEncrypted && pdfPasswordInput.value.trim() === '') {
                        alert('此 PDF 文件已加密，請填入密碼！');
                        return;
                    }
                    FloatingBookWindow._showCustomConfirm(differencesTextArea, pdfFileInput, pdfPasswordInput, noPdfCheckbox);
                });
            },
            preConfirm: () => {
                return true; // 本流程完全由 confirm 事件處理
            }
        });
    }


    // 修改後的 convertPdfToImages，與後端互動
    static convertPdfToImages(pdfFile, extraData = {}) {
        const formData = new FormData();
        formData.append('pdf', pdfFile);
        // 若有額外欄位，例如 pdfPassword 等，則加入
        for (const key in extraData) {
            formData.append(key, extraData[key]);
        }
        return fetch('/Customer/SurveyEdit/ConvertPdfToImages', {
            method: 'POST',
            body: formData
        })
            .then(resp => {
                if (!resp.ok) {
                    return resp.text().then(text => { throw new Error(text); });
                }
                return resp.json();
            })
            .catch(error => {
                if (error.message.includes("requires 64-bit Ghostscript native library installation")) {
                    throw new Error("轉檔失敗：請確認已安裝 64 位的 Ghostscript，請至 http://www.ghostscript.com/download/gsdnld.html 下載安裝。");
                }
                throw error;
            });
    }


    // 新增：檢視差異的方法，顯示舊版與新版 HTML 差異
    static showViewDifferencesModal(data, bodyObj) {
        const oldHtml = data.oldHtml || "<p>無舊資料</p>";
        const newHtml = bodyObj.pageHtml;
        const highlight = FloatingBookWindow.highlightDifferences(oldHtml, newHtml);

        Swal.fire({
            title: '舊的頁面　|　新的頁面',
            width: '90%',
            heightAuto: false,
            background: '#ECF4EC',
            color: '#2B2B2B',
            html: `
<div style="display: flex; flex-direction: row; height: 70vh; margin: 0; padding: 0;">
  <div style="flex: 1; padding: 8px; border-right: 1px solid #C2C2C2; overflow: auto; transform: scale(0.90); transform-origin: top left; color: #2B2B2B;">
    ${highlight.oldVersion}
  </div>
  <div style="flex: 1; padding: 8px; overflow: auto; transform: scale(0.90); transform-origin: top left; color: #2B2B2B;">
    ${highlight.newVersion}
  </div>
</div>
            `,
            showCancelButton: true,
            confirmButtonText: '是的，取代它!',
            cancelButtonText: '先不要',
            confirmButtonColor: '#86B386',
            cancelButtonColor: '#D2D2D2'
        }).then((result) => {
            if (result.isConfirmed) {
                bodyObj.forceReplace = true;
                FloatingBookWindow.sendParseHtmlAndSave(bodyObj);
            } else {
                Swal.fire('已取消', '保留原資料', 'info');
            }
        });
    }


    // 靜態方法：比對模塊差異，回傳舊/新頁面的 HTML
    static highlightDifferences(oldHtml, newHtml) {
        const parser = new DOMParser();
        const oldDoc = parser.parseFromString(oldHtml, 'text/html');
        const newDoc = parser.parseFromString(newHtml, 'text/html');
        const oldMap = {};
        // 收集舊文件中的 .ModuleBlock
        oldDoc.querySelectorAll('.ModuleBlock').forEach(blk => {
            const theId = blk.id || '';
            oldMap[theId] = blk;
        });
        // 比對新文件中的 .ModuleBlock
        newDoc.querySelectorAll('.ModuleBlock').forEach(newBlk => {
            const theId = newBlk.id || '';
            if (oldMap[theId]) {
                const oldBlk = oldMap[theId];
                const oldText = oldBlk.textContent.trim();
                const newText = newBlk.textContent.trim();
                if (oldText !== newText) {
                    // 文字不同，加入樣式標記
                    var TextBox = ModuleDataFetcherMgr.GetTargetModuleBlock_TextBox(newBlk);
                    TextBox.classList.add("highlightDifferences");
                }
                delete oldMap[theId];
            } else {
                // 新增模塊，加入藍框線標記
                var TextBox = ModuleDataFetcherMgr.GetTargetModuleBlock_TextBox(newBlk);
                TextBox.classList.add("highlightDifferences");
            }
        });
        // 處理舊文件中獨有的模塊
        for (const key in oldMap) {
            if (Object.hasOwnProperty.call(oldMap, key)) {
                const blk = oldMap[key];
                blk.style.backgroundColor = '#FFEAE6';
                blk.style.color = '#700000';
            }
        }
        return {
            oldVersion: oldDoc.body.innerHTML,
            newVersion: newDoc.body.innerHTML
        };
    }

    // 🟢 共用位置樣式
    static _getPositionStyle() {
        return {
            top: FloatingBookWindow.position.top + "px",
            right: FloatingBookWindow.position.right + "px"
        };
    }

    // 🟢 拖曳函式，移動時兩個物件都跟著更新
    static _makeDraggable(dragHandle) {
        let startX, startY, startTop, startRight, dragging = false;

        dragHandle.addEventListener("mousedown", function (e) {
            if (e.button !== 0) return;
            dragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startTop = FloatingBookWindow.position.top;
            startRight = FloatingBookWindow.position.right;
            document.body.style.userSelect = "none";
            e.preventDefault();
        });

        document.addEventListener("mousemove", function (e) {
            if (!dragging) return;
            // 距離是反過來（right往左移＝變大）
            let newTop = startTop + (e.clientY - startY);
            let newRight = startRight - (e.clientX - startX);
            if (newTop < 0) newTop = 0;
            if (newRight < 0) newRight = 0;
            // 更新共用變數
            FloatingBookWindow.position.top = newTop;
            FloatingBookWindow.position.right = newRight;
            // 同步位置（不管誰在顯示都同步）
            FloatingBookWindow._syncPosition();
        });

        document.addEventListener("mouseup", function () {
            dragging = false;
            document.body.style.userSelect = "";
        });
    }

    // 🟢 同步兩個物件的位置
    static _syncPosition() {
        // 只要誰顯示就更新誰
        let pos = FloatingBookWindow._getPositionStyle();
        if (FloatingBookWindow.minimizedBtn) {
            Object.assign(FloatingBookWindow.minimizedBtn.style, pos);
        }
        if (FloatingBookWindow.expandedDiv) {
            Object.assign(FloatingBookWindow.expandedDiv.style, pos);
        }
    }



}

// 當 DOM 載入完成後執行初始化
document.addEventListener("DOMContentLoaded", () => {
    FloatingBookWindow.init();
});
