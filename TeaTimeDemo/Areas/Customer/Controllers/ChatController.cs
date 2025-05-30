//ChatController.cs

using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace TeaTimeDemo.Controllers.Customer
{
    [Area("Customer")]
    [Route("Customer/[controller]/[action]")]
    public class ChatController : Controller
    {
        [HttpPost]
        public IActionResult Ask([FromBody] QuestionRequest req)
        {
            // ChatController.cs（指定完整可執行檔路徑）
            //var ollamaPath = @"C:\Users\caitesy-tsai\AppData\Local\Programs\Ollama\ollama.exe"; // ← 請依實際安裝位置調整
            var ollamaPath = @"K:\Ollama\ollama.exe"; // ← 請依實際安裝位置調整
            var psi = new ProcessStartInfo(ollamaPath, $"run qwen2.5:14b \"{req.Question}\"")
            {
                RedirectStandardOutput = true,  // 重導標準輸出
                UseShellExecute = false, // 必須為 false 才能重導
                CreateNoWindow = true,  // 不顯示命令視窗
                StandardOutputEncoding = Encoding.UTF8 // 保證中文不亂碼
            };
            using var proc = Process.Start(psi)!;   // 啟動外部程序
            var output = proc.StandardOutput.ReadToEnd(); // 讀取所有輸出

            proc.WaitForExit();
            // 3. 回傳 JSON
            return Json(new { answer = output.Trim() });
        }
    }

    public class QuestionRequest
    {
        public string Question { get; set; }
    }
}
