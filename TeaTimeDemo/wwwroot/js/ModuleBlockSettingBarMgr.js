/**************************************************/
/* ModuleBlockSettingBarMgr.js          BBT      
/* 負責在指定的 ModuleBlock 裡插入工具列 (下方列) */
/**************************************************/
class ModuleBlockSettingBarMgr {

    /**
     * [初始化]：在頁面點擊空白處時，自動移除所有工具列
     */
    //static init() {
    //    // 使用純 JavaScript 來綁定點擊事件，避免依賴 jQuery
    //    document.addEventListener('click', function (e) {
    //        // 如果點擊的是 <select> 元素或其子元素，則不移除工具列
    //        if (e.target.tagName.toLowerCase() === 'select' || e.target.closest('select') !== null) {
    //            return;
    //        }

    //        // 延遲執行，以確保 <select> 的行為先執行
    //        setTimeout(() => {
    //            let isInsideModule = e.target.closest('.ModuleBlock') !== null;
    //            let isInsideUpToolBar = e.target.closest('.UpSettingBar') !== null;
    //            let isInsideDownToolBar = e.target.closest('.DownSettingBar') !== null;
    //            let isinsideArea = e.target.closest('.settingAreaContainer') !== null;
    //            let isInsideGear = e.target.closest('#gearButton') !== null; // ★ 新增

    //            // 若都不在 .ModuleBlock 或 .UpSettingBar/.DownSettingBar，就移除所有工具列
    //            if (!isInsideModule && !isInsideUpToolBar && !isInsideDownToolBar && !isinsideArea) {
    //                //document.querySelectorAll('.UpSettingBar').forEach(bar => bar.remove());
    //                //document.querySelectorAll('.DownSettingBar').forEach(bar => bar.remove());
    //                document.querySelectorAll('.settingAreaContainer').forEach(bar => bar.remove());
    //            }
    //        }, 0); // 使用 0 毫秒延遲
    //    });

    //    document.addEventListener('click', this.handleDocumentClick, true);
    //}

    static init() {
        // 頁面空白點擊：移除 settingAreaContainer
        document.addEventListener('click', function (e) {
            if (e.target.tagName.toLowerCase() === 'select' || e.target.closest('select')) {
                return;
            }
            setTimeout(() => {
                let insideModule = !!e.target.closest('.ModuleBlock');
                let insideArea = !!e.target.closest('.settingAreaContainer');
                if (!insideModule && !insideArea) {
                    document.querySelectorAll('.settingAreaContainer').forEach(bar => bar.remove());
                }
            }, 0);
        });

        // 這裡改回「冒泡」階段，才能讓你的 bubble listener 也跑到
        document.addEventListener('click', this.handleDocumentClick /*, false */);
    }

    static handleDocumentClick(e) {
        const panel = document.getElementById('floatingSettingBar');
        const module = e.target.closest('.ModuleBlock');

        if (module) {
            // 阻止冒泡避免被上面那個空白移除器吸掉
            e.stopPropagation();
            ModuleBlockSettingBarMgr.showPanel(module, e.pageX, e.pageY);
        } else if (panel && !panel.contains(e.target)) {
            panel.remove();
        }
    }

    static showPanel(module, x, y) {
        const TargetModuleBlock = ModuleBlock_Main.GetSelectTarget();
        let panel = document.getElementById('floatingSettingBar');

        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'floatingSettingBar';
            Object.assign(panel.style, {
                position: 'absolute',
                zIndex: 1000,
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                padding: '8px'
            });
            panel.addEventListener('click', e => e.stopPropagation());
            document.body.appendChild(panel);
            ModuleBlockSettingBarMgr.makeDraggable(panel);
        }

        // 清空
        panel.innerHTML = '';

        // 保留「是否填寫」按鈕
        if (!TargetModuleBlock.dataset.OptionMode) {
            panel.appendChild(this.createOptionBtn(TargetModuleBlock));
        }

        // 插入上下兩列
        panel.appendChild(ModuleBlockSettingBarMgr.creatUpSettingBar(module));
        panel.appendChild(ModuleBlockSettingBarMgr.creatDownSettingBar(module));

        // 定位
        panel.style.left = (x + 50) + 'px';
        panel.style.top = (y + 18) + 'px';
    }




    static makeDraggable(el) {
        let isDragging = false;
        let startX = 0, startY = 0;

        function onMouseDown(e) {
            // 如果點到 <select>、<option> 或任何按鈕，就不要啟動拖曳
            if (e.target.closest('select') || e.target.closest('option') || e.target.closest('button')) {
                return;
            }
            isDragging = true;
            startX = e.clientX - el.offsetLeft;
            startY = e.clientY - el.offsetTop;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
            e.preventDefault();
        }

        function onMouseMove(e) {
            if (!isDragging) return;
            el.style.left = (e.clientX - startX) + 'px';
            el.style.top = (e.clientY - startY) + 'px';
        }

        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }

        el.addEventListener('mousedown', onMouseDown);
    }


    //================[核心：插入齒輪按鈕 + showFloatingPanel]================

    /**
     * [插入齒輪按鈕]：在 toolBar 末端加入 <button><i class="bi bi-gear"></i></button>
     */
    static insertGearMenuButton(toolBar) {
        const gearButton = document.createElement("button");
        gearButton.classList.add("gear-menu-button");
        gearButton.innerHTML = `<i class="bi bi-gear"></i>`;
        toolBar.appendChild(gearButton);

        // 綁定點擊 -> 顯示浮動面板
        gearButton.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showFloatingPanel(toolBar, gearButton);
        });
    }

    /**
     * [顯示浮動面板]：建立一個浮動面板，內容含「複製、刪除、必填、更多設定」等功能
     * @param {HTMLElement} toolBar
     * @param {HTMLElement} gearButton
     */
    static showFloatingPanel(toolBar, gearButton) {


        //if (!ModuleBlockElementMgr.checkIsModuleBlock(TargetModuleBlock)) return;
        //const ModuleBlock_inner = TargetModuleBlock.querySelector("." + ModuleBlockElementMgr.ModuleBlock_innerName);
        //const TextBox = TargetModuleBlock.querySelector("." + ModuleBlockElementMgr.TextBoxName);
        //const area = document.createElement('div');
        //area.classList.add('settingAreaContainer');
        //if (!TargetModuleBlock.dataset.OptionMode) { area.appendChild(this.createOptionBtn(TargetModuleBlock)) }

        //area.appendChild(this.creatUpSettingBar(TargetModuleBlock));
        //area.appendChild(this.creatDownSettingBar(TargetModuleBlock));
        //this.insertGearMenuButton(area);
        //ModuleBlock_inner.insertBefore(area, TextBox.nextSibling);
        //console.log(area.offsetWidth);
        //AutoScreen_js.resetAutoScreenBlockSize();



        let TargetModuleBlock = ModuleBlock_Main.GetSelectTarget();

        let floatPanel = document.getElementById("customFloatPanel");


        
        if (!floatPanel) {
            floatPanel = document.createElement("div");
            floatPanel.id = "customFloatPanel";
            floatPanel.classList.add("custom-float-panel");
            document.body.appendChild(floatPanel);

            // 點擊空白關閉
            document.addEventListener("click", (evt) => {
                if (!floatPanel.contains(evt.target) && evt.target !== gearButton) {
                    floatPanel.style.display = "none";
                }
              
            });
        }
        //////////////////////////////////////////////////////////////////


        floatPanel.innerHTML = "";
        var area = this.createSettingBar(floatPanel);
        
            //  if (!ModuleBlockElementMgr.checkIsModuleBlock(TargetModuleBlock)) return;
            //  area = floatPanel;
            //  area.innerHTML = "";
            //  if (!TargetModuleBlock.dataset.OptionMode) { area.appendChild(this.createOptionBtn(TargetModuleBlock)) }
            //  
            //  area.appendChild(this.creatUpSettingBar(TargetModuleBlock));
            //  area.appendChild(this.creatDownSettingBar(TargetModuleBlock));
        
            console.log(area.offsetWidth);
        
        
        //    //////////////////////////////////////////////////////////////////
        //    floatPanel.innerHTML = ""; // 清空
        //
        //    // 2.1) 「單選／複選」下拉選單
        //    const singleMultiSelect = document.createElement("select");
        //    singleMultiSelect.classList.add("form-select", "me-2");
        //    // 建立兩個 option: 單選 / 複選
        //    const optRadio = document.createElement("option");
        //    optRadio.value = "radio";
        //    optRadio.textContent = "單選";
        //
        //    const optCheckbox = document.createElement("option");
        //    optCheckbox.value = "checkbox";
        //    optCheckbox.textContent = "複選";
        //
        //    singleMultiSelect.appendChild(optRadio);
        //    singleMultiSelect.appendChild(optCheckbox);
        //
        //    // 依當前模組的 checkboxType 設定預設
        //    const theBlock = toolBar.closest(".ModuleBlock");
        //    if (theBlock) {
        //        const ctype = theBlock.dataset.checkboxType; // "radio" or "checkbox"
        //        singleMultiSelect.value = ctype || "radio"; // 預防無值時預設radio
        //    }
        //    // 監聽下拉選單切換
        //    singleMultiSelect.addEventListener("change", (evt) => {
        //        evt.stopPropagation();
        //        const newType = evt.target.value; // "radio" or "checkbox"
        //        const block = toolBar.closest(".ModuleBlock");
        //        if (!block) return;
        //        // 呼叫您已有的切換函式
        //        if (newType === "radio") {
        //            ModuleOptionEditor.SetAllOptionBecome_Radio(block);
        //        } else {
        //            ModuleOptionEditor.SetAllOptionBecome_CheckBox(block);
        //        }
        //        // 也可更新 block.dataset.checkboxType = newType;
        //        block.dataset.checkboxType = newType;
        //
        //        // ★★★【同步上方/下方原本的下拉】★★★
        //        // 1) 找到 UpSettingBar 上的 select
        //        const upSelect = block.querySelector(".UpSettingBar select.custom-select");
        //        if (upSelect) {
        //            upSelect.value = newType;
        //        }
        //
        //        //2) 若 DownSettingBar 也有下拉
        //        const downSelect = block.querySelector(".DownSettingBar select.custom-select");
        //        if (downSelect) {
        //            downSelect.value = newType;
        //        }
        //
        //        // 結束後關閉面板或保留都行
        //        floatPanel.style.display = "none";
        //    });
        //
        //    // 加入面板
        //    floatPanel.appendChild(singleMultiSelect);
        //
        //    // 3) 新增選項 按鈕
        //    const addOptionBtn = document.createElement("button");
        //    addOptionBtn.classList.add("btn", "btn-light", "me-2");
        //    addOptionBtn.innerHTML = `<i class="bi bi-plus-square"></i>`;
        //    addOptionBtn.title = "新增選項";
        //    addOptionBtn.addEventListener("click", (evt) => {
        //        evt.stopPropagation();
        //        const block = toolBar.closest(".ModuleBlock");
        //        if (block) {
        //            ModuleOptionEditor.createOption(block);
        //            Tab_EditTableMgr.UpdateTargetInner();
        //             AutoScreen_js.resetAutoScreenBlockSize();
        //        }
        //        floatPanel.style.display = "none";
        //    });
        //    floatPanel.appendChild(addOptionBtn);
        //
        //    // 新增模塊按鈕
        //    const addModuleBtn = document.createElement("button");
        //    addModuleBtn.classList.add("btn", "btn-light", "bi-layers");
        //    // 使用 bi-layers 或 bi-layers-fill 都可以
        //    //addModuleBtn.innerHTML = `<i class="bi bi-layers"></i>`;
        //    addModuleBtn.title = "新增模塊";
        //    addModuleBtn.onclick = (e) => {
        //        e.stopPropagation();
        //        // 在此撰寫您要「新增模塊」的邏輯
        //        // 例如：
        //        // ModuleBlockCreatMgr.createNewModuleBlock(...);
        //        //alert("已執行『新增模塊』操作！");
        //        ModuleOptionEditor.AddModuleBlockIn(ModuleBlock_Main.GetSelectTarget());
        //    }
        //
        //    //let TargetModuleBlock = ModuleBlock_SelectTargetMgr.SetModuleBlockSelectTarget(targetModuleBlock)
        //    floatPanel.appendChild(addModuleBtn);
        //
        //    // 檢查核選按鈕 (block.setValiState...等, 若無請自行修改/移除)
        //    if (!TargetModuleBlock.dataset.OptionMode) { floatPanel.appendChild(this.createOptionBtn(TargetModuleBlock)) }
        //    const checkCheckBtn = document.createElement("button");
        //    checkCheckBtn.classList.add("btn", "btn-light", "bi-clipboard-check", "checkCheckBtn");
        //    //checkCheckBtn.innerHTML = `<i class="bi bi-check2-square"></i>`;  // 圖示：方框打勾
        //    checkCheckBtn.title = "檢查核選";
        //    //bi-clipboard-check
        //    // 綁定點擊事件
        //    checkCheckBtn.onclick = (e) => {
        //        e.stopPropagation();
        //        const target = ModuleBlock_Main.GetSelectTarget();
        //        if (target.dataset.needvali === 'true') {
        //            block.setValiState(false);
        //        } else {
        //            block.setValiState(true);
        //        }
        //        block.setValiArea();
        //        //alert("執行檢查核選的程式碼！");
        //    };
        //    floatPanel.appendChild(checkCheckBtn);
        //
        //
        //
        //
        //    // === 加入「複製」按鈕 ===
        //    const copyBtn = document.createElement("button");
        //    copyBtn.classList.add("btn", "btn-light", "me-2");
        //    copyBtn.innerHTML = `<i class="bi bi-files"></i>`;
        //    copyBtn.title = "複製";
        //    copyBtn.onclick = (e) => {
        //        e.stopPropagation();
        //        const block = toolBar.closest(".ModuleBlock");
        //        if (block) this.copyModuleBlock(block);
        //        floatPanel.style.display = "none";
        //    };
        //    floatPanel.appendChild(copyBtn);
        //
        //    // === 加入「刪除」按鈕 ===
        //    const delBtn = document.createElement("button");
        //    delBtn.classList.add("btn", "btn-light", "me-2");
        //    delBtn.innerHTML = `<i class="bi bi-trash"></i>`;
        //    delBtn.title = "刪除";
        //    delBtn.onclick = (e) => {
        //        e.stopPropagation();
        //        const block = toolBar.closest(".ModuleBlock");
        //        if (block) this.deleteModuleBlock(block);
        //        floatPanel.style.display = "none";
        //    };
        //    floatPanel.appendChild(delBtn);
        //
        //    // === 加入「必填」切換 ===
        //    const switchWrap = document.createElement("div");
        //    switchWrap.classList.add("form-check", "form-switch", "d-inline-flex", "align-items-center", "me-2");
        //    switchWrap.style.marginBottom = "0";
        //    switchWrap.innerHTML = `
        //      <input class="form-check-input" type="checkbox" role="switch" id="requiredSwitch_Float">
        //      <label class="form-check-label ms-1" for="requiredSwitch_Float">必填</label>`;
        //    switchWrap.querySelector("input").addEventListener("change", (evt) => {
        //        evt.stopPropagation();
        //        const block = toolBar.closest(".ModuleBlock");
        //        if (!block) return;
        //        const checkbox = block.querySelector("._checkbox");
        //        if (checkbox) {
        //            checkbox.required = evt.target.checked;
        //            alert("本模塊必填狀態：" + checkbox.required);
        //        }
        //        floatPanel.style.display = "none";
        //    });
        //    //floatPanel.appendChild(switchWrap);
        //    //新增模塊 2.檢查核選
        //
        //    // === 加入「更多設定」按鈕 ===
        //    const moreBtn = document.createElement("button");
        //    moreBtn.classList.add("btn", "btn-light");
        //    moreBtn.innerHTML = `<i class="bi bi-three-dots"></i>`;
        //    moreBtn.onclick = (e) => {
        //        e.stopPropagation();
        //        const blockId = toolBar.dataset.moduleblockid;
        //        this.openMoreSettings(blockId);
        //        floatPanel.style.display = "none";
        //    };
        //    floatPanel.appendChild(moreBtn);
        //
        //// 定位到齒輪按鈕旁

        floatPanel.style.display = "block";
        floatPanel.style.position = "absolute";
        const rect = gearButton.getBoundingClientRect();
        floatPanel.style.top = (window.scrollY + rect.bottom + 5) + "px";
        floatPanel.style.left = (window.scrollX + rect.right + 5) + "px";
    }



    //========================================================
    // [新增] 用於檢查「本工具列」是否已停止過 Click 冒泡的布林值
    //========================================================
    static CheckEventisEnd_SettingBar_Click(event) {
        // 取得旗標 (若之前已被設定過，這裡就會是 true)
        let isEnd = event.SettingBar_Click_Isend;
        // 若尚未處理，則本次設定為已處理
        event.SettingBar_Click_Isend = true;

        // 回傳給呼叫端知道是否已被處理
        return isEnd;
    }



    ///創建工具列
    static addSettingBar(TargetModuleBlock) {

   
        if (!ModuleBlockElementMgr.checkIsModuleBlock(TargetModuleBlock)) return;
        const ModuleBlock_inner = TargetModuleBlock.querySelector("." + ModuleBlockElementMgr.ModuleBlock_innerName);
        const TextBox = TargetModuleBlock.querySelector("." + ModuleBlockElementMgr.TextBoxName);

        const area = this.createSettingBar();


        this.insertGearMenuButton(area);
        ModuleBlock_inner.insertBefore(area, TextBox.nextSibling);
        console.log(area.offsetWidth);
         AutoScreen_js.resetAutoScreenBlockSize();

    }


    static createSettingBar(area) {
        var TargetModuleBlock = ModuleBlock_Main.GetSelectTarget();

        if (area == null) {
            area = document.createElement('div');
            area.classList.add('settingAreaContainer');
        }

       
        if (TargetModuleBlock.dataset.OptionMode!="true") { area.appendChild(this.createOptionBtn(TargetModuleBlock)) }

        area.appendChild(this.creatUpSettingBar(TargetModuleBlock));
        area.appendChild(this.creatDownSettingBar(TargetModuleBlock));
        
        return area;


        //  if (!ModuleBlockElementMgr.checkIsModuleBlock(TargetModuleBlock)) return;
        //  area = floatPanel;
        //  area.innerHTML = "";
        //  if (!TargetModuleBlock.dataset.OptionMode) { area.appendChild(this.createOptionBtn(TargetModuleBlock)) }
        //
        //  area.appendChild(this.creatUpSettingBar(TargetModuleBlock));
        //  area.appendChild(this.creatDownSettingBar(TargetModuleBlock));
    }



    ///創建選項開關
    static createOptionBtn(TargetModuleBlock) {
        
        const btn = document.createElement('button');
        btn.classList.add('optionSwitch', "btn", "btn-light", "bi-check2-square");
        btn.setAttribute('title', '是否填寫')
        btn.dataset.enable = false;

        TargetModuleBlock = ModuleBlock_Main.GetSelectTarget();

        const checkbox = ModuleDataFetcherMgr.GetTargetModuleBlock_CheckBox(TargetModuleBlock);

        if (checkbox.style.display != 'none') {
            btn.dataset.enable = true;
        }

         
        btn.addEventListener('click', (event) => {
            ModuleBlock_SelectTargetMgr.showModuleBlockSelectTarget();
          

            if (btn.dataset.enable === 'false') {
                ModuleOptionEditor.SetAnswer(TargetModuleBlock, true);
                
                btn.dataset.enable = "true";
               
            } else {
                ModuleOptionEditor.SetAnswer(TargetModuleBlock, false);
                btn.dataset.enable = "false";
               
            }
        });
        return btn;
    }

    /**
 * [插入工具列]：在目標模塊的底部插入工具列 (可改成插入到其他位置)
 * @param {HTMLElement} TargetModuleBlock - 指定的 ModuleBlock
 */
    static addSettingUpBar(TargetModuleBlock) {
        // 檢查是否為真正的 ModuleBlock
        if (!ModuleBlockElementMgr.checkIsModuleBlock(TargetModuleBlock)) return;


        // 建立新的工具列
        const UpSettingBar = this.creatUpSettingBar(TargetModuleBlock);

        // 找到「.ModuleBlock_inner」
        const ModuleBlock_inner = TargetModuleBlock.querySelector("." + ModuleBlockElementMgr.ModuleBlock_innerName);
        const TextBoxDiv = TargetModuleBlock.querySelector("." + ModuleBlockElementMgr.TextBoxName);

        
        if (!ModuleBlock_inner) {
            return;
        }

        if (!ModuleBlock_inner) return;

        // 將工具列插到文字框前面      
        ModuleBlock_inner.insertBefore(UpSettingBar, TextBoxDiv.nextSibling); //塞在文字框前面


      

        // 重新計算畫面
         AutoScreen_js.resetAutoScreenBlockSize();
    }


    /**
     * [插入工具列]：在目標模塊的底部插入工具列 (可改成插入到其他位置)
     * @param {HTMLElement} TargetModuleBlock - 指定的 ModuleBlock
     */
    static addSettingDownBar(TargetModuleBlock) {
        // 檢查是否為真正的 ModuleBlock
        if (!ModuleBlockElementMgr.checkIsModuleBlock(TargetModuleBlock)) { console.warn("addSettingDownBar warn"); return; }

        // 建立新的工具列
        const DownSettingBar = this.creatDownSettingBar(TargetModuleBlock);

        // 找到「.ModuleBlock_inner」
        const ModuleBlock_inner = TargetModuleBlock.querySelector("." + ModuleBlockElementMgr.ModuleBlock_innerName);
        if (!ModuleBlock_inner) { console.warn("addSettingDownBar warn"); return; }

        // 將工具列插到底部
        ModuleBlock_inner.appendChild(DownSettingBar);

        // 重新計算畫面
         AutoScreen_js.resetAutoScreenBlockSize();
    }


    //========================UpSettingBar工具的內容=================================
    /**
   * [建立工具列核心]：示範左側複製/刪除，右側必填 Switch / 更多設定
   * @param {HTMLElement} TargetModuleBlock - 目標模塊
   * @returns {HTMLDivElement} 工具列容器
   */
    static creatUpSettingBar(TargetModuleBlock) {
        // 建立最外層容器
        const newUpSettingBar = document.createElement("div");
        newUpSettingBar.classList.add("UpSettingBar");
        //newUpSettingBar.classList.add("UpSettingBar", "d-flex", "justify-content-between", "w-100");
        newUpSettingBar.dataset.ModuleBlockId = TargetModuleBlock.id;

       
        // 獲取當前目標的 checkboxType
        let currentType = "radio"; //默認值 radio
        const selectTarget = TargetModuleBlock;// ModuleBlock_Main.GetSelectTarget();
        if (selectTarget.dataset.checkboxType === "radio") {
            // 如果目標是單選
            currentType = "radio";
        } else if (selectTarget.dataset.checkboxType === "checkbox") {
            // 如果目標是複選
            currentType = "checkbox";
        } else {
            // 錯誤處理
            console.error("未知的 checkboxType:", selectTarget.dataset.checkboxType);
        }
        //========== 下拉選單 ==========
        const addOptionBtn = document.createElement("button");

        const dropdownOptions = [
            {
                text: "單選",
                value: "radio",
                onClick: () => {

                    ModuleOptionEditor.SetAllOptionBecome_Radio(TargetModuleBlock);
                    //this.updateUI(TargetModuleBlock);
                }
            },
            {
                text: "複選",
                value: "checkbox",
                onClick: () => {
            
                    ModuleOptionEditor.SetAllOptionBecome_CheckBox(TargetModuleBlock);
                    //this.updateUI(TargetModuleBlock);
                }
            }
        ];

        // 建立下拉選單，並設定預設選項
        const selectElement = this.createSelect(
            `select_${TargetModuleBlock.id}`, // 唯一的下拉選單 ID
            "選擇操作",         // 預設顯示的文字
            dropdownOptions,
            currentType         // 傳入當前選項
        );


        // 放進工具列
        //leftTools.appendChild(addOptionDropdown);
        if (TargetModuleBlock.dataset.QuestionMode =="true") {
            newUpSettingBar.appendChild(selectElement);
        }

        //========== 右邊：新增按鈕 ==========
        // 新增選項按鈕
      
        addOptionBtn.classList.add("btn", "btn-light", "bi-node-plus");
        //addOptionBtn.innerHTML = `<i class="bi bi-plus-square"></i>`; // icon: 加號方塊 (新增選項)
        addOptionBtn.title = "新增選項";
        addOptionBtn.onclick = async (e) => {
            e.stopPropagation();// 僅阻止自身，不用布林值檢查

            await ModuleOptionEditor.createOption(TargetModuleBlock);

            //ModuleBlock_SelectTargetMgr.SetModuleBlockSelectTarget(TargetModuleBlock);

            if (TargetModuleBlock.dataset.QuestionMode == "true") {
                //newUpSettingBar.appendChild(selectElement);
                newUpSettingBar.insertBefore(selectElement, addOptionBtn);

            }

            ModuleBlock_SelectTargetMgr.SetModuleBlockShowAssociation(TargetModuleBlock);
            Tab_EditTableMgr.UpdateTargetInner();
            AutoScreen_js.resetAutoScreenBlockSize();

        };

        // ============= 加入「新增模塊」按鈕 =============
        const addModuleBtn = document.createElement("button");//bi bi-plus-circle
        addModuleBtn.classList.add("btn", "btn-light", "bi-plus-circle");
        // 使用 bi-layers 或 bi-layers-fill 都可以
        //addModuleBtn.innerHTML = `<i class="bi bi-layers"></i>`;
        addModuleBtn.title = "新增模塊";
        addModuleBtn.onclick = (e) => {
            e.stopPropagation();
            // 在此撰寫您要「新增模塊」的邏輯
            // 例如： ModuleBlockCreatMgr.createNewModuleBlock(...);
            //alert("已執行『新增模塊』操作！");
            ModuleOptionEditor.AddModuleBlockIn(ModuleBlock_Main.GetSelectTarget());
        };

        //============== 加入「檢查核選」按鈕 ==============
        const checkCheckBtn = document.createElement("button");
        checkCheckBtn.classList.add("btn", "btn-light", "bi-clipboard-check");
        //checkCheckBtn.innerHTML = `<i class="bi bi-check2-square"></i>`;  // 圖示：方框打勾
        checkCheckBtn.title = "檢查核選";
        //bi-clipboard-check
        // 綁定點擊事件
        checkCheckBtn.onclick = (e) => {
            e.stopPropagation();
            const target = TargetModuleBlock;
            if (target.dataset.needvali === 'true') {
                block.setValiState(false);
            } else {
                block.setValiState(true);
            }
            block.setValiArea();
            //alert("執行檢查核選的程式碼！");
        };


        const space = document.createElement("div");
   
        space.classList.add("bi", "bi-pause-fill");
        space.style.width = "25px";
        space.style.display = "flex";
        space.style.justifyContent = "center"; // 水平置中
        space.style.alignItems = "center"; // 垂直置中
        space.style.opacity = "0.2"; // 0 完全透明，1 完全不透明

        if (TargetModuleBlock.dataset.GridMode != "true") {

            
            //將此按鈕加到工具列末端-新增選項
            newUpSettingBar.appendChild(addOptionBtn);

            newUpSettingBar.appendChild(space);

            // 將此按鈕加到工具列末端-新增模塊
            newUpSettingBar.appendChild(addModuleBtn);
        }
        else {
            newUpSettingBar.appendChild(space);

        }






        // 最後，把這個按鈕也加到工具列-核選
        newUpSettingBar.appendChild(checkCheckBtn);


        return newUpSettingBar;
    }

    /**
 * [更新 UI] - 用於在新增選項後更新界面
 * @param {HTMLElement} TargetModuleBlock - 目標模塊
 */
    static updateUI(TargetModuleBlock) {
        // 根據需要實現 UI 更新邏輯
        // 例如，重新綁定事件、刷新視圖等
        AutoScreen_js.resetAutoScreenBlockSize();
    }

    /**
     * [創建下拉選單（<select>）]：
     * @param {string} selectId - 下拉選單的 ID
     * @param {string} defaultText - 下拉選單預設顯示的文字
     * @param {Array} options - 下拉選單的選項，每個選項包含 text、value 和 onClick 函數
     * @returns {HTMLElement} - 下拉選單的 <select> 元素
     */
    static createSelect(selectId, defaultText, options, selectedValue = null) {
       
        // 建立 <select> 元素
        const selectElement = document.createElement("select");
        selectElement.classList.add("form-select");
        //selectElement.setAttribute("aria-label", "Large select example");
        selectElement.id = `select_${selectId}`;

        // 建立預設選項
        const defaultOption = document.createElement("option");
        defaultOption.selected = true;
        defaultOption.disabled = true; // 防止選擇預設選項
        defaultOption.textContent = defaultText; // 移除 <i> 標籤
        selectElement.appendChild(defaultOption);

        // 建立其他選項
        options.forEach(option => {
            const optionElement = document.createElement("option");
            optionElement.value = option.value || option.text;
            optionElement.textContent = option.text;
            if (selectedValue && option.value === selectedValue) {
                optionElement.selected = true;
                defaultOption.selected = false; // 取消預設選項的選中狀態
            }
            selectElement.appendChild(optionElement);
        });

        // 添加 change 事件監聽器
        selectElement.addEventListener("change", (e) => {
            const selectedValue = e.target.value;
            const selectedOption = options.find(opt => opt.value === selectedValue || opt.text === selectedValue);
            if (selectedOption && typeof selectedOption.onClick === "function") {
                selectedOption.onClick();
            }

            // 更新目標元素的 data-checkboxType 屬性
            ModuleBlock_Main.GetSelectTarget().dataset.checkboxType = selectedValue;

            // 如果要馬上切換 => 
            if (selectedValue === "radio") {
                ModuleOptionEditor.SetAllOptionBecome_Radio(ModuleBlock_Main.GetSelectTarget());
            } else {
                ModuleOptionEditor.SetAllOptionBecome_CheckBox(ModuleBlock_Main.GetSelectTarget());
            }

            // ★★★【同步齒輪面板的下拉】★★★
            // 取得該模塊
            const theBlock = ModuleBlock_Main.GetSelectTarget(); // 或 e.target.closest(".ModuleBlock")
            if (!theBlock) return;

            // 找出浮動面板裡的下拉 (若已顯示)
            const floatPanel = document.getElementById("customFloatPanel");
            if (floatPanel && floatPanel.style.display === "block") {
                const gearSelect = floatPanel.querySelector("select.form-select");
                if (gearSelect) {
                    gearSelect.value = selectedValue;
                }
            }

            //也可再同步到下方工具列 select (若下方也有)
            const downSelect = theBlock.querySelector(".DownSettingBar select.custom-select");
            if (downSelect) {
                downSelect.value = selectedValue;
            }


            // 可選：重設選擇為預設選項
            //e.target.selectedIndex = 0;
        });

        // 防止點擊 <select> 觸發全局點擊事件
        selectElement.addEventListener("click", function (e) {

            // 檢查是否已被自己(或其他 SettingBar)阻止過
            if (!ModuleBlockSettingBarMgr.CheckEventisEnd_SettingBar_Click(e)) {
                // 若尚未阻止 -> 只在此處終止冒泡，不影響其他程式之 MouseEnter/Drag 等
                e.stopPropagation();
            }
        });

        return selectElement;
    }


    // 靜態方法：更新目標模塊的 label 最後的折疊圖示
    static updateLabelCollapseIcon(TargetModuleBlock, collapsed) {
        // 取得該模塊內 textBox 的 label 元素
        TargetModuleBlock.dataset.collapsed = collapsed;
        var settingAreaContainer = ModuleDataFetcherMgr.GetTargetModuleBlock_Inner(TargetModuleBlock)
            .querySelector(`:scope > .settingAreaContainer`);
        if (settingAreaContainer) {
            var chevron = settingAreaContainer.querySelector(".bi-chevron-up,.bi-chevron-down");

            if (chevron) {

                chevron.classList.remove("bi-chevron-up", "bi-chevron-down");

                if (collapsed) {
                    chevron.classList.add("bi-chevron-down");
                }
                else {

                    chevron.classList.add("bi-chevron-up");
                }
            }
        }





        const textBox = ModuleDataFetcherMgr.GetTargetModuleBlock_TextBox(TargetModuleBlock);
        if (!textBox) return;

        let collapseIcon = textBox.querySelector(":scope > .collapse-icon");
        // 若折疊狀態：若沒有圖示則新增
        if (!collapseIcon) {
            collapseIcon = document.createElement("span");
            collapseIcon.classList.add("collapse-icon");
            collapseIcon.style.cursor = "pointer";
            // 設定絕對定位，置於右側並置中垂直
            collapseIcon.style.fontSize = "8px";
            collapseIcon.innerHTML = `<i class="bi bi-chevron-down"></i>`;
            textBox.appendChild(collapseIcon);
            // 點擊圖示也能切換（模擬下方按鈕點擊）
            collapseIcon.addEventListener("click", ModuleBlockSettingBarMgr.CollapseIconAction);
            textBox.appendChild(collapseIcon);
        } else {
            collapseIcon.innerHTML = `<i class="bi bi-chevron-down"></i>`;
        }

        if (collapsed) {

            if (
                !ModuleDataFetcherMgr.GetTargetModuleBlock_OnceTable(TargetModuleBlock).querySelector("." + ModuleBlockElementMgr.ModuleBlockName)
                &&
                TargetModuleBlock.dataset.GridMode != "true")  //表格沒開
            {
                return;
            }

            collapseIcon.innerHTML = `<i class="bi bi-chevron-down"></i>`;

        } else {

            var _labelElement = textBox.querySelector("label");

            if (_labelElement.style.fontSize == "0px") {
                collapseIcon.innerHTML = ``;
                //collapseIcon.innerHTML = `<i class="bi bi-backpack2"></i>`;
            }
            else {

                collapseIcon.innerHTML = `<i class="bi bi-chevron-up"></i>`;
            }

            //collapseIcon.innerHTML = `<i class="bi bi-chevron-up"></i>`;
            //collapseIcon.innerHTML = ``;
        }
    }

    static setAllCollapseIconAction() {

        document.querySelectorAll(`.${ModuleBlockElementMgr.ModuleBlockName}`).forEach(
            (TargetModuleBlock) => {

                const textBox = ModuleDataFetcherMgr.GetTargetModuleBlock_TextBox(TargetModuleBlock);
                if (!textBox) { return };

                let collapseIcon = textBox.querySelector(":scope > .collapse-icon");

                if (collapseIcon) {

                    collapseIcon.removeEventListener("click", ModuleBlockSettingBarMgr.CollapseIconAction);

                    collapseIcon.addEventListener("click", ModuleBlockSettingBarMgr.CollapseIconAction);
                }
            }
        );
    }

    //設定所有折疊類型
    static setAllCollapseType(bool) {

        document.querySelectorAll(`.${ModuleBlockElementMgr.ModuleBlockName}`).forEach(
            (TargetModuleBlock) => {

                if (ModuleDataFetcherMgr.getAllChilds(TargetModuleBlock).length <= 0 && bool) {
                    return;
                }

               ModuleBlockEditMgr.setCollapse(TargetModuleBlock, bool);
            }
        );
    }


    static CollapseIconAction(event) {

        event.stopPropagation();

        var TargetModuleBlock = ModuleDataFetcherMgr.GetTargetModuleBlock(event.target);

        ModuleBlockSettingBarMgr.toggleCollapse(TargetModuleBlock);
    }

    static toggleCollapse(TargetModuleBlock) {
        // 讀取目前折疊狀態，預設為展開（"false"）
        const isCollapsed = (TargetModuleBlock.dataset.collapsed === "true");

        ModuleBlockEditMgr.setCollapse(TargetModuleBlock, !isCollapsed);

    }

    static async setCollapse(TargetModuleBlock, setCollapsed) {

        
        // 以 TargetModuleBlock.dataset.GridMode 判斷是否為 grid 模式（注意：確保此屬性已正確設定為 "true" 或 "false"）
        const isGrid = (TargetModuleBlock.dataset.GridMode === "true");


        //console.log("toggleCollapse " + setCollapsed);

      
       ModuleBlockEditMgr.setCollapse(TargetModuleBlock, setCollapsed);
        //設定為摺疊
        if (setCollapsed) {

            //(將相關表格的 display 設為 "none")
            if (isGrid) {
                ModuleBlockEditMgr.OpenModuleBlock_TableGrid(TargetModuleBlock, false);
            } else {
                ModuleBlockEditMgr.OpenModuleBlock_OnceTable(TargetModuleBlock, false);
            }


        } else {

            await ModuleBlockEditMgr.OpenModuleBlock_TableGrid(TargetModuleBlock, false);
            ModuleBlockEditMgr.OpenModuleBlock_OnceTable(TargetModuleBlock, false);

            //設定為展開
            if (isGrid) {
                await ModuleBlockEditMgr.OpenModuleBlock_TableGrid(TargetModuleBlock, true);


            } else {

                //如果列表裡面有東西
                if (
                    ModuleDataFetcherMgr.GetTargetModuleBlock_OnceTable(TargetModuleBlock).querySelector("." + ModuleBlockElementMgr.ModuleBlockName)
                ) {

                    ModuleBlockEditMgr.OpenModuleBlock_OnceTable(TargetModuleBlock, true);
                }
                else {


                    const textBox = ModuleDataFetcherMgr.GetTargetModuleBlock_TextBox(TargetModuleBlock);
                    if (!textBox) { return };
                    let collapseIcon = textBox.querySelector(":scope > .collapse-icon");
                    if (collapseIcon) {
                        //collapseIcon.style.backgroundColor = "cyan";
                        collapseIcon.remove();
                    }
                }

            }
        }

    }



    //========================DownSettingBar工具的內容=================================
    /**
     * [建立工具列核心]：示範左側複製/刪除，右側必填 Switch / 更多設定
     * @param {HTMLElement} TargetModuleBlock - 目標模塊
     * @returns {HTMLDivElement} 工具列容器
     */
    static creatDownSettingBar(TargetModuleBlock) {
        // 建立最外層容器
        const newDownSettingBar = document.createElement("div");
        newDownSettingBar.classList.add("DownSettingBar");
        newDownSettingBar.dataset.ModuleBlockId = TargetModuleBlock.id;

        //========== 左邊：複製 與 刪除 按鈕 ==========

        // 複製按鈕
        const copyBtn = document.createElement("button");
        copyBtn.classList.add("btn", "btn-light", "bi-files");
        //copyBtn.innerHTML = `<i class="bi bi-files"></i>`;  // icon: 檔案疊疊
        copyBtn.title = "複製本模塊";
        copyBtn.onclick = (e) => {
            e.stopPropagation();// 僅阻止自己的冒泡
            ModuleBlockSettingBarMgr.copyModuleBlock(TargetModuleBlock);
        };

        // 刪除按鈕
        const deleteBtn = document.createElement("button");
        deleteBtn.classList.add("btn", "btn-light", "bi-trash");
        //deleteBtn.innerHTML = `<i class="bi bi-trash"></i>`; // icon: 垃圾桶
        deleteBtn.title = "刪除本模塊";
        deleteBtn.onclick = (e) => {
            e.stopPropagation();// 僅阻止自己的冒泡

           


            this.deleteModuleBlock(TargetModuleBlock);
    
        };

        // ===【新增】刪除模塊中所有 <textarea> 的按鈕 ===
        const removeAllTextareaBtn = document.createElement("button");
        removeAllTextareaBtn.classList.add("btn", "btn-light", "bi-x-square"); // 選個喜歡的 icon
        removeAllTextareaBtn.title = "刪除本模塊中的所有文字輸入欄";
        removeAllTextareaBtn.onclick = (e) => {
            e.stopPropagation(); // 只阻止自己的冒泡
            // 取得此模塊裡所有 <textarea>
            const allTextareas = TargetModuleBlock.querySelectorAll("textarea");
            allTextareas.forEach(txt => {
                txt.remove(); // 直接 remove
            });
            //alert("已刪除本模塊中所有的 <textarea> 文字輸入欄！");
        };

        // ===【新增】刪除模塊中所有的模塊 的按鈕 ===
        const removeAllModuleBtn = document.createElement("button");
        removeAllModuleBtn.classList.add("btn", "btn-light", "bi-x-circle"); // 使用 bi-x-circle 作為圖示
        removeAllModuleBtn.title = "刪除本模塊中的所有模塊";
        removeAllModuleBtn.onclick = (e) => {
            e.stopPropagation(); // 只阻止自己的冒泡
            // 取得此模塊內所有的 .ModuleBlock 元素（包含所有子層模塊）
            const allModules = TargetModuleBlock.querySelectorAll(".ModuleBlock");
            allModules.forEach(mod => {
                mod.remove(); // 直接刪除模塊
            });
            //alert("已刪除本模塊中所有的模塊！");
        };

        // 放進工具列
        newDownSettingBar.appendChild(copyBtn);
        newDownSettingBar.appendChild(deleteBtn);
        newDownSettingBar.appendChild(removeAllTextareaBtn);
        newDownSettingBar.appendChild(removeAllModuleBtn);

        //========== 右邊：必填 Switch + 更多設定 ==========

        // 建立右側容器
        const rightSide = document.createElement("div");
        rightSide.classList.add("switchArea");

        //【新增折疊按鈕】－用 dataset 來記錄狀態
        // 在 ModuleBlockSettingBarMgr 類別中（creatDownSettingBar 方法內右側按鈕區段）
        const collapseBtn = document.createElement("button");
        collapseBtn.classList.add("btn", "btn-light", "collapse-toggle");
        collapseBtn.title = "折疊/展開選項";


        // 初始預設為展開狀態，顯示向上箭頭
        // 設定初始狀態為展開（collapsed 為 false）
        if (TargetModuleBlock.dataset.collapsed != "true") {
            TargetModuleBlock.dataset.collapsed = "false";
            collapseBtn.classList.add("bi", "bi-chevron-up");
            //rightSide.style.backgroundColor = "red";
        }
        else {
            collapseBtn.classList.add("bi-chevron-down");
            //rightSide.style.backgroundColor = "green";
        }


        collapseBtn.onclick = (e) => {
            e.stopPropagation();

            ModuleBlockSettingBarMgr.toggleCollapse(TargetModuleBlock);
        };

        rightSide.appendChild(collapseBtn);

        //==========【新增】隱藏/取消隱藏 TableGrid 外框的按鈕 ==========
        const toggleTableGridBtn = document.createElement("button");
        toggleTableGridBtn.classList.add("btn", "btn-light");
        toggleTableGridBtn.title = "隱藏/取消隱藏表格外框";
        // 初始顯示隱藏圖示（可依需求自行設定初始狀態）
        toggleTableGridBtn.innerHTML = `<i class="bi bi-eye-slash"></i>`;
        toggleTableGridBtn.onclick = (e) => {
            e.stopPropagation();
            const tableGrid = ModuleDataFetcherMgr.GetTargetModuleBlock_TableGrid(TargetModuleBlock);
            if (!tableGrid) {
                console.warn("找不到 TableGrid 元素");
                return;
            }
            // 判斷當前是否有隱藏樣式
            if (tableGrid.classList.contains("tableStyle_hide")) {
                tableGrid.classList.remove("tableStyle_hide");
                // 更新按鈕圖示（此處設定為隱藏圖示）
                toggleTableGridBtn.innerHTML = `<i class="bi bi-eye-slash"></i>`;
            } else {
                tableGrid.classList.add("tableStyle_hide");
                // 更新按鈕圖示（此處設定為顯示圖示）
                toggleTableGridBtn.innerHTML = `<i class="bi bi-eye"></i>`;
            }
        };
        // 將新按鈕加入右側容器
        rightSide.appendChild(toggleTableGridBtn);



        //【如果原有更多設定按鈕需保留】再接續加入更多設定按鈕
        const moreSettingsBtn = document.createElement("button");
        moreSettingsBtn.classList.add("btn", "btn-light");
        moreSettingsBtn.title = "更多設定";
        moreSettingsBtn.innerHTML = `<i class="bi bi-three-dots"></i>`;
        moreSettingsBtn.onclick = (e) => {
            e.stopPropagation();
            this.openMoreSettings(TargetModuleBlock.id);
        };
        rightSide.appendChild(moreSettingsBtn);

        newDownSettingBar.appendChild(rightSide);

        return newDownSettingBar;
    }

 
    /**
    * 複製模組的主流程：先把舊 ID 樹轉成新型式，再複製 + 重編
    * @param {HTMLElement} TargetModuleBlock
    */
    static async copyModuleBlock(TargetModuleBlock) {
        // 1) 如果原始 ID 不是「新前綴」，先把這棵樹重新編號並 normalize
        //if (!TargetModuleBlock.id.startsWith(ModuleBlockElementMgr.ModuleBlockID_Prefix)) {
        //    await ModuleBlockSettingBarMgr.normalizeIds(TargetModuleBlock);
        //    ModuleBlockSettingBarMgr.normalizeModuleBlockStructure(TargetModuleBlock);
        //}

        // 2) 深度 clone + 重編 clone 上的所有 ID / input
        const cloned = await ModuleBlockSettingBarMgr.cloneWithNewIds(TargetModuleBlock);

        // 3) 插回頁面、重綁事件
        TargetModuleBlock.insertAdjacentElement('afterend', cloned);
        ModuleBlockCreatMgr.ReSetAll_ModuleBlock_EventAction();
        AutoScreen_js.resetAutoScreenBlockSize();
        ModuleBlock_SelectTargetMgr.SetModuleBlockSelectTarget(cloned);
    }


    static async cloneWithNewIds(TargetModuleBlock) {
        /* ---------- 1. 收集原始順序 ---------- */
        const origBlocks = [TargetModuleBlock, ...TargetModuleBlock.querySelectorAll('.ModuleBlock')];

        /* ---------- 2. 建立「選項 ➜ 父題目」對照 ---------- */
        const origParentMap = {};
        origBlocks.forEach(mb => {
            const isOpt = mb.dataset.optionMode === 'true' || mb.getAttribute('data--option-mode') === 'true';
            if (!isOpt) return;

            /* 2‑A 直接用 input.name 取得父題目 id（最保險） */
            const inpOld = mb.querySelector('input.option_checkbox');
            let parentId = inpOld ? inpOld.name : null;

            /* 2‑B ★★ 改用 mb.closest(...)，杜絕 null ---------- */
            if (!parentId || !origBlocks.some(b => b.id === parentId)) {
                const parentQ = mb.closest(
                    '.ModuleBlock[data-question-mode="true"], .ModuleBlock[data--question-mode="true"]'
                );
                parentId = parentQ ? parentQ.id : TargetModuleBlock.id;
            }
            origParentMap[mb.id] = parentId;
        });

        /* ---------- 3. 深拷貝並 normalize ---------- */
        const clonedRoot = TargetModuleBlock.cloneNode(true);
        ModuleBlockSettingBarMgr.normalizeModuleBlockStructure(clonedRoot);

        /* ---------- 4. 產生新 id 對照 ---------- */
        const cloneBlocks = [clonedRoot, ...clonedRoot.querySelectorAll('.ModuleBlock')];
        const idMap = {};
        for (let i = 0; i < cloneBlocks.length; i++) {
            await ModuleBlockCreatMgr.ModuleBlockIdStart();
            const newId = ModuleBlockElementMgr.ModuleBlockID_Prefix + ModuleBlockCreatMgr.getModuleBlockId();
            idMap[origBlocks[i].id] = newId;
            cloneBlocks[i].id = newId;
        }

        /* ---------- 5. 重新配置 input / label ---------- */
        for (let i = 0; i < cloneBlocks.length; i++) {
            const mb = cloneBlocks[i];
            const key = mb.id.replace(ModuleBlockElementMgr.ModuleBlockID_Prefix, '');
            const inp = mb.querySelector('input.option_checkbox');
            if (!inp) continue;

            // 5‑1 id / value
            inp.id = 'Opt_' + key;
            inp.value = key;

            // 5‑2 name
            const isOpt = mb.dataset.optionMode === 'true' || mb.getAttribute('data--option-mode') === 'true';
            if (isOpt) {
                const oldParentId = origParentMap[origBlocks[i].id];
                inp.name = idMap[oldParentId] || clonedRoot.id;
            } else {
                inp.name = 'Bool_' + key;
            }

            // 5‑3 同步 label
            const lab = mb.querySelector('label[for]');
            if (lab) lab.setAttribute('for', inp.id);
        }

        /* ---------- 6. Done ---------- */
        return clonedRoot;
    }











    /**
     * [刪除模塊]
     */
    static deleteModuleBlock(TargetModuleBlock) {


        var TargetModuleBlockParentNode = TargetModuleBlock.parentNode;
        var parentModuleBlock = ModuleDataFetcherMgr.GetTargetModuleBlock(TargetModuleBlockParentNode);

        if (!confirm("確定要刪除此模塊？")) return;
        block.deleteRecord(TargetModuleBlock);
        TargetModuleBlock.remove();

        AutoScreen_js.resetAutoScreenBlockSize();


        //document.querySelector(`#${TargetModuleBlock.id}`).dataset.isRemove = "true";



        alert(document.querySelector(`#${TargetModuleBlock.id}`));
        alert("模塊已刪除！");


        if (parentModuleBlock)
        {
            console.error("有父親");
            ModuleBlockEditMgr.setCollapse(parentModuleBlock, false);

            ModuleOptionEditor.checkHasOption(parentModuleBlock);
        }
    }

    /**
     * [切換必填 - HTML方式]
     */
    static toggleRequiredHTML(moduleBlockId, event) {
        event.stopPropagation();
        const isChecked = event.target.checked;
        console.log(`[HTML] 必填狀態 = ${isChecked}`);

        const TargetModuleBlock = document.getElementById(moduleBlockId);
        if (!TargetModuleBlock) return;

        const checkbox = TargetModuleBlock.querySelector("._checkbox");
        if (!checkbox) {
            alert("本模塊沒有 checkbox，無法切換必填。");
            return;
        }
        checkbox.required = isChecked;
        alert(`本模塊必填狀態已切換為：${checkbox.required}`);
    }

    /**
     * [更多設定]
     */
    static openMoreSettings(moduleBlockId) {
        alert("開啟更多設定... (此處可自訂彈窗或其他 UI)\n模塊ID=" + moduleBlockId);
    }

    //==================載入html=============================================
    /**
    * [匯入檔案]：流程為
    *  1) 彈出視窗讓使用者選 .txt
    *  2) 讀取檔案文字，裡面是 HTML
    *  3) 透過 parseHTML => 產生暫時的 DOM
    *  4) 對於 .ModuleBlock 逐一「clone + 重新編號」 => Append 到頁面上
    */
    /**
   * (★) 重點：改寫 importTxtAndProcess()，可同時處理
   *  1) 從檔案 (.txt) 匯入
   *  2) 從字串 (HTML) 匯入
   * - 當呼叫: importTxtAndProcess() => 開檔案對話框
   * - 當呼叫: importTxtAndProcess("<div> ... </div>") => 直接解析 HTML
   */
    static async importTxtAndProcess(htmlString = null) {

        // 如果呼叫時傳入了 htmlString (表示從外部已拿到HTML)
        if (htmlString) {
            await this.importHtmlString(htmlString);
            return;
        }

        // 否則走原本檔案流 (.txt)
        // 1) 建立 <input type="file"> 專用來選 txt
        const inputFile = document.createElement("input");
        inputFile.type = "file";
        inputFile.accept = ".txt";

        // 2) 監聽 change: 使用者選完檔案
        inputFile.addEventListener("change", async (event) => {
            const file = event.target.files[0];
            if (!file) return;

            // 檢查副檔名 (可再加嚴謹判斷)
            if (!file.name.endsWith(".txt")) {
                alert("請選擇 .txt 檔案！");
                return;
            }

            try {
                // 3) 讀取檔案內容(文字)
                const content = await file.text();
                await this.importHtmlString(content);
            } catch (err) {
                console.error("讀取檔案失敗:", err);
                alert("匯入失敗：" + err.message);
            }

        });

        // 觸發選擇檔案
        inputFile.click();
    }

    /**
  * (★) 處理來自「HtmlSection組成的HTML字串」或 txt內容
  *     - 會將字串 parse，找最外層 .ModuleBlock
  *     - clone + reId => append 到 #AutoScreen
  */
    static async importHtmlString(htmlContent) {
        try {

            // 4) 將文字 parse 成 DOM
            const tempWrapper = document.createElement("div");
            tempWrapper.innerHTML = htmlContent;
            //   => content 若含 <div class="ModuleBlock"> ... 會保留 DOM 結構

            // 5) 先抓出 tempWrapper 裏所有的 .ModuleBlock
            const allBlocks = Array.from(tempWrapper.querySelectorAll(".ModuleBlock"));

            // 只保留“最外層”模組，條件是：它沒有父 .ModuleBlock 或其父不在 allBlocks 裏
            const rootBlocks = allBlocks.filter(block => {
                const parentMB = block.parentElement?.closest(".ModuleBlock");
                // 如果 parentMB 不存在，代表本身就是最外層
                // 或者 parentMB 不在 allBlocks 之中，表示是更外圍 (不是同一批)
                return !parentMB || !allBlocks.includes(parentMB);
            });

            if (rootBlocks.length === 0) {
                alert("匯入內容沒有找到任何最外層 .ModuleBlock。");
                return;
            }

            // 6) 逐一把 rootBlocks 做 clone + 重新編號，再插到 #AutoScreen (或其他位置)
            //    - 也可視需求一次把 tempWrapper 整個 clone
            const autoScreen = document.getElementById("AutoScreen");

            if (!autoScreen) {
                alert("無法找到 #AutoScreen 區域！");
                return;
            }

            for (const block of rootBlocks) {
                // a) cloneBlock
                const newBlock = await ModuleBlockSettingBarMgr.cloneWithoutNewIds(block);

                // b) 加到畫面上
                autoScreen.appendChild(newBlock);

                // c) 重新綁定事件（如果有這步的話也可以加上）
            }


            ModuleBlockCreatMgr.ReSetAll_ModuleBlock_EventAction();
            // 7) 重整畫面
             AutoScreen_js.resetAutoScreenBlockSize();
            alert("匯入成功，所有 .ModuleBlock 已新增至畫面！");

        } catch (err) {
            console.error("讀取檔案失敗:", err);
            alert("匯入失敗：" + err.message);
        }
    }

    /**
      * 「複製 HtmlPort」按鈕主流程
      * 1. 先撈出目前畫面最外層的 ModuleBlock（備份）
      * 2. 跳 confirm：true 就清空畫面，false 就保留
      * 3. 依 backup 清單 cloneWithNewIds → append
      */
    static async importHtmlStringChang() {
        const btn = document.getElementById("cloneHtmlBtn");
        const spinner = document.getElementById("cloneHtmlSpinner");
        btn.disabled = true;
        spinner.classList.remove("d-none");

        try {
            const autoScreen = document.getElementById("AutoScreen");
            if (!autoScreen) throw new Error("找不到 #AutoScreen");

            // 1) 備份目前畫面上的最外層 ModuleBlock
            const originals = Array
                .from(autoScreen.children)
                .filter(el => el.classList.contains("ModuleBlock"));

            if (originals.length === 0) {
                alert("目前畫面沒有任何 ModuleBlock 可複製。");
                return;
            }

            // 2) 詢問使用者「清空」或「直接 append」
            const clearAll = confirm(
                "按「確定」會先清空所有既有模組再貼上；按「取消」則直接 append 到後面。"
            );
            if (clearAll) {
                autoScreen.innerHTML = "";
            }

            // 3) 依照備份逐一 cloneWithNewIds → append
            for (const block of originals) {
                // （可視需要先 normalize）
                const cloned = await ModuleBlockSettingBarMgr.cloneWithNewIds(block);
                ModuleBlockSettingBarMgr.normalizeModuleBlockStructure(block);

           
                autoScreen.appendChild(cloned);
            }

            // 4) 重綁事件、重算
            ModuleBlockCreatMgr.ReSetAll_ModuleBlock_EventAction();
            AutoScreen_js.resetAutoScreenBlockSize();
        } catch (err) {
            console.error("importHtmlStringChang 錯誤：", err);
            alert("複製失敗：" + err.message);
        } finally {
            spinner.classList.add("d-none");
            btn.disabled = false;
        }
    }



    /**
 * [新] 只做深度 clone，不改任何 id/name/value
 * @param {HTMLElement} TargetModuleBlock
 * @returns {HTMLElement} cloned node
 */
    static cloneWithoutNewIds(TargetModuleBlock) {
        // 直接深度 clone DOM，保留所有原本的 id、name、value
        return TargetModuleBlock.cloneNode(true);
    }


    /**
 * [匯出檔案] - 將目前畫面上的所有 .ModuleBlock (或您指定的區域，如 #AutoScreen) 轉成 HTML 字串後，
 *  以 .txt 形式觸發下載。
 */
    static exportModulesToTxt() {
        try {
            // 1) 取得 #AutoScreen 內容
            const autoScreen = document.getElementById("AutoScreen");
            if (!autoScreen) {
                alert("無法找到 AutoScreen 區域！");
                return;
            }

            // 2) 取得檔名（使用 prompt 或其他 UI）
            //    預設 "myModules" 當檔名，若使用者按取消，則直接 return
            const fileName = prompt("請輸入想儲存的檔名(不含副檔名)", "myModules");
            if (!fileName) {
                // 使用者取消或輸入空字串就不進行匯出
                return;
            }

            // 3) 抓出 HTML 內容
            const htmlContent = autoScreen.innerHTML;

            // 4) 建立 Blob 來進行下載
            const blob = new Blob([htmlContent], { type: "text/plain" });
            const url = URL.createObjectURL(blob);

            // 5) 建立 <a> 元素，下載 .txt
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName + ".txt";   // 使用者輸入的檔名 + .txt
            document.body.appendChild(link);
            link.click();

            // 6) 清理 
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            alert(`匯出成功，已下載「${fileName}.txt」！`);

        } catch (err) {
            console.error("匯出失敗:", err);
            alert("匯出失敗：" + err.message);
        }
    }





    /**
        * [新] 將一棵 ModuleBlock 樹中所有沒有新前綴的 id 重新編號
        * @param {HTMLElement} root 最外層 .ModuleBlock
        */
    static async normalizeIds(root) {
        const blocks = [root, ...root.querySelectorAll('.ModuleBlock')];
        for (const mb of blocks) {
            // 如果不是以新前綴開頭，就向 ModuleBlockCreatMgr 申請新編號
            if (!mb.id.startsWith(ModuleBlockElementMgr.ModuleBlockID_Prefix)) {
                await ModuleBlockCreatMgr.ModuleBlockIdStart();
                const newNum = ModuleBlockCreatMgr.getModuleBlockId();
                mb.id = ModuleBlockElementMgr.ModuleBlockID_Prefix + newNum;
            }
        }
    }


    /**
     * 将「老版」匯入 或 复制作出来的 DOM 一次补齐到「新版」格式：
     * - 保留每个模块自身的 data-* 属性
     * - 给所有 radio/checkbox input 加上 .option_checkbox
     * - **最关键**：所有不属于根模块（root）的选项 input，name 都统一设置成 root.id
     */
    static normalizeModuleBlockStructure(root) {
        // Fix 每个模块自身的 data-* 属性
        root.querySelectorAll('.ModuleBlock').forEach(mb => {
            if (!mb.dataset.checkboxType) {
                mb.dataset.checkboxType = mb.getAttribute('data-checkbox-type') || 'radio';
            }
            if (mb.hasAttribute('data-need-answered')) {
                mb.dataset.needAnswered = mb.getAttribute('data-need-answered');
            }
            const qm = mb.getAttribute('data--question-mode') || mb.getAttribute('data-question-mode');
            if (qm != null) mb.dataset.questionMode = qm;
            const om = mb.getAttribute('data--option-mode')
                    ?? mb.getAttribute('data-option-mode');
            if (om != null) mb.dataset.optionMode = om;
        });

        // 统一所有选项 input 的 class + name
        root.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(inp => {
            inp.classList.add('option_checkbox');
            const parentMB = inp.closest('.ModuleBlock');
            if (!parentMB) return;
            // 不是最外层 root，就把 name 绑到 root.id
            if (parentMB !== root && parentMB.dataset.optionMode === 'true') {
                inp.name = root.id;
            }
            // 根模块保留它自己的 Bool_xxx name
        });
    }




    /**
     * [範例：匯入按鈕觸發]
     * 在您的「匯入按鈕」(帶 .bi-upload 的) onclick 時呼叫這個。
     * 也可把下列程式碼放到 surveyEditer.js or site.js 皆可。
     */
    static bindImportButton() {
        const importButton = document.querySelector('button[title="匯入"]');
        if (!importButton) return;

        importButton.addEventListener("click", (event) => {
            // 顯示一個 offcanvas (或 modal) 都可以
            // 假設已經做好一個 #htmlUploadCanvas offcanvas



            const offCanvas = new bootstrap.Offcanvas("#htmlUploadCanvas");
            offCanvas.show();

            // 或者直接呼叫 importTxtAndProcess() 也行：
            // this.importTxtAndProcess();
        });
    }

}
