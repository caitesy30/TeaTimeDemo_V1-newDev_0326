 // Program.cs
using Microsoft.EntityFrameworkCore;
using TeaTimeDemo.DataAccess.Data;
using TeaTimeDemo.DataAccess.Repository;
using TeaTimeDemo.DataAccess.Repository.IRepository;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Razor.Language.Intermediate;
using TeaTimeDemo.DataAccess.DbInitializer;
using TeaTimeDemo.Utility;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.EntityFrameworkCore.Proxies;
using AutoMapper;
using TeaTimeDemo.Mapping; // ���� AutoMapperProfile ?�e
using System.Text.Json.Serialization;
using System.Text.Json;
using Newtonsoft.Json.Serialization;
using TeaTimeDemo.Models;
using Microsoft.AspNetCore.Localization;
using System.Globalization;
using Microsoft.AspNetCore.Mvc.Razor;
using Microsoft.Extensions.Localization;
using PuppeteerSharp;
using Microsoft.Extensions.FileProviders;
using System.Diagnostics;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Extensions.Caching.Memory;
using System.IO; // 為 Directory 用
using System.Linq; // 為 Select 用

//test
// ===================== 新增 OllamaWatcher 自動啟動檢查機制 =====================
void EnsureOllamaWatcherRunning()
{
    string exePath = @"K:\OllamaWatcher\bin\Debug\net8.0\OllamaWatcher.exe";
    // 這裡的 exePath 是 OllamaWatcher.exe 的完整路徑

    string exeName = "OllamaWatcher";

    // 1. 先檢查是否有 OllamaWatcher 執行中
    var processes = Process.GetProcessesByName(exeName);

    if (processes.Length == 0)
    {
        try
        {
            // 2. 如果沒有，則啟動 OllamaWatcher.exe
            var startInfo = new ProcessStartInfo(exePath)
            {
                UseShellExecute = false,         // 不彈出黑視窗
                CreateNoWindow = true,           // 不開新視窗
                WorkingDirectory = System.IO.Path.GetDirectoryName(exePath)
            };
            Process.Start(startInfo);
            Console.WriteLine("已自動啟動 OllamaWatcher.exe！");
        }
        catch (Exception ex)
        {
            Console.WriteLine("啟動 OllamaWatcher 失敗：" + ex.Message);
        }
    }
    else
    {
        Console.WriteLine("OllamaWatcher.exe 已經在執行中。");
    }
}
// =====================

var builder = WebApplication.CreateBuilder(args);

string networkPath = @"\\prdnas\notes";
string username = "notesadm";
string password = "xzVfroYW8ogA";



void MountNetworkDrive()
{
    try
    {
        var psi = new ProcessStartInfo("net", $"use K: {networkPath} /user:{username} {password}")
        {
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            UseShellExecute = false,
            CreateNoWindow = true
        };

        using var process = Process.Start(psi);
        process.WaitForExit();

        var output = process.StandardOutput.ReadToEnd();
        var error = process.StandardError.ReadToEnd();
        //builder.Services.AddRazorPages();
        //File.WriteAllText("mountlog.txt", output + "\n" + error);
    }
    catch (Exception ex)
    {
        File.WriteAllText("mounterror.txt", ex.ToString());
    }
}



// 註冊 MemoryCache
builder.Services.AddMemoryCache();


//設定翻譯檔案路徑
builder.Services.AddLocalization(options => options.ResourcesPath = "Resources");

// 配置 Kestrel 伺服器上傳限制
builder.WebHost.ConfigureKestrel(serverOptions => {
    serverOptions.Limits.MaxRequestBodySize = 314572800; // 300MB (300 * 1024 * 1024)
});

// 配置 IIS 請求主體大小限制
builder.Services.Configure<IISServerOptions>(options => {
    options.MaxRequestBodySize = 314572800; // 300MB
});

// 配置表單選項
builder.Services.Configure<FormOptions>(options => {
    options.MultipartBodyLengthLimit = 314572800; // 300MB
});

builder.Services.AddControllersWithViews()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles; // ����ѭ�h����
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase; // ʹ�� camelCase ��ʽ
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.Never; // ������ null ֵ
    })
    .AddDataAnnotationsLocalization()
    .AddViewLocalization(LanguageViewLocationExpanderFormat.SubFolder);///////////////////////////////////////////////////////////////設定支援本地化

//網路硬碟路徑註冊
builder.Services.AddLogging();  // 註冊 Logger
builder.Services.AddSingleton<IConfiguration>(builder.Configuration); // 註冊 Configuration

// �O���Y�ώ��B?
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
      .EnableSensitiveDataLogging() // ���������Y��??���H��_�lģʽʹ��
      .UseLazyLoadingProxies() // �������t���d
    );

// �O�� Identity ����?�C
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options => 
{
    options.SignIn.RequireConfirmedAccount = true;
    // �����ܴa���Ե�
    options.Password.RequireDigit = false;
    options.Password.RequireLowercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
    options.Password.RequiredLength = 6;
})
    .AddEntityFrameworkStores<ApplicationDbContext>()
    .AddDefaultTokenProviders();

// �O�� Cookie �О�
builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = $"/Identity/Account/Login";
    options.LogoutPath = $"/Identity/Account/Logout";
    options.AccessDeniedPath = $"/Identity/Account/AccessDenied";
});

// �s�W CORS �A��
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        builder => builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// ע����?����
builder.Services.AddScoped<IDbInitializer, DbInitializer>();
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IEmailSender, EmailSender>();
builder.Services.AddScoped<IImageService, ImageService>();

//builder.Services.AddScoped<ISurveyService, SurveyService>();
builder.Services.AddScoped<IQuestionRepository, QuestionRepository>();

// 在 builder.Services.AddMemoryCache(); 下方添加
builder.Services.AddHttpClient();


// ���� SignalR ֧Ԯ
builder.Services.AddSignalR();

// ���� Razor Pages ֧Ԯ
builder.Services.AddRazorPages();

// ���� AutoMapper �K�]��ӳ���O���n
builder.Services.AddAutoMapper(typeof(AutoMapperProfile));

//�䴩�y���M��
var supportedLangs = new[] { "en-us", "zh-tw", "th-th" };
builder.Services.Configure<RequestLocalizationOptions>(options =>
{
    options.DefaultRequestCulture = new RequestCulture("zh-tw");
    options.SupportedCultures = supportedLangs.Select(s => new CultureInfo(s)).ToList();
    options.SupportedUICultures = options.SupportedCultures;
});
builder.Services.AddControllersWithViews().AddViewLocalization();

builder.Services.AddSession(options =>
{
    options.IdleTimeout = TimeSpan.FromMinutes(30); // �]�m Session �W�L�ɪ��ɶ�
    options.Cookie.HttpOnly = true;
    options.Cookie.IsEssential = true;
});
MountNetworkDrive();
EnsureOllamaWatcherRunning(); // 2. 自動檢查、沒開就啟動 OllamaWatcher.exe！
var app = builder.Build();

//網路磁碟
// 設定靜態檔案服務
string uploadsFolderPath = @"K:\QuestionImages";  // 這裡是網路磁碟中的資料夾


try
{
    // 檢查資料夾是否存在，若不存在則嘗試建立
    if (!Directory.Exists(uploadsFolderPath))
    {
        Directory.CreateDirectory(uploadsFolderPath);
    }
}
catch (Exception ex)
{
    // 建立失敗時記錄錯誤訊息，但不拋出例外，並設定 uploadsFolderPath 為 null 以略過靜態檔案設定
    Console.WriteLine($"無法建立目錄 {uploadsFolderPath}：{ex.Message}");
    uploadsFolderPath = null;
}

app.UseStaticFiles(); // 默認提供 wwwroot 資料夾的靜態檔案

// 若 uploadsFolderPath 成功建立，則設定靜態檔案服務
if (!string.IsNullOrEmpty(uploadsFolderPath) && Directory.Exists(uploadsFolderPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(uploadsFolderPath),
        RequestPath = "/images"  // 設定路徑，讓使用者透過 "/images/{filename}" 來訪問
    });
}



// 新增：映射 K:\AnswerImage 到 /images/AnswerImage
string answerImageFolder = @"K:\AnswerImage";
try
{
    if (!Directory.Exists(answerImageFolder))
    {
        Directory.CreateDirectory(answerImageFolder);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"無法建立目錄 {answerImageFolder}：{ex.Message}");
    answerImageFolder = null;
}

if (!string.IsNullOrEmpty(answerImageFolder) && Directory.Exists(answerImageFolder))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(answerImageFolder),
        RequestPath = "/images/AnswerImage",
        ServeUnknownFileTypes = true, 
        DefaultContentType = "application/octet-stream"
    });
}


// 映射 K:\TempPdfImages 到 /TempPdfImages（供轉檔後的圖片存取）
string tempPdfImagesFolder = @"K:\TempPdfImages";
try
{
    if (!Directory.Exists(tempPdfImagesFolder))
    {
        Directory.CreateDirectory(tempPdfImagesFolder);
    }
}
catch (Exception ex)
{
    Console.WriteLine($"無法建立目錄 {tempPdfImagesFolder}：{ex.Message}");
    tempPdfImagesFolder = null;
}
if (!string.IsNullOrEmpty(tempPdfImagesFolder) && Directory.Exists(tempPdfImagesFolder))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(tempPdfImagesFolder),
        RequestPath = "/TempPdfImages"
    });
}

string pdfImagesFolder = @"K:\uploads\pdfimages";
try
{
    if (!Directory.Exists(pdfImagesFolder))
        Directory.CreateDirectory(pdfImagesFolder);
}
catch (Exception ex)
{
    Console.WriteLine($"建立 {pdfImagesFolder} 失敗：{ex.Message}");
    pdfImagesFolder = null;
}

if (!string.IsNullOrEmpty(pdfImagesFolder) && Directory.Exists(pdfImagesFolder))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new PhysicalFileProvider(pdfImagesFolder),
        RequestPath = "/uploads/pdfimages"
    });
}



// �ϥ� CORS
app.UseCors("AllowAll");

// ���� HTTP ?���?
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts(); // �O�� HSTS �� 30 �죬������a�h���{��
}

app.UseStaticFiles(new StaticFileOptions
{
    OnPrepareResponse = ctx =>
    {
        ctx.Context.Response.Headers.Append(
            "Content-Type", "application/javascript; charset=utf-8");
    }
});


app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();

// ��ʼ���Y�ώ�
SeedDatabase();

// ��������?�C���ڙ�
app.UseAuthentication(); // ���� Identity
app.UseAuthorization();

// �O��·��
app.MapControllerRoute(
    name: "default",
    pattern:
    "{area=Customer}/{controller=Home}/{action=Index}/{id?}");

app.UseSession();

/*
// �O���^��·��

// 1. Admin �^���·��
app.MapAreaControllerRoute(
    name: "AdminArea",
    areaName: "Admin",
    pattern: "Admin/{controller=Survey}/{action=Index}/{id?}");

// 2. Customer �^���·��
app.MapAreaControllerRoute(
    name: "CustomerArea",
    areaName: "Customer",
    pattern: "Customer/{controller=Home}/{action=Index}/{id?}");

// 3. �o�^����A�O·��
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
*/

app.MapRazorPages();

//���a��

app.UseStaticFiles();
app.UseRequestLocalization();
app.UseRouting();
app.MapDefaultControllerRoute();

// 中略: 中介軟體設定、路由等
app.MapControllers();

app.Run();

// �Y�ώ��ʼ������
void SeedDatabase()
{
    using (var scope = app.Services.CreateScope())
    {
        var dbInitializer = scope.ServiceProvider.GetRequiredService<IDbInitializer>();
        dbInitializer.Initialize();
    }
}
