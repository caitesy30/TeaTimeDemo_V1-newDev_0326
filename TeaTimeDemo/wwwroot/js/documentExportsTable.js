/********************************************************************
 * documentExportsTable.js
 * 功能：將 DataTable 與 Buttons 設定獨立出來
 ********************************************************************/

class DocumentExportsTable {
    /**
     * 初始化 DocumentExports 的 DataTable (只執行一次)
     */
    static init() {
        if (window.docExpTable) return; // 已經初始化過就跳過

        window.docExpTable = $('#documentExportsTable').DataTable({
            dom: 'Bfrtip',
            buttons: [
                // 這裡可以複製「重排版本」、「重排ID」、「匯入/匯出」等按鈕設定
                {
                    text: '重排版本',
                    className: 'btn btn-warning',
                    action: function (e, dt, node, config) {
                        // 關閉 loadNotesModal 並移除 backdrop
                        if ($('#loadNotesModal').hasClass('show')) {
                            $('#loadNotesModal').modal('hide');
                            $('.modal-backdrop').remove();
                        }
                        // 密碼驗證
                        Swal.fire({
                            title: '請輸入管理員密碼',
                            input: 'password',
                            inputLabel: '管理員密碼',
                            inputPlaceholder: '請輸入密碼',
                            showCancelButton: true,
                            confirmButtonText: '送出',
                            cancelButtonText: '取消'
                        }).then((pwdResult) => {
                            if (pwdResult.isConfirmed) {
                                if (pwdResult.value === 'Admin123*') {
                                    Swal.fire({
                                        title: '確定要重置所有版本為 1？',
                                        text: '此操作無法還原，請謹慎',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonText: '確定',
                                        cancelButtonText: '取消'
                                    }).then((result) => {
                                        if (result.isConfirmed) {
                                            fetch('/Customer/SurveyEdit/ResetAllVersions', { method: 'POST' })
                                                .then(r => r.json())
                                                .then(res => {
                                                    if (res.success) {
                                                        Swal.fire('完成', res.message, 'success');
                                                        dt.ajax.reload();
                                                    } else {
                                                        Swal.fire('失敗', res.message, 'error');
                                                    }
                                                })
                                                .catch(err => {
                                                    console.error(err);
                                                    Swal.fire('失敗', err.message, 'error');
                                                });
                                        }
                                    });
                                } else {
                                    Swal.fire('密碼錯誤', '您輸入的密碼不正確', 'error');
                                }
                            }
                        });
                    }
                },
                {
                    text: '重排ID',
                    className: 'btn btn-warning',
                    action: function (e, dt) {
                        Swal.fire({
                            title: '確定要重排 ID？',
                            text: '將更新所有 HtmlSection 的 DocumentExportId。',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: '確定',
                            cancelButtonText: '取消'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                fetch('/Customer/SurveyEdit/ReorderDocumentExportsViaNewTable', { method: 'POST' })
                                    .then(r => r.json())
                                    .then(res => {
                                        if (res.success) {
                                            Swal.fire('完成', res.message, 'success');
                                            dt.ajax.reload();
                                        } else {
                                            Swal.fire('失敗', res.message, 'error');
                                        }
                                    })
                                    .catch(err => {
                                        console.error(err);
                                        Swal.fire('失敗', err.message, 'error');
                                    });
                            }
                        });
                    }
                },
                {
                    text: '<i class="bi bi-box-arrow-in-down"></i>',
                    titleAttr: "匯入/匯出",
                    className: 'btn btn-outline-secondary',
                    action: function () {
                        savePageToDatabaseMgr.showImportExportModal();
                    }
                }
            ],
            ajax: {
                url: '/Customer/SurveyEdit/GetAllDocumentExports',
                dataSrc: ''
            },
            columns: [
                { data: 'id' },
                { data: 'category' },
                { data: 'station' },
                { data: 'pageNo' },
                { data: 'suffix' },
                { data: 'documentId' },
                { data: 'version' },  
                {
                    data: null,
                    render: (data, type, row) => `
<button class="btn btn-sm btn-primary me-2"
        onclick="DocumentExportsTable.showVersionSelect(${row.id})">

  載入
</button>
<button class="btn btn-sm btn-danger"
        onclick="savePageToDatabaseMgr.deleteDocument(${row.id})">
  刪除
</button>`
                }
            ],
            columnDefs: [
                { className: "text-center align-middle", targets: "_all" }
            ]
        });
    }

    static showVersionSelect(docId) {
        if (!document.getElementById('versionSelectModal')) {
            const html = `
<div class="modal fade" id="versionSelectModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">載入或比較版本</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <div class="mb-3">
          <label>載入版本：</label>
          <select id="versionSelectLoad" class="form-select">
            <option>讀取中…</option>
          </select>
        </div>
        <hr/>
        <div class="mb-3">
          <label>比較版本：</label>
          <div class="d-flex gap-2">
            <select id="versionSelectA" class="form-select"><option>讀取中…</option></select>
            <select id="versionSelectB" class="form-select"><option>讀取中…</option></select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button id="compareBtn" class="btn btn-secondary" disabled>比較版本</button>
        <button id="versionConfirmBtn" class="btn btn-primary" disabled>確定載入</button>
        <button class="btn btn-secondary" data-bs-dismiss="modal">取消</button>
      </div>
    </div>
  </div>
</div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        }

        const modalEl = document.getElementById('versionSelectModal'),
            bsModal = new bootstrap.Modal(modalEl),
            loadSel = document.getElementById('versionSelectLoad'),
            selA = document.getElementById('versionSelectA'),
            selB = document.getElementById('versionSelectB'),
            btnCompare = document.getElementById('compareBtn'),
            btnLoad = document.getElementById('versionConfirmBtn');

        // loading state
        [loadSel, selA, selB].forEach(s => s.innerHTML = `<option>讀取中…</option>`);
        btnCompare.disabled = btnLoad.disabled = true;

        // 讀版本
        fetch(`/Customer/SurveyEdit/GetAvailableVersions?documentId=${docId}`)
            .then(r => r.json())
            .then(versions => {
                versions.sort((a, b) => a - b);
                const latest = Math.max(...versions),
                    opts = versions.map(v => `<option value="${v}">版本 ${v}</option>`).join('');
                loadSel.innerHTML = versions.map(v =>
                    `<option value="${v}"${v === latest ? ' selected' : ''}>版本 ${v}</option>`
                ).join('');
                selA.innerHTML = opts;
                selB.innerHTML = opts;
                btnLoad.disabled = false;
                const toggleCompare = () => btnCompare.disabled = selA.value === selB.value;
                selA.onchange = selB.onchange = toggleCompare;
            })
            .catch(() => [loadSel, selA, selB].forEach(s => s.innerHTML = `<option>載入失敗</option>`));

        // 確定載入
        btnLoad.onclick = () => {
            const v = loadSel.value;
            bsModal.hide();
            savePageToDatabaseMgr.loadDocumentVersion(docId, v);
        };

        // 按「比較版本」 → 呼叫我們新改的 showCompareModal
        btnCompare.onclick = () => {
            const vA = selA.value,
                vB = selB.value;
            bsModal.hide();
            Promise.all([
                fetch(`/Customer/SurveyEdit/GetFullHtml?documentId=${docId}&version=${vA}`).then(r => r.json()),
                fetch(`/Customer/SurveyEdit/GetFullHtml?documentId=${docId}&version=${vB}`).then(r => r.json())
            ]).then(([dataA, dataB]) => {
                if (dataA.success && dataB.success) {
                    // 這裡改成呼叫 DocumentExportsTable.showCompareModal
                    DocumentExportsTable.showCompareModal(dataA, dataB, docId);
                } else {
                    Swal.fire('載入比較版本失敗', '', 'error');
                }
            });
        };

        bsModal.show();
    }


    /**
     * （可註解掉或移除，因為我們直接用 FloatingBookWindow.showViewDifferencesModal）
     * static showCompareModal(...) { ... }
     */


    /**
     * 顯示「版本比較」並可選擇載入哪一版
     */
    static showCompareModal(dataA, dataB, docId) {
        const diff = FloatingBookWindow.highlightDifferences(dataA.htmlContent, dataB.htmlContent);

        Swal.fire({
            title: `版本 ${dataA.version}　｜　版本 ${dataB.version}`,
            width: '90%',
            heightAuto: false,
            background: '#ECF4EC',
            color: '#2B2B2B',
            html: `
<div style="display: flex; flex-direction: row; height: 70vh; margin: 0; padding: 0;">
  <div style="flex: 1; padding: 8px; border-right: 1px solid #C2C2C2; overflow: auto; transform: scale(0.90); transform-origin: top left; color: #2B2B2B;">
    <h6 style="margin-top:0; margin-bottom:8px; font-weight:bold;">版本 ${dataA.version}</h6>
    ${diff.oldVersion}
  </div>
  <div style="flex: 1; padding: 8px; overflow: auto; transform: scale(0.90); transform-origin: top left; color: #2B2B2B;">
    <h6 style="margin-top:0; margin-bottom:8px; font-weight:bold;">版本 ${dataB.version}</h6>
    ${diff.newVersion}
  </div>
</div>
        `,
            showCancelButton: true,
            showDenyButton: true,
            confirmButtonText: `載入版本 ${dataA.version}`,
            denyButtonText: `載入版本 ${dataB.version}`,
            cancelButtonText: '取消',
            confirmButtonColor: '#86B386',
            cancelButtonColor: '#D2D2D2'
        }).then(result => {
            if (result.isConfirmed) {
                savePageToDatabaseMgr.loadDocumentVersion(docId, dataA.version);
            } else if (result.isDenied) {
                savePageToDatabaseMgr.loadDocumentVersion(docId, dataB.version);
            }
            // 取消不做任何事
        });
    }









}

// 掛到全域，方便呼叫
window.DocumentExportsTable = DocumentExportsTable;
