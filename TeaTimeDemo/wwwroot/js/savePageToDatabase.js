/********************************************/
/* savePageToDatabase.js                  */
/*負責儲存資料到資料庫相關功能 (含載入Notes)*/
/********************************************/

// 若頁面上沒有該 input，動態插入，注意要加上 name="file"
if (!document.getElementById("importFileInput")) {
    document.body.insertAdjacentHTML(
        "beforeend",
        '<input type="file" id="importFileInput" name="file" style="display: none;" accept=".xlsx,.xls" onchange="savePageToDatabaseMgr.triggerFileUpload(this)">'
    );
}

class savePageToDatabaseMgr {

    // ★ 用來記住匯入模式：'replace' 或 'append'
    static importMode = 'replace';

    static currentLoadedDocId = null;
    static currentLoadedVersion = null;


    static AnswerDataList = [];
  　 /**
      * (A) 原本：整頁儲存 => /SurveyEdit/ParseHtmlAndSave
      */
        static savePageToDatabase() {  
  
    const pageHtml = document.getElementById("AutoScreen").outerHTML;


    fetch('/Customer/SurveyEdit/ParseHtmlAndSave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageHtml: pageHtml })
    })
        .then(response => {
            // 若成功(2xx) => 用 response.json()
            if (response.ok) {
                return response.json();
            } else {
                // 若非 2xx (例如 400) => 可能是純文字
                return response.text().then(text => {
                    throw new Error(text); // 丟到 catch
                });
            }
        })
        .then(data => {
            // 這裡就能接到 { success: true, message: "...", ... }
            alert("儲存成功：" + data.message);
        })
        .catch(err => {
            // 這裡會接到 throw new Error(text) 的情況
            console.error(err);
            alert("發生錯誤：" + err.message);
        });
    }

    /**
 　　* (B) 動態產生「載入Notes」Modal，若已存在就不建
　　 */
    static createLoadNotesModalIfNeeded() {
        if (document.getElementById('loadNotesModal')) {
            return; // 已存在
        }

        // 動態插入 Modal 結構
        const modalHtml = `
<div class="modal fade" id="loadNotesModal" tabindex="-1" aria-labelledby="loadNotesModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-xl">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="loadNotesModalLabel">載入Notes (DocumentExport)</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="關閉"></button>
      </div>
      <div class="modal-body">
        <table id="documentExportsTable" class="table table-striped table-bordered" style="width:100%">
          <thead>
            <tr>
              <th>Id</th>
              <th>Category</th>
              <th>Station</th>
              <th>PageNo</th>
              <th>Suffix</th>
              <th>DocumentId</th>
              <th>Version</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }


    /**
     * (D) 打開「載入Notes」Modal
     */
    static openLoadNotesModal() {
        // 1. 動態產生Modal
        savePageToDatabaseMgr.createLoadNotesModalIfNeeded();

        // 2. 初始化 DataTable     
        //    呼叫獨立的 DocumentExportsTable.init()
                DocumentExportsTable.init();

        // 3. 顯示 Modal
        $('#loadNotesModal').modal('show');
        // 4. 重新載入
        if (window.docExpTable) {
            window.docExpTable.ajax.reload();
        }
    }


    /**
     * (E) 載入 => 將此 DocumentExport 的完整HTML載到 #AutoScreen
     */
    static async loadDocumentToAutoScreen(docId) {
        const url = `/Customer/SurveyEdit/GetFullHtml?documentId=${docId}`;

        try {
            const resp = await fetch(url);
            const data = await resp.json();

            if (data.success) {
                // 保存當前載入的 DocumentExport.Id，供後續更新用
                this.currentLoadedDocId = docId;

                // 呼叫處理函式，處理 HTML 載入與 ID 重編
                await ModuleBlockSettingBarMgr.importTxtAndProcess(data.htmlContent);

                // 派送自訂事件，讓浮動書本能更新各欄位（包含 debug 資訊）
                const event = new CustomEvent("DocumentExportLoaded", { detail: data });
                window.dispatchEvent(event);

                // 關閉 Notes Modal
                $('#loadNotesModal').modal('hide');
            } else {
                alert('載入失敗：' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('載入資料發生錯誤：' + err.message);
        }
    }

    static  loadDocumentToAutoScreen_(docId) {
        const url = `/Customer/SurveyEdit/GetFullHtml?documentId=${docId}`;
        fetch(url)
            .then(resp => resp.json())
            .then(data => {
                if (data.success) {
                    // 保存當前載入的 DocumentExport.Id，供後續更新用
                    this.currentLoadedDocId = docId;
                    // 呼叫處理函式，處理 HTML 載入與 ID 重編
                     ModuleBlockSettingBarMgr.importTxtAndProcess(data.htmlContent);
                    // 派送自訂事件，讓浮動書本能更新各欄位（包含 debug 資訊）
                    const event = new CustomEvent("DocumentExportLoaded", { detail: data });
                    window.dispatchEvent(event);
                    // 關閉 Notes Modal
                    $('#loadNotesModal').modal('hide');
                } else {
                    alert('載入失敗：' + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('載入資料發生錯誤：' + err.message);
            });
    }

    /**
* 根據 user 選擇的 docId + version 載入 Notes
*/
    static async loadDocumentVersion(docId, version) {
        try {
            const resp = await fetch(`/Customer/SurveyEdit/GetFullHtml?documentId=${docId}&version=${version}`);
            const data = await resp.json();

            if (data.success) {
                this.currentLoadedDocId = docId;
                this.currentLoadedVersion = version;    // ★ 加這行

                await ModuleBlockSettingBarMgr.importTxtAndProcess(data.htmlContent);

                window.dispatchEvent(new CustomEvent("DocumentExportLoaded", { detail: data }));
            } else {
                alert('載入失敗：' + data.message);
            }
        } catch (err) {
            console.error(err);
            alert('載入錯誤：' + err.message);
        }
    }

    static async loadDocumentVersion_(docId, version) {
        fetch(`/Customer/SurveyEdit/GetFullHtml?documentId=${docId}&version=${version}`)
            .then(resp => resp.json())
            .then(data => {
                if (data.success) {
                    this.currentLoadedDocId = docId;
                      ModuleBlockSettingBarMgr.importTxtAndProcess(data.htmlContent);
                    window.dispatchEvent(new CustomEvent("DocumentExportLoaded", { detail: data }));
                } else {
                    alert('載入失敗：' + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert('載入錯誤：' + err.message);
            });
    }

    /**
 * ★ 新增：複製並替換 HtmlSections.HtmlPart
 */
    static async cloneHtmlSections() {

        const btn = document.getElementById('cloneHtmlBtn');
        const spinner = document.getElementById('cloneHtmlSpinner');
        const txt = document.getElementById('cloneHtmlText');

        if (!this.currentLoadedDocId) {
            alert("尚未載入任何 Notes，無法複製HtmlSections！");
            return;
        }

        // show loading
        btn.setAttribute('disabled', true);
        spinner.classList.remove('d-none');
        txt.textContent = '請稍候...';

        // 1) 先拿回所有分頁的 HtmlSection
        const url = `/Customer/SurveyEdit/GetHtmlSections?documentId=${this.currentLoadedDocId}&version=${this.currentLoadedVersion || ''}`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            if (!data.success) {
                alert("取得HtmlSections失敗：" + data.message);
                return;
            }
            // 2) 逐筆跑，clone + 重新編號，再呼叫後端更新
            for (const sec of data.sections) {
                // (1) 解析舊的 htmlPart
                const wrapper = document.createElement('div');
                wrapper.innerHTML = sec.htmlPart;
                const oldBlock = wrapper.firstElementChild;
                // (2) 重新 clone、編號
                const newBlock = await ModuleBlockSettingBarMgr.cloneWithNewIds(oldBlock);
                const newHtml = newBlock.outerHTML;
                // (3) 呼叫 API 更新該筆
                const upResp = await fetch('/Customer/SurveyEdit/UpdateSingleHtmlSection', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sectionId: sec.id,
                        htmlPart: newHtml
                    })
                });
                const upData = await upResp.json();
                if (!upData.success) {
                    console.error(`Section ${sec.id} 更新失敗：${upData.message}`);
                }
            }
            alert("所有 HtmlSections 已複製並更新完成！");
        } catch (err) {
            console.error(err);
            alert("複製過程中發生錯誤：" + err.message);
        } finally {
            // hide loading
            spinner.classList.add('d-none');
            btn.removeAttribute('disabled');
            txt.textContent = '複製 HtmlPort';
        }


    }

    /**
     * (F) 刪除 DocumentExport
     */
    static deleteDocument(docId) {
        Swal.fire({
            title: '確定要刪除嗎？',
            text: '刪除後將無法恢復',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '刪除',
            cancelButtonText: '取消'
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`/Customer/SurveyEdit/DeleteDocumentExport/${docId}`, { method: 'DELETE' })
                    .then(resp => resp.json())
                    .then(res => {
                        if (res.success) {
                            Swal.fire('刪除成功', '', 'success');
                            if (window.docExpTable) {
                                window.docExpTable.ajax.reload();
                            }
                        } else {
                            Swal.fire('刪除失敗', res.message, 'error');
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        Swal.fire('刪除失敗', '後端錯誤', 'error');
                    });
            }
        });
    }

    /**
 * (★) 新增：修改Notes => 將目前 #AutoScreen 的內容更新回原DocumentExport.Id
 */
    static updateOriginalNotes() {
        // 1) 確認是否已經載入過某筆 DocumentExport
        if (!this.currentLoadedDocId) {
            alert("尚未載入任何 Notes，無法修改！");
            return;
        }

        // 2) 抓取 #AutoScreen 的 HTML
        const pageHtml = document.getElementById("AutoScreen").outerHTML;

        // 3) 發送 AJAX 到後端 UpdateHtmlSections (請先在後端建立對應 API)
        fetch('/Customer/SurveyEdit/UpdateHtmlSections', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                documentId: this.currentLoadedDocId,
                htmlContent: pageHtml
            })
        })
            .then(resp => {
                if (!resp.ok) {
                    return resp.text().then(text => { throw new Error(text); });
                }
                return resp.json();
            })
            .then(data => {
                if (data.success) {
                    alert("修改成功：" + data.message);
                } else {
                    alert("修改失敗：" + data.message);
                }
            })
            .catch(err => {
                console.error(err);
                alert("修改過程發生錯誤：" + err.message);
            });
    }


    /**
  * (★) 修改：動態生成匯入/匯出 Modal，並新增「續著匯入」按鈕
  */
    static showImportExportModal() {
        let modal = document.getElementById("importExportModal");
        if (!modal) {
            const modalHtml = `
<div class="modal fade" id="importExportModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">匯入 / 匯出</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label for="exportIdsInput">請輸入要匯出的 ID (範例: 1-10,13,15)</label>
          <input type="text" id="exportIdsInput" class="form-control" placeholder="例如：1-5,8,10" />
        </div>
        <div class="d-grid gap-2">          
          <button class="btn btn-success" onclick="savePageToDatabaseMgr.triggerFullExport()">完全匯出</button>
          <button class="btn btn-primary" onclick="savePageToDatabaseMgr.triggerLatestExport()">匯出最新版本</button>
          <button id="btnCustomExport" class="btn btn-secondary" onclick="savePageToDatabaseMgr.triggerCustomExport()">自訂 ID 匯出</button>
          <button class="btn btn-info" onclick="savePageToDatabaseMgr.triggerReplaceImport()">完全取代匯入</button>
          <button class="btn btn-warning" onclick="savePageToDatabaseMgr.triggerAppendImport()">續著匯入</button>
        </div>
      </div>
    </div>
  </div>
</div>`;
            document.body.insertAdjacentHTML("beforeend", modalHtml);
            modal = document.getElementById("importExportModal");

            // ★ 初始化後綁定 Enter 鍵事件
            const input = document.getElementById('exportIdsInput');
            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') {
                    // 阻止表單預設提交
                    e.preventDefault();
                    savePageToDatabaseMgr.triggerCustomExport();
                }
            });
        }
        new bootstrap.Modal(modal, { keyboard: false }).show();
    }

    // 新增方法：依使用者輸入的 ID 匯出
    static triggerCustomExport() {
        const ids = document.getElementById('exportIdsInput').value.trim();
        if (!ids) {
            alert('請先輸入要匯出的 ID！');
            return;
        }
        const bs = bootstrap.Modal.getInstance(document.getElementById("importExportModal"));
        if (bs) bs.hide();
        // 導向後端，帶入 ids 參數
        window.location.href = `/Customer/SurveyEdit/ExportDocumentData?ids=${encodeURIComponent(ids)}`;
    }

    /** ★ 完全取代匯入：清空 input.value 確保 onchange 一定會觸發 ★ **/
    static triggerReplaceImport() {
        this.importMode = 'replace';  // 設定模式為「完全取代」
        const bs = bootstrap.Modal.getInstance(document.getElementById("importExportModal"));
        if (bs) bs.hide();
        const input = document.getElementById("importFileInput");
        input.value = "";             // ⚠️ 清空，讓同一檔案重複選也會觸發
        input.click();                // 喚起檔案選擇
    }

    /** ★ 續著匯入：同上 ★ **/
    static triggerAppendImport() {
        this.importMode = 'append';   // 設定模式為「續著匯入」
        const bs = bootstrap.Modal.getInstance(document.getElementById("importExportModal"));
        if (bs) bs.hide();
        const input = document.getElementById("importFileInput");
        input.value = "";
        input.click();
    }


    /**
     * (★) 修改：當檔案選擇後，上傳到不同後端
     * @param {HTMLInputElement} input
     */
    static triggerFileUpload(input) {
        if (input.files.length === 0) {
            alert("請選擇一個 Excel 檔案！");
            return;
        }
        console.log(`🤖 上傳模式：${this.importMode}`);  // 除錯用

        // 顯示 Loading Modal
        const loadingModalHtml = `
<div class="modal fade" id="importLoadingModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content bg-transparent border-0 shadow-none">
      <div class="modal-body text-center">
        <div class="spinner-border" style="width: 3rem; height: 3rem;"></div>
        <p>檔案上傳中，請稍候...</p>
      </div>
    </div>
  </div>
</div>`;
        document.body.insertAdjacentHTML("beforeend", loadingModalHtml);
        const loadingEl = document.getElementById("importLoadingModal");
        const bsLoad = new bootstrap.Modal(loadingEl, { keyboard: false });
        bsLoad.show();

        const formData = new FormData();
        formData.append("file", input.files[0]);

        // 如果完全取代，可多傳一個 forceReplace 標記（後端可參考）
        if (this.importMode === 'replace') {
            formData.append("forceReplace", "true");
        }

        /* ◆◆ 新增 ◆◆
         續著匯入時，加一個 splitVersion=true，
         告訴後端「同一頁若有多個版本就幫我拆開存」。
        */
        if (this.importMode === 'append') {
            formData.append("splitVersion", "true");
        }


        // 根據 importMode 決定 API Endpoint
        const url = this.importMode === 'append'
            ? '/Customer/SurveyEdit/AppendImportDocumentData'
            : '/Customer/SurveyEdit/ImportDocumentData';

        console.log(`➡️ POST to ${url}`);

        fetch(url, {
            method: 'POST',
            body: formData
        })
            .then(resp => {
                bsLoad.hide();
                loadingEl.remove();
                const ct = resp.headers.get("content-type") || "";
                return ct.includes("application/json")
                    ? resp.json()
                    : resp.text().then(txt => { throw new Error(txt); });
            })
            .then(data => {
                if (data.success) {
                    alert((this.importMode === 'append' ? "續著匯入" : "匯入") + "成功：" + data.message);
                    if (window.docExpTable) window.docExpTable.ajax.reload();
                    $('#loadNotesModal').modal('show');
                } else {
                    alert((this.importMode === 'append' ? "續著匯入" : "匯入") + "失敗：" + data.message);
                }
            })
            .catch(err => {
                bsLoad.hide();
                loadingEl.remove();
                console.error(err);
                alert("匯入發生錯誤：" + err.message);
            });
    }



        /** ★ 完全匯出（保留舊 triggerExport 行為） ★ **/
        static triggerFullExport() {
            const bs = bootstrap.Modal.getInstance(document.getElementById("importExportModal"));
            if (bs) bs.hide();
            window.location.href = '/Customer/SurveyEdit/ExportDocumentData';
        }

        /** ★ 只匯出「每頁」最新版本 ★ **/
        static triggerLatestExport() {
            const bs = bootstrap.Modal.getInstance(document.getElementById("importExportModal"));
            if (bs) bs.hide();
            window.location.href = '/Customer/SurveyEdit/ExportLatestVersionData';
        }



    /**
   * 切換編輯模態視窗的「編輯功能」：當關閉時，雙擊 label 無反應；當開啟時，雙擊 label 可正常呼出編輯模態視窗。
   */
    static toggleEditModal() {
        // 如果全域變數未定義，預設設為 true
        if (window.editingModalEnabled === undefined) {
            window.editingModalEnabled = true;
        }
        // 如果目前編輯功能啟用，則關閉
        if (window.editingModalEnabled) {


            surveyEditer.removeAllLabelTextClick();


            window.editingModalEnabled = false;
            // 如果編輯模態視窗目前處於開啟狀態，則先關閉
            var editModalEl = document.getElementById('editTextModal');
            var modalInstance = bootstrap.Modal.getOrCreateInstance(editModalEl);
            if (editModalEl.classList.contains('show')) {
                modalInstance.hide();
            }
            alert("編輯功能已關閉，雙擊標籤將不再呼出編輯視窗。");
        } else {

            surveyEditer.initAllLabelTextClick();

            // 反之，啟用編輯功能
            window.editingModalEnabled = true;
            // 重新初始化標籤雙擊事件，確保功能恢復
            //surveyEditer.initAllLabelTextClick();
            alert("編輯功能已啟用，雙擊標籤可呼出編輯視窗。");
        }
    }
}

// 將 savePageToDatabaseMgr 設為全域物件
window.savePageToDatabaseMgr = savePageToDatabaseMgr;
