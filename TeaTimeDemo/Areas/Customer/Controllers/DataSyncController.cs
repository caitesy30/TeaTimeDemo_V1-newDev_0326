// DataSyncController.cs

using ClosedXML.Excel;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using TeaTimeDemo.DataAccess.Repository.IRepository;
using TeaTimeDemo.Models;

namespace TeaTimeDemo.Controllers
{
    [Area("Customer")]
    [Authorize]
    [Route("Customer/[controller]/[action]")]
    public class DataSyncController : Controller
    {
        private readonly IUnitOfWork _unitOfWork;
        public DataSyncController(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// 一鍵匯出 3 張表：MtNumAnswereds、NotesModifies、AnsweredNotes
        /// </summary>
        [HttpGet]
        public IActionResult ExportAll()
        {
            // 讀取三張表資料（AnsweredNotes 也忽略軟刪除全域過濾器）
            var answers = _unitOfWork.DbContext.MtNumAnswereds.OrderBy(a => a.Id).ToList();
            var notes = _unitOfWork.DbContext.Set<NotesModify>()
                            .IgnoreQueryFilters().OrderBy(n => n.Id).ToList();
            var ansNotes = _unitOfWork.DbContext.Set<AnsweredNotes>()
                            .IgnoreQueryFilters().OrderBy(x => x.Id).ToList();

            const int MAX_LEN = 32767;

            // 計算分段欄位數
            int maxJsonChunks = answers.Any() ? answers.Max(a => (int)Math.Ceiling((double)(a.AnsweredJson?.Length ?? 0) / MAX_LEN)) : 1;
            int maxImgChunks = answers.Any() ? answers.Max(a => (int)Math.Ceiling((double)(a.Images?.Length ?? 0) / MAX_LEN)) : 1;
            int maxOptionChunks = ansNotes.Any() ? ansNotes.Max(x => (int)Math.Ceiling((double)(x.OptionList?.Length ?? 0) / MAX_LEN)) : 1;

            using var wb = new XLWorkbook();

            //
            // (A) MtNumAnswereds
            //
            var ws1 = wb.Worksheets.Add("MtNumAnswereds");
            var hdr1 = new System.Collections.Generic.List<string>
            {
                "Id","MtNum","SurveyId","Version","LatestTime","CreatedById","CreatedByName","Stage"
            };
            for (int i = 1; i <= maxJsonChunks; i++) hdr1.Add($"AnsweredJson_{i}");
            for (int i = 1; i <= maxImgChunks; i++) hdr1.Add($"Images_{i}");
            for (int c = 0; c < hdr1.Count; c++) ws1.Cell(1, c + 1).Value = hdr1[c];

            int row = 2;
            foreach (var a in answers)
            {
                int col = 1;
                ws1.Cell(row, col++).Value = a.Id;
                ws1.Cell(row, col++).Value = a.MtNum;
                ws1.Cell(row, col++).Value = a.SurveyId;
                ws1.Cell(row, col++).Value = a.Version;
                ws1.Cell(row, col++).Value = a.LatestTime.ToString("yyyy-MM-dd HH:mm:ss");
                ws1.Cell(row, col++).Value = a.CreatedById;
                ws1.Cell(row, col++).Value = a.CreatedByName;
                ws1.Cell(row, col++).Value = a.Stage;

                var jChunks = SplitChunks(a.AnsweredJson, MAX_LEN);
                for (int i = 0; i < maxJsonChunks; i++)
                    ws1.Cell(row, col++).Value = i < jChunks.Count ? jChunks[i] : string.Empty;

                var iChunks = SplitChunks(a.Images, MAX_LEN);
                for (int i = 0; i < maxImgChunks; i++)
                    ws1.Cell(row, col++).Value = i < iChunks.Count ? iChunks[i] : string.Empty;

                row++;
            }

            //
            // (B) NotesModifies
            //
            var ws2 = wb.Worksheets.Add("NotesModifies");
            var hdr2 = new[]
            {
                "Id","MtNum","Status","Stage","ApplicationUserId","JobName","JobNum",
                "CreateTime","CompleteTime","Remark","SortOrder","IsDeleted","DeletedAt"
            };
            for (int c = 0; c < hdr2.Length; c++) ws2.Cell(1, c + 1).Value = hdr2[c];

            row = 2;
            foreach (var n in notes)
            {
                int col = 1;
                ws2.Cell(row, col++).Value = n.Id;
                ws2.Cell(row, col++).Value = n.MtNum;
                ws2.Cell(row, col++).Value = n.Status;
                ws2.Cell(row, col++).Value = n.Stage;
                ws2.Cell(row, col++).Value = n.ApplicationUserId;
                ws2.Cell(row, col++).Value = n.JobName;
                ws2.Cell(row, col++).Value = n.JobNum;
                ws2.Cell(row, col++).Value = n.CreateTime?.ToString("yyyy-MM-dd HH:mm:ss");
                ws2.Cell(row, col++).Value = n.CompleteTime?.ToString("yyyy-MM-dd HH:mm:ss");
                ws2.Cell(row, col++).Value = n.Remark;
                ws2.Cell(row, col++).Value = n.SortOrder;
                ws2.Cell(row, col++).Value = n.IsDeleted;
                ws2.Cell(row, col++).Value = n.DeletedAt?.ToString("yyyy-MM-dd HH:mm:ss");
                row++;
            }

            //
            // (C) AnsweredNotes
            //
            var ws3 = wb.Worksheets.Add("AnsweredNotes");
            var hdr3 = new System.Collections.Generic.List<string>
            {
                "Id","PcbCategoryId","MtNum"
            };
            for (int i = 1; i <= maxOptionChunks; i++) hdr3.Add($"OptionList_{i}");
            hdr3.AddRange(new[]
            {
                "status","stage","ApplicationUserId","JobName","JobNum",
                "CreateTime","CompleteTime","Remark","SortOrder","IsDeleted","DeletedAt"
            });
            for (int c = 0; c < hdr3.Count; c++) ws3.Cell(1, c + 1).Value = hdr3[c];

            row = 2;
            foreach (var x in ansNotes)
            {
                int col = 1;
                ws3.Cell(row, col++).Value = x.Id;
                ws3.Cell(row, col++).Value = x.PcbCategoryId;
                ws3.Cell(row, col++).Value = x.MtNum;

                var oChunks = SplitChunks(x.OptionList, MAX_LEN);
                for (int i = 0; i < maxOptionChunks; i++)
                    ws3.Cell(row, col++).Value = i < oChunks.Count ? oChunks[i] : string.Empty;

                ws3.Cell(row, col++).Value = x.status;
                ws3.Cell(row, col++).Value = x.stage;
                ws3.Cell(row, col++).Value = x.ApplicationUserId;
                ws3.Cell(row, col++).Value = x.JobName;
                ws3.Cell(row, col++).Value = x.JobNum;
                ws3.Cell(row, col++).Value = x.CreateTime?.ToString("yyyy-MM-dd HH:mm:ss");
                ws3.Cell(row, col++).Value = x.CompleteTime?.ToString("yyyy-MM-dd HH:mm:ss");
                ws3.Cell(row, col++).Value = x.Remark;
                ws3.Cell(row, col++).Value = x.SortOrder;
                ws3.Cell(row, col++).Value = x.IsDeleted;
                ws3.Cell(row, col++).Value = x.DeletedAt?.ToString("yyyy-MM-dd HH:mm:ss");
                row++;
            }

            // 回傳
            using var ms = new MemoryStream();
            wb.SaveAs(ms);
            return File(ms.ToArray(),
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        "FullExport.xlsx");
        }

        /// <summary>
        /// 完全取代匯入：先 TRUNCATE 三張表，再讀 Excel 還原
        /// </summary>
        [HttpPost]
        [RequestSizeLimit(50_000_000)]
        public IActionResult ImportAll(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("請上傳 Excel 檔案");

            // 1. 清空三張表並重置 Identity
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("TRUNCATE TABLE [MtNumAnswereds];");
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("TRUNCATE TABLE [NotesModifies];");
            _unitOfWork.DbContext.Database.ExecuteSqlRaw("TRUNCATE TABLE [AnsweredNotes];");

            // 2. 讀 Excel
            using var stream = new MemoryStream();
            file.CopyTo(stream);
            using var wb = new XLWorkbook(stream);

            // ----- MtNumAnswereds 匯入（同前示範） -----
            var ws1 = wb.Worksheet("MtNumAnswereds");
            var map1 = ws1.Row(1).CellsUsed()
                        .ToDictionary(c => c.GetString(), c => c.Address.ColumnNumber);
            var jsonCols = ws1.Row(1).CellsUsed()
                        .Where(c => c.GetString().StartsWith("AnsweredJson_"))
                        .Select(c => c.Address.ColumnNumber).ToList();
            var imgCols = ws1.Row(1).CellsUsed()
                        .Where(c => c.GetString().StartsWith("Images_"))
                        .Select(c => c.Address.ColumnNumber).ToList();

            foreach (var row in ws1.RowsUsed().Skip(1))
            {
                var sbJ = new StringBuilder();
                foreach (var c in jsonCols) sbJ.Append(row.Cell(c).GetString());
                var sbI = new StringBuilder();
                foreach (var c in imgCols) sbI.Append(row.Cell(c).GetString());

                var ent = new MtNumAnswered
                {
                    MtNum = row.Cell(map1["MtNum"]).GetString(),
                    SurveyId = (int)row.Cell(map1["SurveyId"]).GetDouble(),
                    Version = (int)row.Cell(map1["Version"]).GetDouble(),
                    AnsweredJson = sbJ.ToString(),
                    Images = sbI.ToString(),
                    LatestTime = DateTime.ParseExact(
                                     row.Cell(map1["LatestTime"]).GetString(),
                                     "yyyy-MM-dd HH:mm:ss",
                                     CultureInfo.InvariantCulture),
                    CreatedById = row.Cell(map1["CreatedById"]).GetString(),
                    CreatedByName = row.Cell(map1["CreatedByName"]).GetString(),
                    Stage = (int)row.Cell(map1["Stage"]).GetDouble()
                };
                _unitOfWork.DbContext.MtNumAnswereds.Add(ent);
            }

            // ----- NotesModifies 匯入（同前示範） -----
            var ws2 = wb.Worksheet("NotesModifies");
            var map2 = ws2.Row(1).CellsUsed()
                        .ToDictionary(c => c.GetString(), c => c.Address.ColumnNumber);
            foreach (var row in ws2.RowsUsed().Skip(1))
            {
                var ent = new NotesModify
                {
                    MtNum = row.Cell(map2["MtNum"]).GetString(),
                    Status = row.Cell(map2["Status"]).GetString(),
                    Stage = (int)row.Cell(map2["Stage"]).GetDouble(),
                    ApplicationUserId =
                        row.Cell(map2["ApplicationUserId"]).GetString(),
                    JobName = row.Cell(map2["JobName"]).GetString(),
                    JobNum = row.Cell(map2["JobNum"]).GetString(),
                    CreateTime = DateTime.ParseExact(
                                     row.Cell(map2["CreateTime"]).GetString(),
                                     "yyyy-MM-dd HH:mm:ss",
                                     CultureInfo.InvariantCulture),
                    CompleteTime = string.IsNullOrWhiteSpace(row.Cell(map2["CompleteTime"]).GetString())
                                     ? null
                                     : DateTime.ParseExact(
                                         row.Cell(map2["CompleteTime"]).GetString(),
                                         "yyyy-MM-dd HH:mm:ss",
                                         CultureInfo.InvariantCulture),
                    Remark = row.Cell(map2["Remark"]).GetString(),
                    SortOrder = string.IsNullOrWhiteSpace(row.Cell(map2["SortOrder"]).GetString())
                                     ? null
                                     : int.Parse(row.Cell(map2["SortOrder"]).GetString()),
                    IsDeleted = bool.Parse(row.Cell(map2["IsDeleted"]).GetString()),
                    DeletedAt = string.IsNullOrWhiteSpace(row.Cell(map2["DeletedAt"]).GetString())
                                     ? null
                                     : DateTime.ParseExact(
                                         row.Cell(map2["DeletedAt"]).GetString(),
                                         "yyyy-MM-dd HH:mm:ss",
                                         CultureInfo.InvariantCulture)
                };
                _unitOfWork.DbContext.Set<NotesModify>().Add(ent);
            }

            // ----- AnsweredNotes 匯入 -----
            var ws3 = wb.Worksheet("AnsweredNotes");
            var map3 = ws3.Row(1).CellsUsed()
                        .ToDictionary(c => c.GetString(), c => c.Address.ColumnNumber);
            var optCols = ws3.Row(1).CellsUsed()
                        .Where(c => c.GetString().StartsWith("OptionList_"))
                        .Select(c => c.Address.ColumnNumber).ToList();

            foreach (var row in ws3.RowsUsed().Skip(1))
            {
                var sbO = new StringBuilder();
                foreach (var c in optCols) sbO.Append(row.Cell(c).GetString());

                var ent = new AnsweredNotes
                {
                    PcbCategoryId = (int)row.Cell(map3["PcbCategoryId"]).GetDouble(),
                    MtNum = row.Cell(map3["MtNum"]).GetString(),
                    OptionList = sbO.ToString(),
                    status = row.Cell(map3["status"]).GetString(),
                    stage = (int)row.Cell(map3["stage"]).GetDouble(),
                    ApplicationUserId =
                        row.Cell(map3["ApplicationUserId"]).GetString(),
                    JobName = row.Cell(map3["JobName"]).GetString(),
                    JobNum = row.Cell(map3["JobNum"]).GetString(),
                    CreateTime = DateTime.ParseExact(
                                        row.Cell(map3["CreateTime"]).GetString(),
                                        "yyyy-MM-dd HH:mm:ss",
                                        CultureInfo.InvariantCulture),
                    CompleteTime = string.IsNullOrWhiteSpace(row.Cell(map3["CompleteTime"]).GetString())
                                        ? null
                                        : DateTime.ParseExact(
                                            row.Cell(map3["CompleteTime"]).GetString(),
                                            "yyyy-MM-dd HH:mm:ss",
                                            CultureInfo.InvariantCulture),
                    Remark = row.Cell(map3["Remark"]).GetString(),
                    SortOrder = string.IsNullOrWhiteSpace(row.Cell(map3["SortOrder"]).GetString())
                                        ? null
                                        : int.Parse(row.Cell(map3["SortOrder"]).GetString()),
                    IsDeleted = bool.Parse(row.Cell(map3["IsDeleted"]).GetString()),
                    DeletedAt = string.IsNullOrWhiteSpace(row.Cell(map3["DeletedAt"]).GetString())
                                        ? null
                                        : DateTime.ParseExact(
                                            row.Cell(map3["DeletedAt"]).GetString(),
                                            "yyyy-MM-dd HH:mm:ss",
                                            CultureInfo.InvariantCulture)
                };
                _unitOfWork.DbContext.Set<AnsweredNotes>().Add(ent);
            }

            // 一次存檔
            _unitOfWork.Save();

            return Json(new { success = true, message = "三表匯入並完全取代完成！" });
        }

        // 輔助：把長字串切段
        private System.Collections.Generic.List<string> SplitChunks(string input, int chunkSize)
        {
            var list = new System.Collections.Generic.List<string>();
            if (string.IsNullOrEmpty(input)) return list;
            for (int i = 0; i < input.Length; i += chunkSize)
                list.Add(input.Substring(i, Math.Min(chunkSize, input.Length - i)));
            return list;
        }
    }
}
