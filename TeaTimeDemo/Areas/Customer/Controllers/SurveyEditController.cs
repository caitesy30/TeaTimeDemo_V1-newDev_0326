

//SurveyEditController.cs

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http;                            // 用於發HTTP請求
using System.Text.Json;                           // 用於序列化 JSON
using System.Threading.Tasks;
using System;
using System.Linq;
using System.Drawing.Imaging;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using HtmlAgilityPack;                            // 解析 HTML
using TeaTimeDemo.DataAccess.Repository.IRepository;
using TeaTimeDemo.Models;                         // 包含 DocumentExport
using TeaTimeDemo.Models.AnswersData;
using TeaTimeDemo.Models.AnswersData.ViewModels;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient; // 若使用 SqlServer
using ClosedXML.Excel;
using System.IO;
using Microsoft.Extensions.Configuration;
using Microsoft.Identity.Client;
using System.Text.RegularExpressions;
using System.Web;
using TeaTimeDemo.Models.DTOs;
using System.Runtime.InteropServices;
using System.Security.Principal;
using Microsoft.Win32.SafeHandles;
using System.Diagnostics;
using PdfiumViewer;
using System.Drawing;
using iText.Kernel.Pdf;           // 引用 iText7
using iText.Kernel.Pdf.Canvas.Parser;  // 若需要其他 iText 功能

using ITextReaderProps = iText.Kernel.Pdf.ReaderProperties;
// 新增別名以解除 PdfDocument 模稜兩可：
using iTextPdfDocument = iText.Kernel.Pdf.PdfDocument;
using PdfiumPdfDocument = PdfiumViewer.PdfDocument;


using System.Text;


namespace TeaTimeDemo.Controllers
{
    [Area("Customer")] // 指定區域為 Customer
    [Authorize] // 確保只有登入的使用者能夠存取
    public class SurveyEditController : Controller
    {
        private readonly IUnitOfWork _unitOfWork;

        private readonly IConfiguration _configuration;

        private readonly IWebHostEnvironment _hostingEnv;

        public SurveyEditController(IUnitOfWork unitOfWork, IWebHostEnvironment hostingEnv, IConfiguration configuration)
        {
            _unitOfWork = unitOfWork;
            _hostingEnv = hostingEnv;
            _configuration = configuration;

        }

        // 顯示所有已發布的問卷
        public IActionResult Index()
        {

            SurveyEditIndexVM SurveyEditIndexVM = new SurveyEditIndexVM();

            ModuleBlock moduleBlock1 = new ModuleBlock { Id = 1, SurveyId = "Survey1" };
            ModuleBlock moduleBlock2 = new ModuleBlock { Id = 2, SurveyId = "Survey1" };
            ModuleBlock moduleBlock3 = new ModuleBlock { Id = 3, SurveyId = "Survey1" };
            ModuleBlock moduleBlock4 = new ModuleBlock { Id = 4, SurveyId = "Survey1" };
            ModuleBlock moduleBlock5 = new ModuleBlock { Id = 5, SurveyId = "Survey1" };
            ModuleBlock moduleBlock6 = new ModuleBlock { Id = 6, SurveyId = "Survey1" };

            moduleBlock1.TextContent = "測試模塊1";
            moduleBlock2.TextContent = "測試模塊2";
            moduleBlock3.TextContent = "測試模塊3";
            moduleBlock4.TextContent = "測試模塊4";
            moduleBlock5.TextContent = "測試模塊5";
            moduleBlock6.TextContent = "測試模塊6";


            moduleBlock1.CheakBoxData.IsCheakBoxMode = true;
            moduleBlock2.CheakBoxData.IsCheakBoxMode = true;
            moduleBlock3.CheakBoxData.IsCheakBoxMode = true;
            moduleBlock4.CheakBoxData.IsCheakBoxMode = true;
            moduleBlock5.CheakBoxData.IsCheakBoxMode = true;
            moduleBlock6.CheakBoxData.IsCheakBoxMode = true;

            moduleBlock1.CheakBoxData.LayerParentId = "測試模塊1";
            moduleBlock2.CheakBoxData.LayerParentId = "測試模塊2";
            moduleBlock3.CheakBoxData.LayerParentId = "測試模塊3";
            moduleBlock4.CheakBoxData.LayerParentId = "測試模塊4";
            moduleBlock5.CheakBoxData.LayerParentId = "測試模塊5";
            moduleBlock6.CheakBoxData.LayerParentId = "測試模塊6";


            moduleBlock1._ModuleBlockS = new List<ModuleBlock>[2, 3];
            moduleBlock1.InitModuleBlockS();


            moduleBlock2._ModuleBlockS = new List<ModuleBlock>[2, 3];
            moduleBlock2.InitModuleBlockS();


            moduleBlock3._ModuleBlockS = new List<ModuleBlock>[2, 3];
            moduleBlock3.InitModuleBlockS();

            moduleBlock5._ModuleBlockS = new List<ModuleBlock>[2, 3];
            moduleBlock5.InitModuleBlockS();



            moduleBlock1._ModuleBlockS[0, 0].Add(moduleBlock2);
            moduleBlock1._ModuleBlockS[0, 1].Add(moduleBlock5);
            moduleBlock1._ModuleBlockS[1, 2].Add(moduleBlock4);
            moduleBlock1._ModuleBlockS[1, 2].Add(moduleBlock6);
            moduleBlock2._ModuleBlockS[0, 0].Add(moduleBlock3);



            SurveyEditIndexVM.MceHtml = moduleBlock1.GetBlockHtml();

            return View(SurveyEditIndexVM);
        }

        // 1. 取得所有 DocumentExport (提供給 DataTables)
        [HttpGet]
        public IActionResult GetAllDocumentExports()
        {
            var list = _unitOfWork.DbContext.DocumentExports
                .Select(d => new
                {
                    d.Id,
                    d.Category,
                    d.Station,
                    d.PageNo,
                    d.Suffix,
                    d.DocumentId,
                    d.Version
                })
                .ToList();

            return Ok(list); // DataTables 預設接收陣列
        }

        // 3. 刪除 DocumentExport (若需要)
        [HttpDelete]
        public IActionResult DeleteDocumentExport(int id)
        {
            var doc = _unitOfWork.DbContext.DocumentExports.FirstOrDefault(d => d.Id == id);
            if (doc == null)
            {
                return Ok(new { success = false, message = "找不到此 DocumentExport" });
            }

            // 刪除對應的 HtmlSections
            var sections = _unitOfWork.DbContext.HtmlSections.Where(h => h.DocumentExportId == doc.Id);
            _unitOfWork.DbContext.HtmlSections.RemoveRange(sections);

            _unitOfWork.DbContext.DocumentExports.Remove(doc);
            _unitOfWork.Save();

            return Ok(new { success = true, message = "刪除成功" });
        }


        public IActionResult TinyMCE()
        {
            return View();
        }

        [HttpPost]
        public IActionResult SaveData(
        string category,
        string station,
        string pageNo,
        string sequenceNo,
        string documentId,   // 從最後一個模塊抓
        string htmlContent,  // HTML 全部內容
        string images,       // 圖片(可能是路徑/網址/Base64)
        string comment       // 備註
        )
        {
            // 新增一筆 DocumentExport
            var newDoc = new DocumentExport
            {
                Category = category,
                Station = station,
                PageNo = pageNo,
                SequenceNo = sequenceNo,
                DocumentId = documentId,
                HtmlContent = htmlContent,
                Images = images,
                Comment = comment
            };

            _unitOfWork.DbContext.DocumentExports.Add(newDoc);
            _unitOfWork.Save(); // 或 _unitOfWork.DbContext.SaveChanges();

            return Ok(new { success = true, message = "匯出資料已儲存。" });
        }



        [HttpPost]
        public IActionResult UpdateModuleText(int moduleId, string textContent)
        {
            // 從存取層獲取對應的 ModuleBlock
            ModuleBlock module = _unitOfWork.ModuleBlock.GetFirstOrDefault(m => m.Id == moduleId);
            if (module == null)
            {
                return NotFound(new { message = "找不到對應的模塊。" });
            }

            // 更新文本內容
            module.TextContent = textContent;

            // 保存變更
            _unitOfWork.Save();

            return Ok(new { message = "文本內容已成功更新。" });
        }

        // -----------------------------------------------------------------------------------
        // 以下為【HtmlAgilityPack】範例：抓取「本 Controller 所在頁面」或由前端傳入的整份 HTML
        // 分析「第一個模塊」與「最後一個模塊」，並將四個欄位 + 文件編號 + 圖片等存入資料庫。
        // -----------------------------------------------------------------------------------

        /// <summary>
        /// (五) 範例：從「前端傳來的整份 HTML」去解析（需自行發 AJAX 或表單送出 pageHtml）
        ///     - 解析出第一個模塊內的 種類 / 站別 / 頁數 / 序號
        ///     - 解析出最後一個模塊內的 文件編號
        ///     - 收集所有圖片路徑
        ///     - 最後存入 DocumentExport。
        /// </summary>
        [HttpPost]
        public IActionResult ParseHtmlAndSave([FromBody] HtmlDto dto)
        {
            try
            {
                // 1. 檢查基本輸入
                if (string.IsNullOrWhiteSpace(dto.PageHtml))
                {
                    return BadRequest("前端未傳入任何 HTML，請檢查輸入。");
                }

                // 2. 取得目前登入使用者（設定 CreateById / CreateByName 時會用到）
                var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                var currentUser = _unitOfWork.ApplicationUser.GetFirstOrDefault(u => u.Id == currentUserId);

                // 3. 用 HtmlAgilityPack 載入整份 HTML
                HtmlDocument doc = new HtmlDocument();
                doc.LoadHtml(dto.PageHtml);

                // 4. 準備好要存/或更新的 DocumentExport
                DocumentExport targetDoc;

                // (A) 如果前端直接有傳 Category/Station/PageNo/DocumentId => 直接使用，否則就從第一、最後模塊解析
                bool hasDirectInput =
                    !string.IsNullOrWhiteSpace(dto.Category) ||
                    !string.IsNullOrWhiteSpace(dto.Station) ||
                    !string.IsNullOrWhiteSpace(dto.PageNo) ||
                    !string.IsNullOrWhiteSpace(dto.DocumentId);

                // 先建立一個暫存用的「可能新資料」(若後面要新增)
                var tempDoc = new DocumentExport();
                if (hasDirectInput)
                {
                    tempDoc.Category = dto.Category?.Trim();
                    tempDoc.Station = dto.Station?.Trim();
                    tempDoc.PageNo = dto.PageNo?.Trim();
                    tempDoc.SequenceNo = dto.SequenceNo?.Trim();
                    tempDoc.DocumentId = dto.DocumentId?.Trim();
                    tempDoc.Suffix = string.IsNullOrWhiteSpace(dto.Suffix) ? "一般" : dto.Suffix.Trim();
                }
                else
                {
                    // --- 舊邏輯：從第一個、最後一個模塊解析 ---
                    var firstModule = doc.DocumentNode.SelectSingleNode("(//div[contains(@class, 'ModuleBlock')])[1]");
                    if (firstModule == null)
                        return BadRequest("找不到【第一個模塊】，請確認前端結構。");

                    string firstText = firstModule.InnerText;
                    string category = ExtractValueAfterLabel(firstText, "種類:");
                    string station = ExtractValueAfterLabel(firstText, "站別:");
                    string pageNo = ExtractValueAfterLabel(firstText, "頁數:");
                    string sequenceNo = ExtractValueAfterLabel(firstText, "序號:");
                    string suffix = ExtractValueAfterLabel(firstText, "後綴:");

                    var lastModule = doc.DocumentNode.SelectSingleNode("(//div[contains(@class, 'ModuleBlock')])[last()]");
                    if (lastModule == null)
                        return BadRequest("找不到【最後一個模塊】，請確認前端結構。");

                    string lastText = lastModule.InnerText;
                    string documentId = ExtractValueAfterLabel(lastText, "文件編號:");

                    tempDoc.Category = category?.Trim();
                    tempDoc.Station = station?.Trim();
                    tempDoc.PageNo = pageNo?.Trim();
                    tempDoc.SequenceNo = sequenceNo?.Trim();
                    tempDoc.DocumentId = documentId?.Trim();
                    tempDoc.Suffix = string.IsNullOrWhiteSpace(suffix) ? "一般" : suffix.Trim();
                }

                // 5. 先檢查是否已存在相同 (Category + Station + PageNo + Suffix)
                var sameDoc = _unitOfWork.DbContext.DocumentExports.FirstOrDefault(d =>
                    d.Category == tempDoc.Category
                    && d.Station == tempDoc.Station
                    && d.PageNo == tempDoc.PageNo
                    && d.Suffix == tempDoc.Suffix
                );

                // (5A) 若已存在同鍵值，而且 forceReplace = false => 回傳給前端做「是否取代」的提示
                if (sameDoc != null && dto.ForceReplace == false)
                {
                    // 這裡拼裝舊的 HTML
                    // 先撈對應 DocumentExportId = sameDoc.Id 的 HtmlSections（依序號/Id排序）
                    var oldSections = _unitOfWork.DbContext.HtmlSections
                                         .Where(h => h.DocumentExportId == sameDoc.Id)
                                         .OrderBy(h => h.Id)
                                         .Select(h => h.HtmlPart)
                                         .ToList();
                    string oldDocHtml = string.Join("", oldSections);


                    return Ok(new
                    {
                        success = false,
                        isDuplicate = true,
                        // 將舊的HTML也回傳
                        oldHtml = oldDocHtml,
                        message = $"已有相同紀錄：種類={tempDoc.Category}, 站別={tempDoc.Station}, 頁數={tempDoc.PageNo}, 後綴={tempDoc.Suffix}"
                    });
                }

                // 6. 收集所有 <img> src
                var imageNodes = doc.DocumentNode.SelectNodes("//img");
                var imgList = new List<string>();
                if (imageNodes != null)
                {
                    foreach (var img in imageNodes)
                    {
                        var src = img.GetAttributeValue("src", "");
                        if (!string.IsNullOrWhiteSpace(src))
                            imgList.Add(src);
                    }
                }
                // 備註
                string commentStr = "這是來自 ParseHtmlAndSave";

                // =========================== 狀況 1：完全新資料 ===========================
                if (sameDoc == null)
                {
                    // ★ 新增一筆
                    targetDoc = new DocumentExport
                    {
                        Category = tempDoc.Category,
                        Station = tempDoc.Station,
                        PageNo = tempDoc.PageNo,
                        SequenceNo = tempDoc.SequenceNo,
                        DocumentId = tempDoc.DocumentId,
                        Suffix = tempDoc.Suffix,
                        Images = JsonSerializer.Serialize(imgList),
                        Comment = commentStr,
                        Version = 1,
                        LatestTime = DateTime.Now,
                        CreatedById = currentUser?.Address,
                        CreatedByName = currentUser?.Name
                    };
                    // htmlContent 可存也可不存
                    targetDoc.HtmlContent = null;

                    // 新增這筆 DocumentExport
                    _unitOfWork.DbContext.DocumentExports.Add(targetDoc);
                    _unitOfWork.Save();

                    // 再分段存 HtmlSections (Version=1)
                    var htmlSections = SplitHtmlIntoSections(dto.PageHtml);
                    foreach (var section in htmlSections)
                    {
                        var htmlSec = new HtmlSection
                        {
                            DocumentExportId = targetDoc.Id,
                            HtmlPart = section,
                            Version = targetDoc.Version
                        };
                        _unitOfWork.DbContext.HtmlSections.Add(htmlSec);
                    }
                    _unitOfWork.Save();
                }
                // =========================== 狀況 2：取代(更新)現有資料 ===========================
                else
                {
                    // 使用 sameDoc 做更新
                    targetDoc = sameDoc;

                    // 2.1) 【註解掉刪除舊版】
                    // 2.1) 先刪除「舊的 HtmlSections」 (針對 sameDoc.Id 全部刪除)
                    //var oldSections = _unitOfWork.DbContext.HtmlSections
                    //    .Where(h => h.DocumentExportId == targetDoc.Id)
                    //    .ToList();
                    //_unitOfWork.DbContext.HtmlSections.RemoveRange(oldSections);

                    // 2.2) 版本+1
                    targetDoc.Version++;

                    // 2.3) 更新其他欄位
                    targetDoc.Images = JsonSerializer.Serialize(imgList);
                    targetDoc.Comment = commentStr;
                    targetDoc.LatestTime = DateTime.Now;
                    targetDoc.CreatedById = currentUser?.Address;
                    targetDoc.CreatedByName = currentUser?.Name;

                    // 2.4) 也可順便更新 DocumentId、SequenceNo... 或保留
                    // 如果要讓「取代」同時更新這些基本欄位 → 請自行決定
                    targetDoc.DocumentId = tempDoc.DocumentId;   // 例如：覆蓋新的 DocumentId
                    targetDoc.SequenceNo = tempDoc.SequenceNo;   // ...
                                                                 // 其實 Category, Station, PageNo, Suffix 都不用改，因為是 match 同一筆
                                                                 // 但若要允許改，也可對應更新

                    _unitOfWork.DbContext.DocumentExports.Update(targetDoc);
                    _unitOfWork.Save();

                    // 2.5) 新增新的 HtmlSections
                    var htmlSections = SplitHtmlIntoSections(dto.PageHtml);
                    foreach (var section in htmlSections)
                    {
                        var htmlSec = new HtmlSection
                        {
                            DocumentExportId = targetDoc.Id,
                            HtmlPart = section,
                            Version = targetDoc.Version
                        };
                        _unitOfWork.DbContext.HtmlSections.Add(htmlSec);
                    }
                    _unitOfWork.Save();
                }

                // 最後回傳
                return Ok(new
                {
                    success = true,
                    message = "解析並儲存成功！（採用 更新/取代 方式）",
                    data = new
                    {
                        targetDoc.Id,
                        targetDoc.Category,
                        targetDoc.Station,
                        targetDoc.PageNo,
                        targetDoc.SequenceNo,
                        targetDoc.DocumentId,
                        targetDoc.Suffix,
                        targetDoc.Version,
                        targetDoc.LatestTime,
                        targetDoc.CreatedById,
                        targetDoc.CreatedByName
                    }
                });
            }
            catch (Exception ex)
            {
                return Ok(new
                {
                    success = false,
                    message = "ParseHtmlAndSave發生錯誤: " + ex.Message
                });
            }
        }


        [HttpPost]
        public IActionResult SaveSurveyAnswerToData([FromBody] MtNumAnswerDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.MtNum) || string.IsNullOrWhiteSpace(dto.AnsweredJson))
            {
                return BadRequest(new { success = false, message = "必要欄位缺失，請確認傳入的參數。" });
            }

            // 取得目前登入使用者資訊（假設工號存於 ApplicationUser.Address，姓名存於 ApplicationUser.Name）
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUser = _unitOfWork.ApplicationUser.GetFirstOrDefault(u => u.Id == currentUserId);

            // 檢查是否已有相同 MtNum、SurveyId 與 Version 的記錄
            var existing = _unitOfWork.DbContext.MtNumAnswereds
                                 .FirstOrDefault(x => x.MtNum == dto.MtNum && x.SurveyId == dto.SurveyId && x.Version == dto.Version);

            if (existing != null && existing.Stage == dto.Stage)
            {
                // 若 Stage 也相同則更新舊資料
                existing.AnsweredJson = dto.AnsweredJson;
                existing.Images = dto.Images; // 儲存前端傳入的圖片字串
                existing.LatestTime = DateTime.Now;
                existing.CreatedById = currentUser?.Address;
                existing.CreatedByName = currentUser?.Name;
                _unitOfWork.DbContext.MtNumAnswereds.Update(existing);
                _unitOfWork.Save();

                return Ok(new { success = true, message = "問卷答案已成功更新至 MtNumAnswered 資料表。" });
            }
            else
            {
                // 若沒有找到舊資料，或 Stage 不同則新增一筆記錄
                var newAnswer = new MtNumAnswered
                {
                    MtNum = dto.MtNum,
                    SurveyId = dto.SurveyId,
                    Version = dto.Version,
                    AnsweredJson = dto.AnsweredJson,
                    Images = dto.Images,
                    LatestTime = DateTime.Now,
                    CreatedById = currentUser?.Address,
                    CreatedByName = currentUser?.Name,
                    Stage = dto.Stage
                };

                _unitOfWork.DbContext.MtNumAnswereds.Add(newAnswer);
                _unitOfWork.Save();

                return Ok(new { success = true, message = "問卷答案已成功儲存至 MtNumAnswered 資料表。" });
            }
        }




        [HttpPost]
        public IActionResult SaveSurveyAnswer([FromBody] SurveyAnswerDto dto)
        {
            Console.WriteLine("收到 SaveSurveyAnswer 請求");
            Console.WriteLine("DTO 資料: " + JsonSerializer.Serialize(dto));

            if (string.IsNullOrWhiteSpace(dto.HtmlContent) || string.IsNullOrWhiteSpace(dto.AnswerJson))
            {
                Console.WriteLine("必要欄位缺失：HtmlContent 或 AnswerJson 為空");
                return BadRequest("HTML 內容與答案 JSON 為必填。");
            }

            // 建立一筆 SurveyAnswerExport 記錄，將 DTO 中的資料對應存入資料表（包含新欄位）
            var newAnswerExport = new SurveyAnswerExport
            {
                Category = dto.Category,
                Station = dto.Station,
                PageNo = dto.PageNo,
                SequenceNo = dto.SequenceNo,
                DocumentId = dto.DocumentId,
                HtmlContent = dto.HtmlContent,
                AnswerJson = dto.AnswerJson,
                Images = dto.Images,
                Comment = dto.Comment,
                QuestionData = dto.QuestionData,  // 新增題目資料
                Version = dto.Version               // 新增版本編號
                                                    // CreatedAt 將自動以預設值設定為目前時間
            };

            _unitOfWork.DbContext.SurveyAnswerExports.Add(newAnswerExport);
            _unitOfWork.Save();
            Console.WriteLine("新增 SurveyAnswerExport 成功，ID: " + newAnswerExport.Id);

            // 分段儲存 HtmlContent（若內容超長則進行切割）
            var htmlSections = SplitHtmlIntoSections(dto.HtmlContent);
            Console.WriteLine("HTML 內容將分成 " + htmlSections.Count + " 段");
            foreach (var section in htmlSections)
            {
                var answerSection = new SurveyAnswerHtmlSection
                {
                    SurveyAnswerExportId = newAnswerExport.Id,
                    HtmlPart = section
                };
                _unitOfWork.DbContext.SurveyAnswerHtmlSections.Add(answerSection);
            }
            _unitOfWork.Save();
            Console.WriteLine("HTML 分段儲存完成");

            return Ok(new { success = true, message = "問卷答案儲存成功！" });
        }

        /// <summary>
        /// 將完整 HTML 內容分段，每段最大長度預設 4000 字元。
        /// </summary>
        private List<string> SplitHtmlIntoSections(string htmlContent, int maxLength = 4000)
        {
            var sections = new List<string>();


            int totalLength = htmlContent.Length;
            for (int i = 0; i < totalLength; i += maxLength)
            {
                string part = htmlContent.Substring(i, Math.Min(maxLength, totalLength - i));
                sections.Add(part);
            }
            return sections;
        }




        [HttpPost]
        public IActionResult UpdateHtmlSections([FromBody] UpdateHtmlSectionsDto dto)
        {
            if (dto == null || dto.DocumentId <= 0)
            {
                return BadRequest(new { success = false, message = "參數不正確，無法更新" });
            }

            var docExp = _unitOfWork.DbContext.DocumentExports.FirstOrDefault(d => d.Id == dto.DocumentId);
            if (docExp == null)
            {
                return Ok(new { success = false, message = "找不到此 DocumentExport" });
            }

            // 取得目前登入使用者資訊
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            var currentUser = _unitOfWork.ApplicationUser.GetFirstOrDefault(u => u.Id == currentUserId);

            // 更新版本號：若未設定或為 0 則設為 1，否則累加 1
            if (docExp.Version <= 0)
            {
                docExp.Version = 1;
            }
            else
            {
                docExp.Version++;
            }

            // 更新最新時間與建立人資訊
            docExp.LatestTime = DateTime.Now;
            // 假設工號存於 ApplicationUser.Address，姓名存於 ApplicationUser.Name
            docExp.CreatedById = currentUser?.Address;
            docExp.CreatedByName = currentUser?.Name;

            _unitOfWork.Save();

            // 注意：不刪除舊的 HtmlSections，保留舊版本
            // 直接將新的內容切段並存入新的 HtmlSection，同時設定 Version 為目前版本
            var sections = SplitHtmlIntoSections(dto.HtmlContent);
            foreach (var s in sections)
            {
                var newSec = new HtmlSection
                {
                    DocumentExportId = docExp.Id,
                    HtmlPart = s,
                    Version = docExp.Version
                };
                _unitOfWork.DbContext.HtmlSections.Add(newSec);
            }
            _unitOfWork.Save();

            return Ok(new { success = true, message = "已成功更新該筆 Notes！" });
        }








        /// <summary>
        /// (六) 範例：抓取「本 Controller 所在頁面」(或你要的 URL) 進行解析並儲存。
        ///     - 若您想直接抓取線上 HTML (例如同頁或其它站點) 就可用此方法。
        ///     - 需參考 System.Net.Http 並在 .csproj 中引用。
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> FetchAndSaveCurrentPage()
        {
            try
            {
                // (A) 根據 Request 建構出「當前頁面」的 URL
                var currentUrl = $"{Request.Scheme}://{Request.Host}{Request.PathBase}{Request.Path}";

                // (B) 使用 HttpClient 抓取該頁面 HTML (若有驗證/身分問題，請自行處理)
                string pageHtml;
                using (HttpClient httpClient = new HttpClient())
                {
                    pageHtml = await httpClient.GetStringAsync(currentUrl);
                }

                // (C) 使用 HtmlAgilityPack 解析
                HtmlDocument htmlDoc = new HtmlDocument();
                htmlDoc.LoadHtml(pageHtml);

                // 找「第一個模塊」 (class=module-block)
                var firstModule = htmlDoc.DocumentNode.SelectSingleNode("(//div[contains(@class, 'ModuleBlock')])[1]");
                if (firstModule == null)
                {
                    return BadRequest("找不到【第一個模塊】，請確認前端結構。");
                }
                var firstText = firstModule.InnerText;

                // 從第一個模塊擷取
                string category = ExtractValueAfterLabel(firstText, "種類:");
                string station = ExtractValueAfterLabel(firstText, "站別:");
                string pageNo = ExtractValueAfterLabel(firstText, "頁數:");
                string sequenceNo = ExtractValueAfterLabel(firstText, "序號:");

                // 找「最後一個模塊」
                var lastModule = htmlDoc.DocumentNode.SelectSingleNode("(//div[contains(@class, 'ModuleBlock')])[last()]");
                if (lastModule == null)
                {
                    return BadRequest("找不到【最後一個模塊】，請確認前端結構。");
                }
                var lastText = lastModule.InnerText;

                // 從最後一個模塊擷取
                string documentId = ExtractValueAfterLabel(lastText, "文件編號:");

                // 收集所有 <img> 的 src
                var imageNodes = htmlDoc.DocumentNode.SelectNodes("//img");
                var imageList = new List<string>();
                if (imageNodes != null)
                {
                    foreach (var imgNode in imageNodes)
                    {
                        string src = imgNode.GetAttributeValue("src", "");
                        if (!string.IsNullOrWhiteSpace(src))
                        {
                            imageList.Add(src);
                        }
                    }
                }

                // (D) 存入資料表
                var newDoc = new DocumentExport
                {
                    Category = category,
                    Station = station,
                    PageNo = pageNo,
                    SequenceNo = sequenceNo,
                    DocumentId = documentId,
                    HtmlContent = pageHtml,
                    Images = JsonSerializer.Serialize(imageList),
                    Comment = "自動抓取產生"
                };

                _unitOfWork.DbContext.DocumentExports.Add(newDoc);
                _unitOfWork.Save();

                return Ok(new { success = true, message = "已成功抓取並儲存！" });
            }
            catch (Exception ex)
            {
                return BadRequest($"發生錯誤：{ex.Message}");
            }
        }

        // -----------------------------------------------------------------------------------
        // (七) 小工具：ExtractValueAfterLabel
        //     從大字串 source 中，找指定 label (例如 "種類:" ) 後面的字串
        //     若之後遇到其他已知標籤 (例如 "站別:" "頁數:" "序號:" 等) 就截斷。
        // -----------------------------------------------------------------------------------
        private string ExtractValueAfterLabel(string source, string label)
        {
            if (string.IsNullOrEmpty(source) || string.IsNullOrEmpty(label))
                return string.Empty;

            // 1. 找 label 出現的位置
            int labelIndex = source.IndexOf(label);
            if (labelIndex == -1)
                return string.Empty;

            // 2. 從「標籤結尾」開始往後取
            labelIndex += label.Length;
            string substring = source.Substring(labelIndex);

            // 3. 尋找下一個標籤，截斷
            string[] possibleLabels = { "種類:", "站別:", "頁數:", "序號:", "文件編號:", "後綴:" };
            int earliestNextLabelPos = -1;
            foreach (var l in possibleLabels)
            {
                if (l == label) continue; // 跳過自己
                int tmpPos = substring.IndexOf(l);
                if (tmpPos != -1 && (earliestNextLabelPos == -1 || tmpPos < earliestNextLabelPos))
                {
                    earliestNextLabelPos = tmpPos;
                }
            }
            if (earliestNextLabelPos != -1)
                substring = substring.Substring(0, earliestNextLabelPos);

            // ★ 關鍵：把 &nbsp; 等 HTML entity decode，再 Trim
            substring = HtmlAgilityPack.HtmlEntity.DeEntitize(substring).Trim();

            return substring;
        }

        /// <summary> 
        /// 從 HtmlSection 表中讀取所有分段並合併為完整的 HTML 內容
        /// </summary>
        /// <param name="documentId">對應的 DocumentExport Id</param>
        /// <param name="version">（可選）要讀取的版本號，不傳則讀取最新版本</param>
        /// <returns>完整的 HTML 內容</returns>
        [HttpGet]
        public IActionResult GetFullHtml(int documentId, int? version = null)
        {
            // 先找 DocumentExport 資料
            var docExp = _unitOfWork.DbContext.DocumentExports
                .FirstOrDefault(d => d.Id == documentId);
            if (docExp == null)
            {
                return Ok(new { success = false, htmlContent = "", message = "找不到此 DocumentExport" });
            }

            // 如果傳了 version，就用傳入的，否則用最新版本
            int useVersion = version.HasValue && version.Value > 0
                ? version.Value
                : docExp.Version;

            // 依版本從 HtmlSections 撈出內容並依序合併
            var htmlSections = _unitOfWork.DbContext.HtmlSections
                .Where(h => h.DocumentExportId == documentId && h.Version == useVersion)
                .OrderBy(h => h.Id)
                .Select(h => h.HtmlPart)
                .ToList();
            string fullHtml = string.Join("", htmlSections);

            // 組成 debugInfo 內容，供前端檢查
            string debugInfo = "【GetFullHtml】從 DocumentExport 取得的欄位資料：\n" +
                $"Category:    '{docExp.Category}'\n" +
                $"Station:     '{docExp.Station}'\n" +
                $"PageNo:      '{docExp.PageNo}'\n" +
                $"SequenceNo:  '{docExp.SequenceNo}'\n" +
                $"DocumentId:  '{docExp.DocumentId}'\n" +
                $"Suffix:      '{docExp.Suffix}'\n" +
                $"RequestedVersion: '{useVersion}'\n" +
                $"LatestTime:  '{(docExp.LatestTime.HasValue ? docExp.LatestTime.Value.ToString("yyyy-MM-dd HH:mm:ss") : "")}'\n" +
                $"CreatedById:   '{docExp.CreatedById}'\n" +
                $"CreatedByName: '{docExp.CreatedByName}'";

            return Ok(new
            {
                success = true,
                htmlContent = fullHtml,
                Category = docExp.Category,
                Station = docExp.Station,
                PageNo = docExp.PageNo,
                SequenceNo = docExp.SequenceNo,
                DocumentId = docExp.DocumentId,
                Suffix = docExp.Suffix,
                Version = useVersion,
                LatestTime = docExp.LatestTime,
                CreatedById = docExp.CreatedById,
                CreatedByName = docExp.CreatedByName,
                debugInfo = debugInfo
            });
        }


        [HttpPost]
        public IActionResult ReorderDocumentExports()
        {
            // ★ 可能需要保護機制：若資料很多或多人同時作業，恐出現衝突
            //   這裡純示範，請注意交易隔離、並發、權限... 

            // 1) 取出全部 DocumentExport，依舊 ID 升冪排序
            var docs = _unitOfWork.DbContext.DocumentExports
                         .OrderBy(d => d.Id)
                         .ToList();

            // 2) 若沒有任何資料，就不用處理
            if (!docs.Any())
            {
                return Ok(new { success = false, message = "目前沒有任何 DocumentExport 資料，無法重排。" });
            }

            // 3) 因為要改主鍵 ID，需要自己動手下 SQL 或關掉 EF ChangeTracking
            //    在這裡用 Transaction + 原生 SQL 方式

            using (var trans = _unitOfWork.DbContext.Database.BeginTransaction())
            {
                try
                {
                    // (A) 暫時關掉 HtmlSections → DocumentExports 的外鍵檢查
                    _unitOfWork.DbContext.Database.ExecuteSqlRaw(
                        "ALTER TABLE [HtmlSections] NOCHECK CONSTRAINT [FK_HtmlSections_DocumentExports_DocumentExportId];");

                    // (A2) 允許對 DocumentExports 進行帶有自訂 Id 的插入
                    _unitOfWork.DbContext.Database.ExecuteSqlRaw(
                        "SET IDENTITY_INSERT [DocumentExports] ON;");

                    // (B) 先把 DocumentExport/HtmlSections 全部的 Id 改成「負值暫存」
                    int i = 1;
                    foreach (var doc in docs)
                    {
                        int oldId = doc.Id;
                        int tempNegativeId = -10000 - i; // 負一萬 - i

                        // 先改 HtmlSection
                        string updateSectionSql = @"UPDATE HtmlSections 
                    SET DocumentExportId = {0} 
                    WHERE DocumentExportId = {1};";

                        _unitOfWork.DbContext.Database.ExecuteSqlRaw(updateSectionSql, tempNegativeId, oldId);

                        // 再改 DocumentExport 自己
                        string updateDocSql = @"UPDATE DocumentExports 
                    SET Id = {0}
                    WHERE Id = {1};";

                        _unitOfWork.DbContext.Database.ExecuteSqlRaw(updateDocSql, tempNegativeId, oldId);

                        i++;
                    }

                    // (B) 再將 DocumentExport 依「排序後的順序」給新的正 ID  (1,2,3,...)
                    //     HtmlSections 也要對應
                    i = 1;
                    foreach (var doc in docs)
                    {
                        // 注意：原本 doc.Id 也改成了 負值 => doc.Id 此刻不準 
                        // 所以要記得我們在 docs 物件尚未 refresh, doc.Id 只是舊值
                        // => 可用第 (i) 來對應。

                        int newId = i;
                        int tempNeg = -10000 - i; // step(A) 給的負值

                        // 先改 HtmlSection
                        string updateSectionSql = @"UPDATE HtmlSections
                    SET DocumentExportId = {0}
                    WHERE DocumentExportId = {1};";

                        _unitOfWork.DbContext.Database.ExecuteSqlRaw(updateSectionSql, newId, tempNeg);

                        // 再改 DocumentExport
                        string updateDocSql = @"UPDATE DocumentExports 
                    SET Id = {0}
                    WHERE Id = {1};";

                        _unitOfWork.DbContext.Database.ExecuteSqlRaw(updateDocSql, newId, tempNeg);

                        i++;
                    }

                    // (D) 關掉 IDENTITY_INSERT
                    _unitOfWork.DbContext.Database.ExecuteSqlRaw(
                       "SET IDENTITY_INSERT [DocumentExports] OFF;");

                    // (E) 重新啟用外鍵
                    _unitOfWork.DbContext.Database.ExecuteSqlRaw(
                       "ALTER TABLE [HtmlSections] WITH CHECK CHECK CONSTRAINT [FK_HtmlSections_DocumentExports_DocumentExportId];");


                    // (F) 交易提交
                    trans.Commit();
                    return Ok(new { success = true, message = $"重排完成！共 {docs.Count} 筆資料。" });
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    return Ok(new { success = false, message = "重排失敗：" + ex.Message });
                }
            }
        }

        [HttpPost]
        public IActionResult ReorderDocumentExportsViaNewTable()
        {
            // 取得全部 DocumentExports（依 ID 升冪排序）
            var oldDocs = _unitOfWork.DbContext.DocumentExports.OrderBy(d => d.Id).ToList();
            if (!oldDocs.Any())
                return Ok(new { success = false, message = "沒有資料可重排。" });

            // 取得所有 HtmlSections，然後過濾出每個 DocumentExport 內最新版本（Version 最大）的記錄
            var allOldHtmlSections = _unitOfWork.DbContext.HtmlSections.ToList();
            var oldHtmlSections = allOldHtmlSections
                .GroupBy(h => h.DocumentExportId)
                .SelectMany(g => g.Where(x => x.Version == g.Max(y => y.Version)))
                .OrderBy(h => h.Id)
                .ToList();

            // 建立 mapping：舊 DocumentExport.Id 對應到新排定的 ID
            var mapping = new Dictionary<int, int>();

            // 1. 建立或重建 DocumentExports_Temp 的臨時表，包含所有欄位
            _unitOfWork.DbContext.Database.ExecuteSqlRaw(@"
        IF OBJECT_ID('dbo.DocumentExports_Temp', 'U') IS NOT NULL 
            DROP TABLE dbo.DocumentExports_Temp;

        CREATE TABLE dbo.DocumentExports_Temp(
            Id INT NOT NULL,
            Category NVARCHAR(50) NULL,
            Station NVARCHAR(50) NULL,
            PageNo NVARCHAR(50) NULL,
            SequenceNo NVARCHAR(50) NULL,
            DocumentId NVARCHAR(50) NULL,
            HtmlContent NVARCHAR(MAX) NULL,
            Images NVARCHAR(MAX) NULL,
            Comment NVARCHAR(MAX) NULL,
            Version INT NOT NULL,
            LatestTime DATETIME NULL,
            CreatedById NVARCHAR(50) NULL,
            CreatedByName NVARCHAR(50) NULL,
            Suffix NVARCHAR(50) NULL,
            CONSTRAINT [PK_DocumentExports_Temp] PRIMARY KEY CLUSTERED ([Id] ASC)
        );
    ");

            // 2. 建立或重建 HtmlSections_Temp 的臨時表，並包含 Version 欄位
            _unitOfWork.DbContext.Database.ExecuteSqlRaw(@"
        IF OBJECT_ID('dbo.HtmlSections_Temp', 'U') IS NOT NULL 
            DROP TABLE dbo.HtmlSections_Temp;

        CREATE TABLE dbo.HtmlSections_Temp(
            Id INT NOT NULL,
            DocumentExportId INT NOT NULL,
            HtmlPart NVARCHAR(MAX) NULL,
            Version INT NOT NULL,
            CONSTRAINT [PK_HtmlSections_Temp] PRIMARY KEY CLUSTERED ([Id] ASC)
        );
    ");

            // 3. 逐筆將 DocumentExports 插入臨時表，同時建立 mapping（新 ID 從 1 開始）
            int newDocId = 1;
            string insertDocSql = @"
        INSERT INTO dbo.DocumentExports_Temp
           (Id, Category, Station, PageNo, SequenceNo, DocumentId, HtmlContent, Images, Comment, Version, LatestTime, CreatedById, CreatedByName, Suffix)
        VALUES (@p0, @p1, @p2, @p3, @p4, @p5, @p6, @p7, @p8, @p9, @p10, @p11, @p12, @p13);
    ";
            foreach (var doc in oldDocs)
            {
                // 若 Version 為 0 則預設為 1
                int versionValue = (doc.Version == 0 ? 1 : doc.Version);
                _unitOfWork.DbContext.Database.ExecuteSqlRaw(
                    insertDocSql,
                    new object[] {
                newDocId,
                doc.Category,
                doc.Station,
                doc.PageNo,
                doc.SequenceNo,
                doc.DocumentId,
                doc.HtmlContent,
                doc.Images,
                doc.Comment,
                versionValue,
                doc.LatestTime,
                doc.CreatedById,
                doc.CreatedByName,
                doc.Suffix
                    }
                );
                mapping[doc.Id] = newDocId;
                newDocId++;
            }

            // 4. 逐筆將過濾後的 HtmlSections 插入臨時表，同時更新 DocumentExportId 為新對照 ID，並保留 Version
            int newHtmlId = 1;
            string insertHtmlSql = @"
       INSERT INTO dbo.HtmlSections_Temp
             (Id, DocumentExportId, HtmlPart, Version)
       VALUES (@p0, @p1, @p2, @p3);
    ";
            foreach (var section in oldHtmlSections)
            {
                int newParentId = mapping.ContainsKey(section.DocumentExportId) ? mapping[section.DocumentExportId] : section.DocumentExportId;
                int sectionVersion = (section.Version == 0 ? 1 : section.Version);
                _unitOfWork.DbContext.Database.ExecuteSqlRaw(
                    insertHtmlSql,
                    new object[] { newHtmlId, newParentId, section.HtmlPart, sectionVersion }
                );
                newHtmlId++;
            }

            // 5. 刪除舊資料：先清空 HtmlSections，再清空 DocumentExports
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("DELETE FROM HtmlSections;");
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("DELETE FROM DocumentExports;");

            // 6. 將 DocumentExports_Temp 中的資料搬回正式的 DocumentExports 表
            _unitOfWork.DbContext.Database.ExecuteSqlRaw(@"
        SET IDENTITY_INSERT DocumentExports ON;

        INSERT INTO DocumentExports
          (Id, Category, Station, PageNo, SequenceNo, DocumentId, HtmlContent, Images, Comment, Version, LatestTime, CreatedById, CreatedByName, Suffix)
        SELECT Id, Category, Station, PageNo, SequenceNo, DocumentId, HtmlContent, Images, Comment, Version, LatestTime, CreatedById, CreatedByName, Suffix
        FROM dbo.DocumentExports_Temp
        ORDER BY Id;

        SET IDENTITY_INSERT DocumentExports OFF;
    ");

            // 7. 將 HtmlSections_Temp 中的資料搬回正式的 HtmlSections 表
            _unitOfWork.DbContext.Database.ExecuteSqlRaw(@"
        SET IDENTITY_INSERT HtmlSections ON;

        INSERT INTO HtmlSections
           (Id, DocumentExportId, HtmlPart, Version)
        SELECT Id, DocumentExportId, HtmlPart, Version
        FROM dbo.HtmlSections_Temp
        ORDER BY Id;

        SET IDENTITY_INSERT HtmlSections OFF;
    ");

            // 8. 刪除臨時表
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("DROP TABLE dbo.DocumentExports_Temp;");
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("DROP TABLE dbo.HtmlSections_Temp;");

            // 9. 重新設定 DocumentExports 的 IDENTITY 序列
            int currentMaxDocId = _unitOfWork.DbContext.DocumentExports.Any() ? _unitOfWork.DbContext.DocumentExports.Max(d => d.Id) : 0;
            _unitOfWork.DbContext.Database.ExecuteSqlRaw($"DBCC CHECKIDENT ('DocumentExports', RESEED, {currentMaxDocId});");

            // 10. 重新設定 HtmlSections 的 IDENTITY 序列
            int currentMaxHtmlId = _unitOfWork.DbContext.HtmlSections.Any() ? _unitOfWork.DbContext.HtmlSections.Max(h => h.Id) : 0;
            _unitOfWork.DbContext.Database.ExecuteSqlRaw($"DBCC CHECKIDENT ('HtmlSections', RESEED, {currentMaxHtmlId});");

            return Ok(new { success = true, message = $"『新表搬移』方式重排完成，共 {oldDocs.Count} 筆資料。" });
        }




        /// <summary>
        /// 匯出 DocumentExport 與 HtmlSection 資料成 Excel 檔案
        /// </summary>
        [HttpGet]
        public IActionResult ExportDocumentData(string ids = null)
        {
            // 1. 解析 ids 字串，支援 1-10,13,15
            List<int> idList = new List<int>();
            if (!string.IsNullOrWhiteSpace(ids))
            {
                foreach (var part in ids.Split(',', StringSplitOptions.RemoveEmptyEntries))
                {
                    if (part.Contains('-'))
                    {
                        var bounds = part.Split('-');
                        if (int.TryParse(bounds[0], out int start) && int.TryParse(bounds[1], out int end))
                        {
                            for (int i = start; i <= end; i++) idList.Add(i);
                        }
                    }
                    else if (int.TryParse(part, out int single))
                    {
                        idList.Add(single);
                    }
                }
            }

            // 2. 依 idList 過濾或全部
            var documentExports = string.IsNullOrWhiteSpace(ids)
                ? _unitOfWork.DbContext.DocumentExports.ToList()
                : _unitOfWork.DbContext.DocumentExports.Where(d => idList.Contains(d.Id)).ToList();

            var htmlSections = _unitOfWork.DbContext.HtmlSections
                .Where(h => documentExports.Select(d => d.Id).Contains(h.DocumentExportId))
                .ToList();

            // 取得所有 DocumentExports 與 HtmlSections 資料
            //var documentExports = _unitOfWork.DbContext.DocumentExports.ToList();
            //var htmlSections = _unitOfWork.DbContext.HtmlSections.ToList();

            // Excel 每個儲存格最大可存 32,767 字元，這邊設定每一段上限 32,760 字元（預留少許空間）
            int maxLen = 32760;

            using (var workbook = new XLWorkbook())
            {
                // 建立第一個工作表：
                var wsDoc = workbook.Worksheets.Add("DocumentExports");
                int col = 1;
                // 建立標題列：依序輸出固定欄位（新增欄位已包含）
                wsDoc.Cell(1, col++).Value = "Id";
                wsDoc.Cell(1, col++).Value = "Category";
                wsDoc.Cell(1, col++).Value = "Station";
                wsDoc.Cell(1, col++).Value = "PageNo";
                wsDoc.Cell(1, col++).Value = "SequenceNo";
                wsDoc.Cell(1, col++).Value = "DocumentId";
                wsDoc.Cell(1, col++).Value = "CreatedById";    // 新增
                wsDoc.Cell(1, col++).Value = "CreatedByName";  // 新增
                wsDoc.Cell(1, col++).Value = "LatestTime";       // 新增
                wsDoc.Cell(1, col++).Value = "Version";          // 新增
                wsDoc.Cell(1, col++).Value = "Suffix";           // 新增
                // 建立 HtmlContent 的標題（依據資料中需要分成幾個區塊來判斷）
                // 這裡採取動態計算方式：先計算該欄位最大分段數
                int maxHtmlChunks = 1;
                int maxImagesChunks = 1;
                foreach (var doc in documentExports)
                {
                    if (!string.IsNullOrEmpty(doc.HtmlContent))
                    {
                        int chunks = (doc.HtmlContent.Length + maxLen - 1) / maxLen;
                        if (chunks > maxHtmlChunks)
                            maxHtmlChunks = chunks;
                    }
                    if (!string.IsNullOrEmpty(doc.Images))
                    {
                        int chunks = (doc.Images.Length + maxLen - 1) / maxLen;
                        if (chunks > maxImagesChunks)
                            maxImagesChunks = chunks;
                    }
                }
                // 動態產生 HtmlContent 分段標題
                for (int i = 1; i <= maxHtmlChunks; i++)
                {
                    wsDoc.Cell(1, col++).Value = $"HtmlContent {i}";
                }
                // 動態產生 Images 分段標題
                for (int i = 1; i <= maxImagesChunks; i++)
                {
                    wsDoc.Cell(1, col++).Value = $"Images {i}";
                }
                wsDoc.Cell(1, col++).Value = "Comment";

                // 寫入 DocumentExports 資料列
                int row = 2;
                foreach (var doc in documentExports)
                {
                    col = 1;
                    wsDoc.Cell(row, col++).Value = doc.Id;
                    wsDoc.Cell(row, col++).Value = doc.Category;
                    wsDoc.Cell(row, col++).Value = doc.Station;
                    wsDoc.Cell(row, col++).Value = doc.PageNo;
                    wsDoc.Cell(row, col++).Value = doc.SequenceNo;
                    wsDoc.Cell(row, col++).Value = doc.DocumentId;
                    wsDoc.Cell(row, col++).Value = doc.CreatedById;    // 新增欄位
                    wsDoc.Cell(row, col++).Value = doc.CreatedByName;  // 新增欄位
                                                                       // 輸出日期格式：若有值則轉換成 yyyy-MM-dd HH:mm:ss 格式
                    wsDoc.Cell(row, col++).Value = doc.LatestTime.HasValue ? doc.LatestTime.Value.ToString("yyyy-MM-dd HH:mm:ss") : "";
                    wsDoc.Cell(row, col++).Value = doc.Version;
                    wsDoc.Cell(row, col++).Value = doc.Suffix;


                    // 分段處理 HtmlContent 欄位
                    List<string> htmlChunks = SplitIntoChunks(doc.HtmlContent, maxLen);
                    for (int i = 0; i < maxHtmlChunks; i++)
                    {
                        if (i < htmlChunks.Count)
                            wsDoc.Cell(row, col++).Value = htmlChunks[i];
                        else
                            wsDoc.Cell(row, col++).Value = "";
                    }

                    // 分段處理 Images 欄位
                    List<string> imagesChunks = SplitIntoChunks(doc.Images, maxLen);
                    for (int i = 0; i < maxImagesChunks; i++)
                    {
                        if (i < imagesChunks.Count)
                            wsDoc.Cell(row, col++).Value = imagesChunks[i];
                        else
                            wsDoc.Cell(row, col++).Value = "";
                    }

                    wsDoc.Cell(row, col++).Value = doc.Comment;

                    row++;
                }

                // 建立第二個工作表：HtmlSections 資料
                var wsHtml = workbook.Worksheets.Add("HtmlSections");
                // 設定標題列
                wsHtml.Cell(1, 1).Value = "Id";
                wsHtml.Cell(1, 2).Value = "DocumentExportId";
                wsHtml.Cell(1, 3).Value = "HtmlPart";
                wsHtml.Cell(1, 4).Value = "Version"; // 新增 Version 欄位

                row = 2;
                foreach (var hs in htmlSections)
                {
                    wsHtml.Cell(row, 1).Value = hs.Id;
                    wsHtml.Cell(row, 2).Value = hs.DocumentExportId;
                    // 同樣處理 HtmlPart 分段（若超過長度）－通常 HtmlPart 資料較短，這裡僅直接寫入
                    string part = hs.HtmlPart;
                    if (!string.IsNullOrEmpty(part) && part.Length > 32767)
                    {
                        part = part.Substring(0, maxLen) + "...";
                    }
                    wsHtml.Cell(row, 3).Value = part;
                    wsHtml.Cell(row, 4).Value = hs.Version;  // 輸出 Version 資料
                    row++;
                }

                using (var stream = new MemoryStream())
                {
                    workbook.SaveAs(stream);
                    var contentBytes = stream.ToArray();
                    return File(contentBytes,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "DocumentData.xlsx");
                }
            }
        }

        /// <summary> 
        /// 匯出每「頁」的最新版本（同一 Category+Station+PageNo+Suffix 只取最大 Version），並依原本 Id 排序
        /// </summary>
        [HttpGet]
        public IActionResult ExportLatestVersionData()
        {
            // 1) 先算出每組頁面的最大 Version
            var latestVersions = _unitOfWork.DbContext.DocumentExports
                .GroupBy(d => new { d.Category, d.Station, d.PageNo, d.Suffix })
                .Select(g => new {
                    g.Key.Category,
                    g.Key.Station,
                    g.Key.PageNo,
                    g.Key.Suffix,
                    Version = g.Max(x => x.Version)
                });

            // 2) 用 join 取出對應的 DocumentExport，並依 Id 排序
            var latestDocs = (from d in _unitOfWork.DbContext.DocumentExports
                              join lv in latestVersions
                                on new { d.Category, d.Station, d.PageNo, d.Suffix, d.Version }
                                equals new { lv.Category, lv.Station, lv.PageNo, lv.Suffix, lv.Version }
                              orderby d.Id
                              select d)
                             .ToList();

            // 3) 撈出這些 DocumentExport 對應的所有 HtmlSections，再只保留最新版本那一批
            var docIds = latestDocs.Select(d => d.Id).ToList();
            var allSections = _unitOfWork.DbContext.HtmlSections
                .Where(h => docIds.Contains(h.DocumentExportId))
                .ToList();
            var versionMap = latestDocs.ToDictionary(d => d.Id, d => d.Version);
            var htmlSections = allSections
                .Where(h => versionMap[h.DocumentExportId] == h.Version)
                .OrderBy(h => h.DocumentExportId)
                .ThenBy(h => h.Id)
                .ToList();

            // 4) 分段設定
            const int maxLen = 32760;
            int maxHtmlChunks = 1, maxImagesChunks = 1;
            foreach (var doc in latestDocs)
            {
                if (!string.IsNullOrEmpty(doc.HtmlContent))
                {
                    int chunks = (doc.HtmlContent.Length + maxLen - 1) / maxLen;
                    if (chunks > maxHtmlChunks) maxHtmlChunks = chunks;
                }
                if (!string.IsNullOrEmpty(doc.Images))
                {
                    int chunks = (doc.Images.Length + maxLen - 1) / maxLen;
                    if (chunks > maxImagesChunks) maxImagesChunks = chunks;
                }
            }

            using var workbook = new XLWorkbook();
            // --- DocumentExports 工作表 ---
            var wsDoc = workbook.Worksheets.Add("DocumentExports");
            int col = 1;
            wsDoc.Cell(1, col++).Value = "Id";
            wsDoc.Cell(1, col++).Value = "Category";
            wsDoc.Cell(1, col++).Value = "Station";
            wsDoc.Cell(1, col++).Value = "PageNo";
            wsDoc.Cell(1, col++).Value = "SequenceNo";
            wsDoc.Cell(1, col++).Value = "DocumentId";
            wsDoc.Cell(1, col++).Value = "CreatedById";
            wsDoc.Cell(1, col++).Value = "CreatedByName";
            wsDoc.Cell(1, col++).Value = "LatestTime";
            wsDoc.Cell(1, col++).Value = "Version";
            wsDoc.Cell(1, col++).Value = "Suffix";
            //  動態產生 HtmlContent 標題
            for (int i = 1; i <= maxHtmlChunks; i++)
                wsDoc.Cell(1, col++).Value = $"HtmlContent {i}";
            //  動態產生 Images 標題
            for (int i = 1; i <= maxImagesChunks; i++)
                wsDoc.Cell(1, col++).Value = $"Images {i}";
            wsDoc.Cell(1, col++).Value = "Comment";

            //  寫入最新版本，且把 Version 的值都寫成 1
            int row = 2;
            foreach (var doc in latestDocs)
            {
                col = 1;
                wsDoc.Cell(row, col++).Value = doc.Id;
                wsDoc.Cell(row, col++).Value = doc.Category;
                wsDoc.Cell(row, col++).Value = doc.Station;
                wsDoc.Cell(row, col++).Value = doc.PageNo;
                wsDoc.Cell(row, col++).Value = doc.SequenceNo;
                wsDoc.Cell(row, col++).Value = doc.DocumentId;
                wsDoc.Cell(row, col++).Value = doc.CreatedById;
                wsDoc.Cell(row, col++).Value = doc.CreatedByName;
                wsDoc.Cell(row, col++).Value = doc.LatestTime.HasValue
                    ? doc.LatestTime.Value.ToString("yyyy-MM-dd HH:mm:ss")
                    : "";
                // 把原 Version 改寫為 1
                wsDoc.Cell(row, col++).Value = 1;
                wsDoc.Cell(row, col++).Value = doc.Suffix;

                // HtmlContent 分段
                var htmlChunks = SplitIntoChunks(doc.HtmlContent, maxLen);
                for (int i = 0; i < maxHtmlChunks; i++)
                    wsDoc.Cell(row, col++).Value = i < htmlChunks.Count ? htmlChunks[i] : "";

                // Images 分段
                var imageChunks = SplitIntoChunks(doc.Images, maxLen);
                for (int i = 0; i < maxImagesChunks; i++)
                    wsDoc.Cell(row, col++).Value = i < imageChunks.Count ? imageChunks[i] : "";

                wsDoc.Cell(row, col++).Value = doc.Comment;
                row++;
            }

            // --- HtmlSections 工作表（僅最新版本段落，Version 全部寫為 1） ---
            var wsHtml = workbook.Worksheets.Add("HtmlSections");
            wsHtml.Cell(1, 1).Value = "Id";
            wsHtml.Cell(1, 2).Value = "DocumentExportId";
            wsHtml.Cell(1, 3).Value = "HtmlPart";
            wsHtml.Cell(1, 4).Value = "Version";

            row = 2;
            foreach (var sec in htmlSections)
            {
                wsHtml.Cell(row, 1).Value = sec.Id;
                wsHtml.Cell(row, 2).Value = sec.DocumentExportId;
                wsHtml.Cell(row, 3).Value = sec.HtmlPart;
                wsHtml.Cell(row, 4).Value = 1;
                row++;
            }

            // 5) 回傳檔案
            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            var bytes = ms.ToArray();
            return File(bytes,
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "LatestVersionData.xlsx");
        }

        /// <summary>
        /// 將指定字串依指定長度切割成多個區塊。
        /// </summary>
        /// <param name="input">原始字串</param>
        /// <param name="chunkSize">每塊最大長度</param>
        /// <returns>字串區塊清單</returns>
        private List<string> SplitIntoChunks(string input, int chunkSize)
        {
            var chunks = new List<string>();
            if (string.IsNullOrEmpty(input))
                return chunks;
            for (int i = 0; i < input.Length; i += chunkSize)
            {
                chunks.Add(input.Substring(i, Math.Min(chunkSize, input.Length - i)));
            }
            return chunks;
        }


        /// <summary>
        /// 匯入 Excel 檔案更新 DocumentExport 與 HtmlSection 資料
        /// </summary>
        [HttpPost]
        public IActionResult ImportDocumentData(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return Json(new { success = false, message = "請選擇一個有效的 Excel 文件。" });
            }

            try
            {
                using (var stream = new MemoryStream())
                {
                    file.CopyTo(stream);
                    using (var workbook = new XLWorkbook(stream))
                    {
                        // 預期 Excel 會有兩個工作表，分別命名為 "DocumentExports" 與 "HtmlSections"
                        var wsDoc = workbook.Worksheets.Worksheet("DocumentExports");
                        var wsHtml = workbook.Worksheets.Worksheet("HtmlSections");

                        // 清除原有資料：先刪除 HtmlSections，再刪除 DocumentExports
                        var oldHtmls = _unitOfWork.DbContext.HtmlSections.ToList();
                        _unitOfWork.DbContext.HtmlSections.RemoveRange(oldHtmls);
                        var oldDocs = _unitOfWork.DbContext.DocumentExports.ToList();
                        _unitOfWork.DbContext.DocumentExports.RemoveRange(oldDocs);
                        _unitOfWork.Save();

                        // 重新設定 Identity 序列，使新資料從 1 開始
                        _unitOfWork.DbContext.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('DocumentExports', RESEED, 0)");
                        _unitOfWork.DbContext.Database.ExecuteSqlRaw("DBCC CHECKIDENT ('HtmlSections', RESEED, 0)");

                        // 取得表頭資訊，找出 HtmlContent 與 Images 分段的欄位索引
                        var headerRow = wsDoc.Row(1);
                        int totalColumns = headerRow.LastCellUsed().Address.ColumnNumber;
                        List<int> htmlIndexes = new List<int>();
                        List<int> imagesIndexes = new List<int>();
                        for (int i = 1; i <= totalColumns; i++)
                        {
                            string header = headerRow.Cell(i).GetString();
                            if (header.StartsWith("HtmlContent"))
                                htmlIndexes.Add(i);
                            else if (header.StartsWith("Images"))
                                imagesIndexes.Add(i);
                        }

                        // 建立 mapping：Excel 原 DocumentExport.Id  => 新產生的 DocumentExport.Id
                        var mapping = new Dictionary<int, int>();

                        // 讀取 DocumentExports 工作表（從第2行開始，第一行為標題）
                        var rowsDoc = wsDoc.RowsUsed().Skip(1);
                        foreach (var row in rowsDoc)
                        {
                            // Excel 中的第一欄作為 mapping key
                            int excelDocId = (int)row.Cell(1).GetValue<double>();

                            // 固定欄位依序讀取：2-6為原有欄位，7-11為新增欄位
                            string category = row.Cell(2).GetString();
                            string station = row.Cell(3).GetString();
                            string pageNo = row.Cell(4).GetString();
                            string sequenceNo = row.Cell(5).GetString();
                            string documentId = row.Cell(6).GetString();
                            string createdById = row.Cell(7).GetString();
                            string createdByName = row.Cell(8).GetString();
                            string latestTimeStr = row.Cell(9).GetString();
                            DateTime? latestTime = null;
                            if (DateTime.TryParse(latestTimeStr, out DateTime parsedDate))
                            {
                                latestTime = parsedDate;
                            }
                            int version = 0;
                            int.TryParse(row.Cell(10).GetString(), out version);
                            string suffix = row.Cell(11).GetString();

                            // 讀取 HtmlContent 分段：將所有對應欄位內容合併
                            string htmlContent = "";
                            foreach (var idx in htmlIndexes)
                            {
                                htmlContent += row.Cell(idx).GetString();
                            }
                            // 讀取 Images 分段：合併所有對應欄位內容
                            string images = "";
                            foreach (var idx in imagesIndexes)
                            {
                                images += row.Cell(idx).GetString();
                            }
                            // Comment 為最後一欄
                            string comment = row.Cell(totalColumns).GetString();

                            var newDoc = new DocumentExport
                            {
                                Category = category,
                                Station = station,
                                PageNo = pageNo,
                                SequenceNo = sequenceNo,
                                DocumentId = documentId,
                                CreatedById = createdById,
                                CreatedByName = createdByName,
                                LatestTime = latestTime,
                                Version = version,
                                Suffix = suffix,
                                HtmlContent = htmlContent,
                                Images = images,
                                Comment = comment
                            };

                            _unitOfWork.DbContext.DocumentExports.Add(newDoc);
                            _unitOfWork.Save(); // 儲存以取得 newDoc.Id

                            mapping[excelDocId] = newDoc.Id;
                        }

                        // 讀取 HtmlSections 工作表（從第2行開始，第一行為標題）
                        var rowsHtml = wsHtml.RowsUsed().Skip(1);
                        foreach (var row in rowsHtml)
                        {
                            // 讀取 Excel 原有的 DocumentExport.Id
                            int excelDocId = (int)row.Cell(2).GetValue<double>();
                            // 利用 mapping 取得新 DocumentExport.Id；若無對應則跳過
                            if (!mapping.TryGetValue(excelDocId, out int newDocId))
                            {
                                continue;
                            }

                            // 讀取 HtmlPart 與 Version (第四欄)
                            string htmlPart = row.Cell(3).GetString();
                            int sectionVersion = 0;
                            int.TryParse(row.Cell(4).GetString(), out sectionVersion);

                            var newHtmlSec = new HtmlSection
                            {
                                // 不設定 Id，由資料庫自動產生
                                DocumentExportId = newDocId,
                                HtmlPart = htmlPart,
                                Version = sectionVersion  // 輸入 Version 資料
                            };

                            _unitOfWork.DbContext.HtmlSections.Add(newHtmlSec);
                        }
                        _unitOfWork.Save();
                    }
                }

                return Json(new { success = true, message = "匯入成功！" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "匯入失敗：" + ex.Message });
            }
        }

        /// <summary>
        /// 續著匯入：保留舊資料，若相同 (Category+Station+PageNo+Suffix) 則版本+1，否則新增新記錄
        /// </summary>
        [HttpPost]
        public IActionResult AppendImportDocumentData(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return Json(new { success = false, message = "請選擇一個有效的 Excel 檔案。" });

            try
            {
                // 1. 讀檔並解析 Excel
                using var stream = new MemoryStream();
                file.CopyTo(stream);
                using var workbook = new XLWorkbook(stream);
                var wsDoc = workbook.Worksheets.Worksheet("DocumentExports");
                var wsHtml = workbook.Worksheets.Worksheet("HtmlSections");

                // 2. 把所有 HtmlSection 依第一欄 excelId 分組 (每頁所有模塊先分好組)
                var htmlGroups = wsHtml.RowsUsed()
                    .Skip(1)
                    .GroupBy(r => (int)r.Cell(2).GetValue<double>())
                    .ToDictionary(g => g.Key, g => g.ToList());

                // 3. 判斷前端是否要求「依版本拆分存」
                bool needSplitVersion = Request.Form.ContainsKey("splitVersion");

                // 4. 逐筆處理每一頁（DocumentExport 表的每一列）
                foreach (var row in wsDoc.RowsUsed().Skip(1))
                {
                    int excelId = (int)row.Cell(1).GetValue<double>();
                    string category = row.Cell(2).GetString();
                    string station = row.Cell(3).GetString();
                    string pageNo = row.Cell(4).GetString();
                    string suffix = row.Cell(11).GetString();
                    string comment = row.Cell(row.LastCellUsed().Address.ColumnNumber).GetString();

                    // 取出這頁所有的模塊列
                    htmlGroups.TryGetValue(excelId, out var modules);
                    if (modules == null || !modules.Any())
                        continue;  // 無模塊就跳過

                    // 查同一頁是否已有紀錄
                    var existing = _unitOfWork.DbContext.DocumentExports
                        .FirstOrDefault(d =>
                            d.Category == category &&
                            d.Station == station &&
                            d.PageNo == pageNo &&
                            d.Suffix == suffix);

                    if (!needSplitVersion)
                    {
                        // ▼ 若不拆分，各自沿用舊邏輯（可自行決定要 replace 還是 append）
                        // 這裡可呼叫原本的迴圈或封裝方法
                    }
                    else
                    {
                        // ◆◆ 依版本拆分存：先把各模塊群按 Excel 裡的 Version 欄分組
                        var modulesByVer = modules
                            .GroupBy(r =>
                            {
                                int v = (int)r.Cell(4).GetValue<double>(); // 欄位4儲存原始 Version
                                return v <= 0 ? 1 : v;                    // 空值視為 1
                            })
                            .OrderBy(g => g.Key)
                            .ToList();

                        if (existing != null)
                        {
                            // ★ 已存在：從 existing.Version +1 開始，對每組各存一個新版本
                            int curVer = existing.Version;
                            foreach (var grp in modulesByVer)
                            {
                                curVer++;
                                existing.Version = curVer;
                                existing.LatestTime = DateTime.Now;
                                existing.Comment = comment;
                                _unitOfWork.DbContext.DocumentExports.Update(existing);
                                _unitOfWork.DbContext.SaveChanges();

                                foreach (var modRow in grp)
                                {
                                    _unitOfWork.DbContext.HtmlSections.Add(new HtmlSection
                                    {
                                        DocumentExportId = existing.Id,
                                        HtmlPart = modRow.Cell(3).GetString(),
                                        Version = curVer
                                    });
                                }
                                _unitOfWork.DbContext.SaveChanges();
                            }
                        }
                        else
                        {
                            // ★ 全新一頁：第一組先存 Version=1，後續組依序 +1
                            var doc = new DocumentExport
                            {
                                Category = category,
                                Station = station,
                                PageNo = pageNo,
                                SequenceNo = row.Cell(5).GetString(),
                                DocumentId = row.Cell(6).GetString(),
                                CreatedById = row.Cell(7).GetString(),
                                CreatedByName = row.Cell(8).GetString(),
                                LatestTime = DateTime.Now,
                                Version = 1,
                                Suffix = suffix,
                                HtmlContent = null,
                                Images = "",
                                Comment = comment
                            };
                            _unitOfWork.DbContext.DocumentExports.Add(doc);
                            _unitOfWork.DbContext.SaveChanges();

                            int curVer = 1;
                            foreach (var grp in modulesByVer)
                            {
                                // 第一組已存，後續需遞增
                                if (grp.Key != modulesByVer.First().Key)
                                {
                                    curVer++;
                                    doc.Version = curVer;
                                    doc.LatestTime = DateTime.Now;
                                    _unitOfWork.DbContext.DocumentExports.Update(doc);
                                    _unitOfWork.DbContext.SaveChanges();
                                }

                                foreach (var modRow in grp)
                                {
                                    _unitOfWork.DbContext.HtmlSections.Add(new HtmlSection
                                    {
                                        DocumentExportId = doc.Id,
                                        HtmlPart = modRow.Cell(3).GetString(),
                                        Version = curVer
                                    });
                                }
                                _unitOfWork.DbContext.SaveChanges();
                            }
                        }
                    }
                }

                return Json(new { success = true, message = "續著匯入：已依版本拆分並儲存完成！" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "續著匯入失敗：" + ex.Message });
            }
        }


        // GET /Customer/SurveyEdit/GetHtmlSections
        public async Task<IActionResult> GetHtmlSections(int documentId, int? version)
        {
            var query = _unitOfWork.DbContext.HtmlSections
                           .Where(h => h.DocumentExportId == documentId);
            if (version.HasValue)
                query = query.Where(h => h.Version == version.Value);
            var list = await query
                .Select(h => new { h.Id, HtmlPart = h.HtmlPart })
                .ToListAsync();
            return Json(new { success = true, sections = list });
        }

        /// <summary>
        /// 接收前端傳來的單筆 HtmlSection 更新
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> UpdateSingleHtmlSection([FromBody] UpdateSingleHtmlSectionDto dto)
        {
            var sec = await _unitOfWork.DbContext.HtmlSections.FindAsync(dto.SectionId);
            if (sec == null)
                return Json(new { success = false, message = "找不到此 HtmlSection" });

            sec.HtmlPart = dto.HtmlPart;
            _unitOfWork.DbContext.HtmlSections.Update(sec);
            await _unitOfWork.DbContext.SaveChangesAsync();

            return Json(new { success = true });
        }






        // ★ 保留原路由 UploadImage，呼叫 UploadFile
        [HttpPost]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            // 1) 其實是交給新版 UploadFile 去分流
            return await UploadFile(file);
        }

        // 【新】通用上傳：圖片 或 PDF
        [HttpPost]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("未選擇檔案");

            var ext = Path.GetExtension(file.FileName).ToLower();
            if (ext == ".pdf")
                return await UploadPdfAsync(file);       // PDF→轉圖
            else if (ext == ".jpg" || ext == ".jpeg"
                  || ext == ".png" || ext == ".gif")
                return await UploadImageAsync(file);     // 圖片上傳（網路磁碟）
            else
                return BadRequest("不支援的檔案格式");
        }

        // ★ 保留原有「圖片上傳到網路磁碟」邏輯 ★
        private async Task<IActionResult> UploadImageAsync(IFormFile image)
        {
            // 1. 讀取網路磁碟設定
            var sharedPath = _configuration["NetworkShare:SharedPath"];
            var username = _configuration["NetworkShare:Username"];
            var password = _configuration["NetworkShare:Password"];

            // 2. 建立唯一檔名
            var uniqueName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
            var destPath = Path.Combine(sharedPath, uniqueName);

            try
            {
                // 3. 掛載網路磁碟
                var mount = RunCommand($"net use {sharedPath} /user:{username} {password}");
                if (mount.ExitCode != 0)
                    return Json(new { success = false, message = $"掛載失敗：{mount.Output}" });

                // 4. 確保資料夾存在
                if (!Directory.Exists(sharedPath))
                    Directory.CreateDirectory(sharedPath);

                // 5. 寫入檔案
                using (var fs = new FileStream(destPath, FileMode.Create))
                {
                    await image.CopyToAsync(fs);
                }

                // 6. 解除掛載
                RunCommand($"net use {sharedPath} /delete");

                return Json(new { success = true, message = "圖片已成功上傳至網路磁碟！" });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"上傳失敗：{ex.Message}" });
            }
        }

        // 新增：PDF 轉 PNG，結果先存本地再回傳 URL
        // 新增或替換原本的 UploadPdfAsync 方法
        private async Task<IActionResult> UploadPdfAsync(IFormFile pdf)
        {
            if (pdf == null || pdf.Length == 0)
                return BadRequest(new { success = false, message = "未選擇 PDF 檔案。" });

            // 1. 準備儲存路徑
            var webRoot = _hostingEnv.WebRootPath;
            var saveDir = Path.Combine(webRoot, "uploads", "pdfimages");
            if (!Directory.Exists(saveDir))
                Directory.CreateDirectory(saveDir);

            // 2. 儲存上傳的 PDF
            var pdfFileName = $"{Guid.NewGuid()}{Path.GetExtension(pdf.FileName)}";
            var pdfPath = Path.Combine(saveDir, pdfFileName);
            using (var stream = new FileStream(pdfPath, FileMode.Create))
            {
                await pdf.CopyToAsync(stream);
            }

            var urls = new List<string>();

            // 3. 用 PdfiumViewer 逐頁渲染成圖片
            using (var document = PdfiumPdfDocument.Load(pdfPath))
            {
                for (int page = 0; page < document.PageCount; page++)
                {
                    using (var image = document.Render(page, 300, 300, true))
                    {
                        var imgName = $"{Path.GetFileNameWithoutExtension(pdfFileName)}_{page + 1:D3}.png";
                        var imgPath = Path.Combine(saveDir, imgName);
                        image.Save(imgPath, ImageFormat.Png);
                        // 回傳給前端的虛擬路徑
                        urls.Add($"/uploads/pdfimages/{imgName}");
                    }
                }
            }

            // （選擇性）刪除臨時 PDF 原檔：
            //  System.IO.File.Delete(pdfPath);

            // 4. 回傳所有圖片 URL
            return Json(new { success = true, images = urls });
        }





        [HttpPost]
        public async Task<IActionResult> UploadAnswerImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return Json(new { success = false, message = "未收到任何檔案。" });

            // 1. 確認本機磁碟資料夾
            string dest = @"K:\AnswerImage";
            if (!Directory.Exists(dest))
                Directory.CreateDirectory(dest);

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var urls = new List<string>();

            try
            {
                if (ext == ".pdf")
                {
                    // — PDF 轉 PNG, scale 以 72 pt→pixel 基准算出宽高 —
                    const float targetDpi = 1200f;    // 你需要的输出 DPI
                    float scale = targetDpi / 72f;     // 从 point → pixel 的放大倍数

                    // 先存 PDF
                    var pdfName = $"{Guid.NewGuid()}.pdf";
                    var pdfPath = Path.Combine(dest, pdfName);
                    using (var fs = new FileStream(pdfPath, FileMode.Create))
                        await file.CopyToAsync(fs);

                    using (var doc = PdfiumPdfDocument.Load(pdfPath))
                    {
                        for (int page = 0; page < doc.PageCount; page++)
                        {
                            // 1. 拿到原始页面尺寸（pt 单位）
                            var size = doc.PageSizes[page];
                            // 2. 计算输出像素尺寸
                            int pxWidth = (int)(size.Width * scale);
                            int pxHeight = (int)(size.Height * scale);

                            // 3. 用像素尺寸来渲染
                            using (var bmp = doc.Render(page, pxWidth, pxHeight, true))
                            {
                                var imgName = $"{Path.GetFileNameWithoutExtension(pdfName)}_{page + 1:D3}.png";
                                var imgPath = Path.Combine(dest, imgName);
                                bmp.Save(imgPath, ImageFormat.Png);
                                urls.Add($"/images/AnswerImage/{imgName}");
                            }
                        }
                    }

                    // 刪掉暫存 PDF
                    System.IO.File.Delete(pdfPath);
                }
                else if (new[] { ".jpg", ".jpeg", ".png", ".gif" }.Contains(ext))
                {
                    // — 單張圖片上傳 —
                    var imgName = $"{Guid.NewGuid()}{ext}";
                    var imgPath = Path.Combine(dest, imgName);
                    using (var fs = new FileStream(imgPath, FileMode.Create))
                        await file.CopyToAsync(fs);
                    urls.Add($"/images/AnswerImage/{imgName}");
                }
                else
                {
                    return Json(new { success = false, message = "不支援的檔案格式。" });
                }

                return Json(new { success = true, images = urls });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = $"處理失敗：{ex.Message}" });
            }
        }




        [HttpGet]
        public IActionResult GetAnswerImages(string ntNum, string surveyId, int version, int stage)
        {
            // 檢查必要參數 ntNum 與 surveyId
            if (string.IsNullOrWhiteSpace(ntNum) || string.IsNullOrWhiteSpace(surveyId))
            {
                return BadRequest(new { success = false, message = "參數錯誤：ntNum 與 surveyId 為必填" });
            }

            // 由於資料模型中 SurveyId 為 int，故需將 surveyId 字串轉為 int
            if (!int.TryParse(surveyId, out int surveyIdInt))
            {
                return BadRequest(new { success = false, message = "surveyId 格式錯誤，必須為數字" });
            }

            // 從資料庫中查詢符合條件的記錄（依 ntNum、surveyId、version 與 stage）
            var record = _unitOfWork.DbContext.MtNumAnswereds
                            .FirstOrDefault(x => x.MtNum == ntNum &&
                                                 x.SurveyId == surveyIdInt &&
                                                 x.Version == version &&
                                                 x.Stage == stage);

            if (record == null)
            {
                return Ok(new { success = false, data = new string[] { }, message = "查無符合條件的記錄" });
            }

            // 假設資料庫中 Images 欄位儲存的是逗號分隔的圖片 URL 字串
            var imagesData = record.Images;
            var imageList = new List<object>();

            if (!string.IsNullOrWhiteSpace(imagesData))
            {
                // 將圖片字串以逗號分隔，並移除多餘空白
                try
                {
                    var images = System.Text.Json.JsonSerializer.Deserialize<List<ImageData>>(imagesData);
                    foreach (var image in images)
                    {
                        imageList.Add(new { imageUrl = image.src, width = image.width, height = image.height });
                    }
                }
                catch
                {
                    // 若解析失敗，備援以逗號分隔
                    var images = imagesData.Split(',')
                                    .Select(img => img.Trim())
                                    .Where(img => !string.IsNullOrEmpty(img));
                    foreach (var img in images)
                    {
                        imageList.Add(new { imageUrl = img });
                    }
                }
            }

            return Ok(new { success = true, data = imageList });
        }

        /// <summary>
        /// 複製同意 API
        /// 傳入表單欄位：
        ///   differences：使用者填寫的差異說明（必填）
        ///   pdf：上傳的前版 PDF 文件（必填）
        /// 將 PDF 文件與文字資料分別儲存到 K 槽下指定的目錄中
        /// </summary>
        /// <param name="pdf">上傳的 PDF 文件</param>
        /// <param name="differences">使用者填寫的差異描述</param>
        /// <returns></returns>
        [HttpPost]
        public async Task<IActionResult> CopyConsent(
        [FromForm] IFormFile pdf,
        [FromForm] string differences,
        [FromForm] bool noPdf,       // 勾選「無PDF」時為 true，否則為 false
        [FromForm] string pdfPassword) // PDF 密碼（選填，不作驗證）
        {
            // 差異描述為必填
            if (string.IsNullOrWhiteSpace(differences))
            {
                return BadRequest(new { success = false, message = "請填寫與前版料號差異的描述。" });
            }

            // 若未勾選無PDF但未上傳 PDF，回傳錯誤
            if (!noPdf && pdf == null)
            {
                return BadRequest(new { success = false, message = "請上傳PDF文件，或勾選無PDF。" });
            }

            try
            {
                // 讀取配置檔：若無設定則預設使用 K:\CopyConsent
                string consentFolder = _configuration["CopyConsentFolder"];
                if (string.IsNullOrWhiteSpace(consentFolder))
                {
                    consentFolder = @"K:\CopyConsent";
                }
                // 檢查資料夾是否存在，若不存在則建立
                if (!Directory.Exists(consentFolder))
                {
                    Directory.CreateDirectory(consentFolder);
                }

                string uniqueFileName = "";
                string pdfFilePath = "";
                if (!noPdf && pdf != null)
                {
                    // 產生唯一檔名 (以 GUID 為基礎)
                    string pdfExtension = Path.GetExtension(pdf.FileName);
                    uniqueFileName = $"{Guid.NewGuid()}{pdfExtension}";
                    pdfFilePath = Path.Combine(consentFolder, uniqueFileName);

                    // 儲存上傳的 PDF 文件
                    using (var stream = new FileStream(pdfFilePath, FileMode.Create))
                    {
                        await pdf.CopyToAsync(stream);
                    }
                }
                else
                {
                    // 如勾選無PDF，則不存 PDF，並記錄為 "NoPDF"
                    uniqueFileName = "NoPDF";
                }

                // 儲存差異描述文字檔
                // 若有上傳PDF，文字檔名稱與 PDF 相同但副檔名轉成 .txt；否則產生新的檔名
                string diffFileName = (!noPdf && pdf != null)
                                      ? Path.ChangeExtension(uniqueFileName, ".txt")
                                      : $"{Guid.NewGuid()}.txt";
                string diffFilePath = Path.Combine(consentFolder, diffFileName);
                System.IO.File.WriteAllText(diffFilePath, differences);

                return Ok(new
                {
                    success = true,
                    message = "複製同意內容已成功儲存！",
                    pdfFile = uniqueFileName,
                    diffFile = diffFileName
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "儲存失敗：" + ex.Message });
            }
        }

        /// <summary>
        /// 利用 PDFiumViewer 將上傳的 PDF 轉成圖片，存放在 K:\TempPdfImages
        /// 並回傳 JSON 格式的圖片 URL 陣列。
        /// 前提：請先安裝 PDFiumViewer 套件（用 NuGet 安裝即可）。
        /// </summary>
        /// <param name="pdf">上傳的 PDF 檔案</param>
        /// <returns>JSON: { "success": true, "images": [ "/TempPdfImages/output_001.png", ... ] }</returns>
        // 以下是修改後的 ConvertPdfToImages 方法
        [HttpPost]
        public async Task<IActionResult> ConvertPdfToImages(IFormFile pdf, string pdfPassword)
        {
            if (pdf == null || pdf.Length == 0)
            {
                return BadRequest(new { success = false, message = "請上傳有效的 PDF 文件." });
            }

            // 設定暫存資料夾 (例如使用 K:\TempPdfImages)
            string tempFolder = @"K:\TempPdfImages";
            if (!Directory.Exists(tempFolder))
            {
                Directory.CreateDirectory(tempFolder);
            }

            // 1. 儲存上傳的 PDF 至暫存檔案
            string originalPdfFileName = $"{Guid.NewGuid()}{Path.GetExtension(pdf.FileName)}";
            string uploadedPdfPath = Path.Combine(tempFolder, originalPdfFileName);
            using (var stream = new FileStream(uploadedPdfPath, FileMode.Create))
            {
                await pdf.CopyToAsync(stream);
            }

            // 2. 決定是否需要解密
            // 如果沒有提供密碼，則認定檔案未加密；否則執行解密流程
            string fileToConvertPath = uploadedPdfPath; // 預設直接使用上傳檔案
            bool isDecrypting = !string.IsNullOrEmpty(pdfPassword);
            string decryptedPdfPath = ""; // 若需要解密，此為未加密檔案的完整路徑

            if (isDecrypting)
            {
                decryptedPdfPath = "decrypted_" + originalPdfFileName;
                decryptedPdfPath = Path.Combine(tempFolder, decryptedPdfPath);
                try
                {
                    // 使用 iText7 解密 PDF
                    using (var reader = new PdfReader(uploadedPdfPath, new ITextReaderProps().SetPassword(Encoding.UTF8.GetBytes(pdfPassword))))
                    using (var writer = new PdfWriter(decryptedPdfPath))
                    using (var pdfDoc = new iTextPdfDocument(reader, writer))
                    {
                        pdfDoc.Close();
                    }
                    fileToConvertPath = decryptedPdfPath;
                }
                catch (Exception ex)
                {
                    // 若解密失敗，刪除上傳檔案並回傳錯誤
                    if (System.IO.File.Exists(uploadedPdfPath))
                        System.IO.File.Delete(uploadedPdfPath);
                    return BadRequest(new { success = false, message = "PDF 解密失敗，請確認密碼正確：" + ex.Message });
                }
                // 刪除上傳的加密檔案（解密成功後已不再需要）
                if (System.IO.File.Exists(uploadedPdfPath))
                    System.IO.File.Delete(uploadedPdfPath);
            }

            // 3. 使用 PdfiumViewer 載入「待轉換」的 PDF，逐頁轉成圖片
            var imageUrls = new List<string>();
            try
            {
                // 明確使用 PdfiumViewer 的 PdfDocument（使用別名 PdfiumPdfDocument）
                using (var document = PdfiumPdfDocument.Load(fileToConvertPath))
                {
                    for (int pageIndex = 0; pageIndex < document.PageCount; pageIndex++)
                    {
                        using (var image = document.Render(pageIndex, 150, 150, true))
                        {
                            string outputFileName = $"output_{pageIndex + 1:D3}.png";
                            string outputPath = Path.Combine(tempFolder, outputFileName);
                            image.Save(outputPath, System.Drawing.Imaging.ImageFormat.Png);
                            // 假設前端已將 /TempPdfImages/ 映射到 K:\TempPdfImages
                            imageUrls.Add("/TempPdfImages/" + outputFileName);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }

            // 若有進行解密，則刪除解密後的暫存檔案以節省空間
            if (isDecrypting && System.IO.File.Exists(fileToConvertPath))
            {
                System.IO.File.Delete(fileToConvertPath);
            }

            return Ok(new { success = true, images = imageUrls });
        }


        /// <summary>
        /// 將所有 DocumentExport 與 HtmlSection 的 Version 重置為 1
        /// </summary>
        [HttpPost]
        public IActionResult ResetAllVersions()
        {
            // 1) 一次更新所有 DocumentExport.Version
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("UPDATE DocumentExports SET Version = 1");
            // 2) 一次更新所有 HtmlSection.Version
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("UPDATE HtmlSections SET Version = 1");

            return Ok(new { success = true, message = "所有版本已重置為 1" });
        }

        [HttpGet]
        public IActionResult GetAvailableVersions(int documentId)
        {
            var versions = _unitOfWork.DbContext.HtmlSections
              .Where(h => h.DocumentExportId == documentId)
              .Select(h => h.Version)
              .Distinct()
              .OrderBy(v => v)
              .ToList();
            return Ok(versions);
        }





        // 執行系統指令
        private (int ExitCode, string Output) RunCommand(string command)
        {
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = $"/c {command}",
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };

            process.Start();
            string output = process.StandardOutput.ReadToEnd() + process.StandardError.ReadToEnd();
            process.WaitForExit();

            return (process.ExitCode, output);
        }



        public ActionResult UpdateSurveyImages(int surveyId)
        {
            var survey = _unitOfWork.HtmlSection.GetAll(s => s.DocumentExportId == surveyId);
            if (survey == null)
            {
                TempData["error"] = "找不到資料";
            }

            foreach (var item in survey)
            {
                string updatedHtml = saveToSMB(item.HtmlPart);
                // 更新 HTML
                item.HtmlPart = updatedHtml;
                _unitOfWork.Save();
            }

            return Content("圖片已轉存並更新 HTML！");
        }



        private string saveToSMB(string htmlContent)
        {
            if (string.IsNullOrEmpty(htmlContent))
            {
                return htmlContent;
            }
            string pattern = @"<img[^>]+src=""data:image/(?<type>png|jpeg|jpg|gif|webp);base64,(?<data>[^""]+)""";
            MatchCollection matches = Regex.Matches(htmlContent, pattern);
            Console.WriteLine($"找到 {matches.Count} 個");

            string sharedPath = _configuration["SharedPath"];
            string imgUrl = "http://#/images/";

            foreach (Match match in matches)
            {
                string base64Data = match.Groups["data"].Value;
                string imageType = match.Groups["type"].Value;
                byte[] imageBytes = Convert.FromBase64String(base64Data);

                // 生成唯一文件名
                string fileName = $"{Guid.NewGuid()}.{imageType}";
                string savePath = Path.Combine(sharedPath, fileName);

                try
                {
                    // **儲存圖片到網路磁碟**
                    System.IO.File.WriteAllBytes(savePath, imageBytes);

                    // **替換 HTML**
                    string newImageUrl = $"{imgUrl}{fileName}";
                    htmlContent = htmlContent.Replace(match.Value, $"<img src=\"{newImageUrl}\" />");
                }
                catch (Exception ex)
                {
                    // 記錄錯誤（可選）
                    Console.WriteLine($"存圖片錯誤: {ex.Message}");
                }
            }
            return htmlContent;
        }


        //[HttpPost]
        //public async uploadToSMB()

    }






    #region Model




    public class HtmlDto
    {
        public string PageHtml { get; set; }

        // 加上以下新欄位：
        public string Category { get; set; }   // 種類
        public string Station { get; set; }    // 站別
        public string PageNo { get; set; }     // 頁數
        public string SequenceNo { get; set; } // 序號 (若需要)
        public string DocumentId { get; set; } // 文件編號
        public string Suffix { get; set; }     // 後綴 (若空則用"一般")

        // ★ 新增一個：forceReplace => 是否強制覆蓋
        public bool ForceReplace { get; set; }

    }

    // 用於接收更新需求的 DTO
    public class UpdateHtmlSectionsDto
    {
        public int DocumentId { get; set; }
        public string HtmlContent { get; set; }
    }

    public class SurveyAnswerDto
    {
        public string Category { get; set; }
        public string Station { get; set; }
        public string PageNo { get; set; }
        public string SequenceNo { get; set; }
        public string DocumentId { get; set; }
        public string HtmlContent { get; set; }
        public string AnswerJson { get; set; }
        public string Images { get; set; }
        public string Comment { get; set; }

        // ---------------- 新增欄位 ----------------
        public string? QuestionData { get; set; }  // 題目資料的 JSON 字串
        public int Version { get; set; }           // 版本編號
    }

    public class ImageData
    {
        public string src { get; set; }
        public string width { get; set; }
        public string height { get; set; }
    }



    #endregion
}