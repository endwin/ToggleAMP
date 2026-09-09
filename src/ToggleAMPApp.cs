using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;

namespace ToggleAMPDesktop
{
    public static class I18n
    {
        public static string CurrentLang = "ko"; // Default language: Korean

        private static readonly Dictionary<string, Dictionary<string, string>> Strings = new Dictionary<string, Dictionary<string, string>>
        {
            { "ko", new Dictionary<string, string> {
                { "app_title", "ToggleAMP v1.3.0 — 멀티 스택 로컬 개발 환경" },
                { "tray_header", "⚡ ToggleAMP v1.3.0" },
                { "open_dashboard", "🌐 웹 대시보드 열기 (http://localhost:{port})" },
                { "open_window", "🖥️ 통합 제어 센터 창 열기" },
                { "quick_folders", "📂 빠른 폴더 열기" },
                { "root_dir", "📁 프로그램 루트 폴더 (c:\\ToggleAMP)" },
                { "www_dir", "🌐 프로젝트 폴더 (www)" },
                { "logs_dir", "📜 로그 폴더 (logs)" },
                { "config_dir", "⚙️ 환경설정 폴더 (config)" },
                { "start_all", "▶️ 전체 서비스 시작 (Start All)" },
                { "stop_all", "⏹️ 전체 서비스 정지 (Stop All)" },
                { "restart_web", "🔄 웹서버 재시작 (Reload)" },
                { "web_server", "🌐 웹서버 (Nginx / Apache)" },
                { "php_version", "🐘 PHP 버전" },
                { "db_engine", "🗄️ 데이터베이스 엔진" },
                { "redis", "⚡ Redis 캐시 서버" },
                { "web_tools", "🛠️ 웹 개발 도구" },
                { "pma_latest", "🗃️ phpMyAdmin (최신 v5.2 / PHP 7~8)" },
                { "pma_31", "🗃️ phpMyAdmin 3.1 (레거시 / PHP 5.2 전용)" },
                { "mailpit", "📬 Mailpit Webmail (포트 8025)" },
                { "terminal", "💻 개발자 콘솔 터미널 (Terminal)" },
                { "language", "🌐 언어 (Language / 言語)" },
                { "exit", "❌ ToggleAMP 완전 종료 (Exit)" },
                { "btn_start_all", "▶ 전체 시작" },
                { "btn_stop_all", "⏹ 전체 정지" },
                { "btn_dash", "🌐 대시보드" },
                { "btn_www", "📂 www" },
                { "btn_terminal", "💻 터미널" },
                { "btn_exit", "❌ 종료" },
                { "live_logs", "📜 실시간 활동 및 로그 스트림" },
                { "btn_clear_logs", "비우기" },
                { "running", "가동 중" },
                { "stopped", "정지됨" },
                { "start", "시작" },
                { "stop", "종료" },
                { "srv_web", "웹 서버 (Web Server)" },
                { "srv_php", "PHP FastCGI 엔진" },
                { "srv_db", "데이터베이스 엔진" },
                { "srv_redis", "Redis 캐시 서버" },
                { "srv_mailpit", "Mailpit SMTP & Webmail" },
                { "th_service", "서비스" },
                { "th_engine", "선택된 엔진 / 버전" },
                { "th_port", "포트" },
                { "th_status", "가동 상태" },
                { "th_action", "제어" }
            }},
            { "en", new Dictionary<string, string> {
                { "app_title", "ToggleAMP v1.3.0 — Modern Local Development Environment" },
                { "tray_header", "⚡ ToggleAMP v1.3.0" },
                { "open_dashboard", "🌐 Open Dashboard (http://localhost:{port})" },
                { "open_window", "🖥️ Open Control Center Window" },
                { "quick_folders", "📂 Quick Folders" },
                { "root_dir", "📁 Root Directory (c:\\ToggleAMP)" },
                { "www_dir", "🌐 Projects Directory (www)" },
                { "logs_dir", "📜 Logs Directory (logs)" },
                { "config_dir", "⚙️ Config Directory (config)" },
                { "start_all", "▶️ Start All Services" },
                { "stop_all", "⏹️ Stop All Services" },
                { "restart_web", "🔄 Restart Web Server" },
                { "web_server", "🌐 Web Server (Nginx / Apache)" },
                { "php_version", "🐘 PHP Version" },
                { "db_engine", "🗄️ Database Engine" },
                { "redis", "⚡ Redis Server" },
                { "web_tools", "🛠️ Web Tools" },
                { "pma_latest", "🗃️ phpMyAdmin Latest (PHP 7.x~8.x)" },
                { "pma_31", "🗃️ phpMyAdmin 3.1 (PHP 5.2 Legacy)" },
                { "mailpit", "📬 Mailpit Webmail (Port 8025)" },
                { "terminal", "💻 Developer Console (Terminal)" },
                { "language", "🌐 Language / 언어 / 言語" },
                { "exit", "❌ Exit ToggleAMP (Complete Shutdown)" },
                { "btn_start_all", "▶ Start All" },
                { "btn_stop_all", "⏹ Stop All" },
                { "btn_dash", "🌐 Dashboard" },
                { "btn_www", "📂 www" },
                { "btn_terminal", "💻 Terminal" },
                { "btn_exit", "❌ Shutdown" },
                { "live_logs", "📜 Live Activity Log Stream" },
                { "btn_clear_logs", "Clear" },
                { "running", "Running" },
                { "stopped", "Stopped" },
                { "start", "Start" },
                { "stop", "Stop" },
                { "srv_web", "Web Server (Nginx/Apache)" },
                { "srv_php", "PHP FastCGI Engine" },
                { "srv_db", "Database Engine" },
                { "srv_redis", "Redis Cache Server" },
                { "srv_mailpit", "Mailpit SMTP & Webmail" },
                { "th_service", "Service" },
                { "th_engine", "Selected Engine / Version" },
                { "th_port", "Port" },
                { "th_status", "Status" },
                { "th_action", "Action" }
            }},
            { "ja", new Dictionary<string, string> {
                { "app_title", "ToggleAMP v1.3.0 — マルチスタック ローカル開発環境" },
                { "tray_header", "⚡ ToggleAMP v1.3.0" },
                { "open_dashboard", "🌐 ダッシュボードを開く (http://localhost:{port})" },
                { "open_window", "🖥️ コントロールセンターを開く" },
                { "quick_folders", "📂 クイックフォルダ" },
                { "root_dir", "📁 ルートフォルダ (c:\\ToggleAMP)" },
                { "www_dir", "🌐 プロジェクトフォルダ (www)" },
                { "logs_dir", "📜 ログフォルダ (logs)" },
                { "config_dir", "⚙️ 設定フォルダ (config)" },
                { "start_all", "▶️ すべてのサービスを開始 (Start All)" },
                { "stop_all", "⏹️ すべてのサービスを停止 (Stop All)" },
                { "restart_web", "🔄 Webサーバー再起動" },
                { "web_server", "🌐 Webサーバー (Nginx / Apache)" },
                { "php_version", "🐘 PHPバージョン" },
                { "db_engine", "🗄️ データベース" },
                { "redis", "⚡ Redis キャッシュサーバー" },
                { "web_tools", "🛠️ 開発ツール" },
                { "pma_latest", "🗃️ phpMyAdmin 最新 (PHP 7~8)" },
                { "pma_31", "🗃️ phpMyAdmin 3.1 (PHP 5.2 専用)" },
                { "mailpit", "📬 Mailpit Webmail (ポート 8025)" },
                { "terminal", "💻 開発者コンソール (Terminal)" },
                { "language", "🌐 言語 (Language / 言語 / 한국어)" },
                { "exit", "❌ ToggleAMP 完全終了 (Exit)" },
                { "btn_start_all", "▶ すべて開始" },
                { "btn_stop_all", "⏹ すべて停止" },
                { "btn_dash", "🌐 ダッシュボード" },
                { "btn_www", "📂 www" },
                { "btn_terminal", "💻 ターミナル" },
                { "btn_exit", "❌ 終了" },
                { "live_logs", "📜 リアルタイム活動ログストリーム" },
                { "btn_clear_logs", "クリア" },
                { "running", "稼働中" },
                { "stopped", "停止中" },
                { "start", "開始" },
                { "stop", "終了" },
                { "srv_web", "Webサーバー (Nginx/Apache)" },
                { "srv_php", "PHP FastCGI エンジン" },
                { "srv_db", "データベースエンジン" },
                { "srv_redis", "Redis キャッシュサーバー" },
                { "srv_mailpit", "Mailpit SMTP & Webmail" },
                { "th_service", "サービス名" },
                { "th_engine", "選択されたエンジン / バージョン" },
                { "th_port", "ポート" },
                { "th_status", "稼働状態" },
                { "th_action", "操作" }
            }}
        };

        public static string T(string key)
        {
            if (Strings.ContainsKey(CurrentLang) && Strings[CurrentLang].ContainsKey(key))
                return Strings[CurrentLang][key];
            if (Strings["en"].ContainsKey(key))
                return Strings["en"][key];
            return key;
        }

        public static string T(string key, params object[] args)
        {
            string raw = T(key);
            for (int i = 0; i < args.Length; i += 2)
            {
                if (i + 1 < args.Length)
                {
                    raw = raw.Replace("{" + args[i].ToString() + "}", args[i + 1].ToString());
                }
            }
            return raw;
        }
    }

    public static class Program
    {
        public static Mutex appMutex = null;

        [STAThread]
        public static void Main(string[] args)
        {
            RunApp();
        }

        public static void RunApp()
        {
            const string appName = "Local\\ToggleAMP_SingleInstance_Mutex_v130";
            bool createdNew = true;
            try
            {
                appMutex = new Mutex(true, appName, out createdNew);
            }
            catch
            {
                createdNew = true;
            }

            if (!createdNew)
            {
                // Single instance already running
                return;
            }

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            ApplicationContext appContext = new ToggleAMPApplicationContext();
            Application.Run(appContext);
        }
    }

    public class ToggleAMPApplicationContext : ApplicationContext
    {
        private NotifyIcon trayIcon;
        private ContextMenuStrip trayMenu;
        private MainForm mainForm;
        private Process daemonProcess = null;
        private System.Windows.Forms.Timer statusTimer;
        private System.Windows.Forms.Timer logTimer;
        private string baseDir;
        private string nodePath;
        private int appPort = 4000;
        private bool isExiting = false;
        private long lastLogPos = 0;

        // Active State
        private string activeWebServer = "nginx";
        private string activePhp = "8.4";
        private string activeDbEngine = "mariadb";
        private string activeDbVer = "11.4";
        private List<string> installedPhp = new List<string>();
        private List<string> installedDb = new List<string>();
        private Dictionary<string, ServiceStateInfo> lastServices = new Dictionary<string, ServiceStateInfo>();

        // Tray Submenus cached
        private ToolStripMenuItem webMenu;
        private ToolStripMenuItem phpMenu;
        private ToolStripMenuItem dbMenu;
        private ToolStripMenuItem langMenu;
        private ToolStripMenuItem pmaLatestItem;
        private ToolStripMenuItem pma31Item;

        public ToggleAMPApplicationContext()
        {
            string dir = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists(Path.Combine(dir, "ToggleAMP.js")) || File.Exists(Path.Combine(dir, "end-server.js")) || File.Exists(Path.Combine(dir, "nobreak.js")))
            {
                baseDir = dir.TrimEnd('\\', '/');
            }
            else if (Directory.Exists("C:\\ToggleAMP") && (File.Exists("C:\\ToggleAMP\\ToggleAMP.js") || File.Exists("C:\\ToggleAMP\\end-server.js")))
            {
                baseDir = "C:\\ToggleAMP";
            }
            else if (Directory.Exists("C:\\end-server") && File.Exists("C:\\end-server\\end-server.js"))
            {
                baseDir = "C:\\end-server";
            }
            else
            {
                baseDir = Directory.GetCurrentDirectory().TrimEnd('\\', '/');
            }

            LocateNode();
            LoadSavedLanguage();
            DetectInstalledPackages();

            // Initialize UI
            InitializeTray();
            mainForm = new MainForm(this);

            // Start backend daemon
            StartDaemon();

            // Status timer (1200ms)
            statusTimer = new System.Windows.Forms.Timer();
            statusTimer.Interval = 1200;
            statusTimer.Tick += (s, e) => PollStatus();
            statusTimer.Start();

            // Live Log timer (1000ms)
            logTimer = new System.Windows.Forms.Timer();
            logTimer.Interval = 1000;
            logTimer.Tick += (s, e) => PollLogs();
            logTimer.Start();

            PollStatus();
            PollLogs();

            // Show window
            mainForm.Show();
            mainForm.BringToFront();
        }

        private void DetectInstalledPackages()
        {
            installedPhp.Clear();
            string phpDir = Path.Combine(baseDir, "bin", "php");
            if (Directory.Exists(phpDir))
            {
                foreach (string d in Directory.GetDirectories(phpDir))
                {
                    string name = Path.GetFileName(d);
                    if (name.StartsWith("php-"))
                    {
                        string ver = name.Substring(4);
                        if (File.Exists(Path.Combine(d, "php-cgi.exe")) || File.Exists(Path.Combine(d, "php.exe")))
                        {
                            installedPhp.Add(ver);
                        }
                    }
                }
            }
            if (installedPhp.Count == 0)
            {
                installedPhp.AddRange(new string[] { "8.4", "8.3", "8.2", "8.1", "7.4", "5.2" });
            }
            installedPhp.Sort((a, b) => string.Compare(b, a));

            installedDb.Clear();
            string dbDir = Path.Combine(baseDir, "bin", "db");
            if (Directory.Exists(dbDir))
            {
                foreach (string d in Directory.GetDirectories(dbDir))
                {
                    string name = Path.GetFileName(d);
                    if (File.Exists(Path.Combine(d, "bin", "mysqld.exe")) ||
                        File.Exists(Path.Combine(d, "bin", "mariadbd.exe")))
                    {
                        installedDb.Add(name);
                    }
                }
            }
            if (installedDb.Count == 0)
            {
                installedDb.AddRange(new string[] { "mariadb-11.4", "mariadb-10.11", "mysql-8.4", "mysql-8.0", "mysql-5.1" });
            }
        }

        private void LoadSavedLanguage()
        {
            try
            {
                string cfgFile = Path.Combine(baseDir, "config", "ToggleAMP.json");
                if (!File.Exists(cfgFile)) cfgFile = Path.Combine(baseDir, "config", "end-server.json");
                if (!File.Exists(cfgFile)) cfgFile = Path.Combine(baseDir, "config", "nobreak.json");
                if (File.Exists(cfgFile))
                {
                    string json = File.ReadAllText(cfgFile, Encoding.UTF8);
                    Match mLang = Regex.Match(json, @"""language""\s*:\s*""([^""]+)""");
                    if (mLang.Success)
                    {
                        string l = mLang.Groups[1].Value.ToLower();
                        if (l == "ko" || l == "en" || l == "ja")
                        {
                            I18n.CurrentLang = l;
                        }
                    }
                }
            }
            catch { }
        }

        private void LocateNode()
        {
            string[] candidates = new string[] {
                Path.Combine(baseDir, "bin", "node", "node.exe"),
                Path.Combine(baseDir, "bin", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe")
            };

            foreach (string c in candidates)
            {
                if (File.Exists(c))
                {
                    nodePath = c;
                    return;
                }
            }
            nodePath = "node.exe";
        }

        private void StartDaemon()
        {
            string jsFile = Path.Combine(baseDir, "ToggleAMP.js");
            if (!File.Exists(jsFile)) jsFile = Path.Combine(baseDir, "end-server.js");
            if (!File.Exists(jsFile)) jsFile = Path.Combine(baseDir, "nobreak.js");
            if (!File.Exists(jsFile)) return;

            FreePort(appPort);

            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = nodePath,
                    Arguments = "\"" + jsFile + "\" gui",
                    WorkingDirectory = baseDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                daemonProcess = Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Failed to launch ToggleAMP daemon: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public void SetLanguage(string lang)
        {
            if (I18n.CurrentLang == lang) return;
            I18n.CurrentLang = lang;
            RebuildTrayMenu();
            if (mainForm != null && !mainForm.IsDisposed)
            {
                mainForm.ApplyLanguage();
                mainForm.UpdateUi(activeWebServer, activePhp, activeDbEngine, activeDbVer, lastServices);
            }
        }

        private void InitializeTray()
        {
            trayMenu = new ContextMenuStrip();
            trayMenu.Font = new Font("Segoe UI", 9F, FontStyle.Regular);
            trayMenu.RenderMode = ToolStripRenderMode.System;
            trayMenu.ShowImageMargin = false;

            trayIcon = new NotifyIcon();
            string iconFile = Path.Combine(baseDir, "ToggleAMP.ico");
            if (!File.Exists(iconFile)) iconFile = Path.Combine(baseDir, "end-server.ico");
            if (!File.Exists(iconFile)) iconFile = Path.Combine(baseDir, "nobreak.ico");
            if (!File.Exists(iconFile)) iconFile = Path.Combine(baseDir, "web", "ToggleAMP.ico");

            if (File.Exists(iconFile))
            {
                try { trayIcon.Icon = new Icon(iconFile); } catch { trayIcon.Icon = SystemIcons.Application; }
            }
            else
            {
                trayIcon.Icon = SystemIcons.Application;
            }

            trayIcon.ContextMenuStrip = trayMenu;
            trayIcon.Text = "ToggleAMP v1.3.0 — Multi-Stack Local Dev";
            trayIcon.Visible = true;
            trayIcon.DoubleClick += (s, e) => ShowMainForm();

            RebuildTrayMenu();
        }

        public void RebuildTrayMenu()
        {
            trayMenu.Items.Clear();

            // Header
            ToolStripMenuItem header = new ToolStripMenuItem(I18n.T("tray_header"));
            header.Font = new Font("Segoe UI", 9.5F, FontStyle.Bold);
            header.Enabled = false;
            trayMenu.Items.Add(header);
            trayMenu.Items.Add(new ToolStripSeparator());

            // Open Dashboard & Window
            ToolStripMenuItem openDash = new ToolStripMenuItem(I18n.T("open_dashboard", "port", appPort), null, (s, e) => OpenUrl("http://localhost:" + appPort));
            openDash.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            trayMenu.Items.Add(openDash);

            ToolStripMenuItem showWin = new ToolStripMenuItem(I18n.T("open_window"), null, (s, e) => ShowMainForm());
            trayMenu.Items.Add(showWin);

            ToolStripMenuItem liveLogsItem = new ToolStripMenuItem(I18n.T("live_logs"), null, (s, e) => ShowMainForm());
            trayMenu.Items.Add(liveLogsItem);

            // Quick Folders
            ToolStripMenuItem quickFolders = new ToolStripMenuItem(I18n.T("quick_folders"));
            quickFolders.DropDownItems.Add(I18n.T("root_dir"), null, (s, e) => Process.Start("explorer.exe", baseDir));
            quickFolders.DropDownItems.Add(I18n.T("www_dir"), null, (s, e) => Process.Start("explorer.exe", Path.Combine(baseDir, "www")));
            quickFolders.DropDownItems.Add(I18n.T("logs_dir"), null, (s, e) => Process.Start("explorer.exe", Path.Combine(baseDir, "logs")));
            quickFolders.DropDownItems.Add(I18n.T("config_dir"), null, (s, e) => Process.Start("explorer.exe", Path.Combine(baseDir, "config")));
            trayMenu.Items.Add(quickFolders);

            trayMenu.Items.Add(new ToolStripSeparator());

            // Actions
            ToolStripMenuItem startAll = new ToolStripMenuItem(I18n.T("start_all"), null, (s, e) => PostApi("/api/start-all", "{}"));
            startAll.ForeColor = Color.DarkGreen;
            startAll.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            trayMenu.Items.Add(startAll);

            ToolStripMenuItem stopAll = new ToolStripMenuItem(I18n.T("stop_all"), null, (s, e) => PostApi("/api/stop-all", "{}"));
            stopAll.ForeColor = Color.DarkRed;
            trayMenu.Items.Add(stopAll);

            ToolStripMenuItem restartWeb = new ToolStripMenuItem(I18n.T("restart_web"), null, (s, e) => PostApi("/api/webserver/reload", "{}"));
            trayMenu.Items.Add(restartWeb);

            trayMenu.Items.Add(new ToolStripSeparator());

            // Web Server Switcher (Only Installed)
            webMenu = new ToolStripMenuItem(I18n.T("web_server"));
            bool hasNginx = File.Exists(Path.Combine(baseDir, "bin", "nginx", "nginx.exe"));
            bool hasApache = File.Exists(Path.Combine(baseDir, "bin", "apache", "bin", "httpd.exe"));

            if (hasNginx)
            {
                ToolStripMenuItem nginxItem = new ToolStripMenuItem("Nginx (Port 80)", null, (s, e) => SwitchWebServer("nginx"));
                nginxItem.Checked = (activeWebServer == "nginx");
                webMenu.DropDownItems.Add(nginxItem);
            }
            if (hasApache)
            {
                ToolStripMenuItem apacheItem = new ToolStripMenuItem("Apache HTTPD (Port 80)", null, (s, e) => SwitchWebServer("apache"));
                apacheItem.Checked = (activeWebServer == "apache");
                webMenu.DropDownItems.Add(apacheItem);
            }
            trayMenu.Items.Add(webMenu);

            // PHP Switcher (Only Installed Versions)
            phpMenu = new ToolStripMenuItem(I18n.T("php_version"));
            foreach (string p in installedPhp)
            {
                string curP = p;
                ToolStripMenuItem pItem = new ToolStripMenuItem("PHP " + curP, null, (s, e) => SwitchPhp(curP));
                pItem.Checked = (activePhp == curP);
                phpMenu.DropDownItems.Add(pItem);
            }
            trayMenu.Items.Add(phpMenu);

            // DB Switcher (Only Installed Engines)
            dbMenu = new ToolStripMenuItem(I18n.T("db_engine"));
            foreach (string dbTag in installedDb)
            {
                string curTag = dbTag;
                string[] parts = curTag.Split('-');
                string eng = parts[0];
                string ver = parts.Length > 1 ? parts[1] : "";
                string display = eng.ToUpper() + (string.IsNullOrEmpty(ver) ? "" : " " + ver);

                ToolStripMenuItem dItem = new ToolStripMenuItem(display, null, (s, e) => SwitchDatabase(eng, ver));
                dItem.Checked = (activeDbEngine == eng && (string.IsNullOrEmpty(ver) || activeDbVer.StartsWith(ver)));
                dbMenu.DropDownItems.Add(dItem);
            }
            trayMenu.Items.Add(dbMenu);

            trayMenu.Items.Add(new ToolStripSeparator());

            // Web Tools (Both phpMyAdmin with PHP-version dynamic activation)
            ToolStripMenuItem webTools = new ToolStripMenuItem(I18n.T("web_tools"));

            bool hasPmaLatest = Directory.Exists(Path.Combine(baseDir, "bin", "phpmyadmin", "phpmyadmin-latest")) ||
                                File.Exists(Path.Combine(baseDir, "bin", "phpmyadmin", "phpmyadmin-latest", "index.php"));
            bool hasPma31 = Directory.Exists(Path.Combine(baseDir, "bin", "phpmyadmin", "phpmyadmin-3.1")) ||
                            File.Exists(Path.Combine(baseDir, "bin", "phpmyadmin", "phpmyadmin-3.1", "index.php"));

            if (hasPmaLatest)
            {
                pmaLatestItem = new ToolStripMenuItem(I18n.T("pma_latest"), null, (s, e) => OpenUrl("http://localhost/myadmin/"));
                pmaLatestItem.Enabled = (activePhp != "5.2");
                webTools.DropDownItems.Add(pmaLatestItem);
            }

            if (hasPma31)
            {
                pma31Item = new ToolStripMenuItem(I18n.T("pma_31"), null, (s, e) => OpenUrl("http://localhost/phpmyadmin/"));
                pma31Item.Enabled = (activePhp == "5.2");
                webTools.DropDownItems.Add(pma31Item);
            }

            webTools.DropDownItems.Add(I18n.T("mailpit"), null, (s, e) => OpenUrl("http://localhost:8025"));
            trayMenu.Items.Add(webTools);

            // Developer Terminal
            ToolStripMenuItem termItem = new ToolStripMenuItem(I18n.T("terminal"), null, (s, e) => LaunchTerminal());
            trayMenu.Items.Add(termItem);

            trayMenu.Items.Add(new ToolStripSeparator());

            // Language Switcher Submenu
            langMenu = new ToolStripMenuItem(I18n.T("language"));
            ToolStripMenuItem langKo = new ToolStripMenuItem("🇰🇷 한국어 (Korean)", null, (s, e) => SetLanguage("ko"));
            langKo.Checked = (I18n.CurrentLang == "ko");
            ToolStripMenuItem langEn = new ToolStripMenuItem("🇺🇸 English (영어)", null, (s, e) => SetLanguage("en"));
            langEn.Checked = (I18n.CurrentLang == "en");
            ToolStripMenuItem langJa = new ToolStripMenuItem("🇯🇵 日本語 (Japanese)", null, (s, e) => SetLanguage("ja"));
            langJa.Checked = (I18n.CurrentLang == "ja");
            langMenu.DropDownItems.Add(langKo);
            langMenu.DropDownItems.Add(langEn);
            langMenu.DropDownItems.Add(langJa);
            trayMenu.Items.Add(langMenu);

            trayMenu.Items.Add(new ToolStripSeparator());

            // Exit
            ToolStripMenuItem exitItem = new ToolStripMenuItem(I18n.T("exit"), null, (s, e) => ExitApplication());
            exitItem.Font = new Font("Segoe UI", 9F, FontStyle.Bold);
            exitItem.ForeColor = Color.Red;
            trayMenu.Items.Add(exitItem);
        }

        private void UpdateTrayChecksOnly()
        {
            if (webMenu != null)
            {
                foreach (ToolStripItem item in webMenu.DropDownItems)
                {
                    ToolStripMenuItem mi = item as ToolStripMenuItem;
                    if (mi != null)
                    {
                        if (mi.Text.StartsWith("Nginx")) mi.Checked = (activeWebServer == "nginx");
                        if (mi.Text.StartsWith("Apache")) mi.Checked = (activeWebServer == "apache");
                    }
                }
            }

            if (phpMenu != null)
            {
                foreach (ToolStripItem item in phpMenu.DropDownItems)
                {
                    ToolStripMenuItem mi = item as ToolStripMenuItem;
                    if (mi != null)
                    {
                        mi.Checked = mi.Text.EndsWith(activePhp);
                    }
                }
            }

            if (dbMenu != null)
            {
                foreach (ToolStripItem item in dbMenu.DropDownItems)
                {
                    ToolStripMenuItem mi = item as ToolStripMenuItem;
                    if (mi != null)
                    {
                        string txt = mi.Text.ToLower();
                        mi.Checked = (txt.Contains(activeDbEngine) && txt.Contains(activeDbVer.Substring(0, Math.Min(3, activeDbVer.Length))));
                    }
                }
            }

            // Dynamically activate/deactivate phpMyAdmin based on active PHP version
            if (pmaLatestItem != null)
            {
                pmaLatestItem.Enabled = (activePhp != "5.2");
            }
            if (pma31Item != null)
            {
                pma31Item.Enabled = (activePhp == "5.2");
            }
        }

        public string GetBaseDir() { return baseDir; }
        public void SetLastLogPos(long pos) { lastLogPos = pos; }
        public long GetLastLogPos() { return lastLogPos; }

        public void ShowMainForm()
        {
            if (mainForm == null || mainForm.IsDisposed)
            {
                mainForm = new MainForm(this);
            }
            mainForm.WindowState = FormWindowState.Normal;
            mainForm.Show();
            mainForm.BringToFront();
            mainForm.Activate();
            mainForm.LoadInitialLogs();
        }

        public void PollStatus()
        {
            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    string url = "http://127.0.0.1:" + appPort + "/api/status?lang=" + I18n.CurrentLang;
                    HttpWebRequest req = (HttpWebRequest)WebRequest.Create(url);
                    req.Timeout = 1500;
                    using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                    using (StreamReader reader = new StreamReader(resp.GetResponseStream()))
                    {
                        string json = reader.ReadToEnd();
                        ParseAndUpdateStatus(json);
                    }
                }
                catch { }
            });
        }

        public void PollLogs()
        {
            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    string logFile = Path.Combine(baseDir, "logs", "activity.log");
                    if (File.Exists(logFile))
                    {
                        using (FileStream fs = new FileStream(logFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                        {
                            if (lastLogPos == 0)
                            {
                                lastLogPos = Math.Max(0, fs.Length - 30000);
                            }
                            if (fs.Length > lastLogPos)
                            {
                                fs.Seek(lastLogPos, SeekOrigin.Begin);
                                using (StreamReader reader = new StreamReader(fs, Encoding.UTF8))
                                {
                                    string newLogs = reader.ReadToEnd();
                                    lastLogPos = fs.Position;
                                    if (!string.IsNullOrEmpty(newLogs) && mainForm != null && !mainForm.IsDisposed && mainForm.IsHandleCreated)
                                    {
                                        mainForm.AppendLog(newLogs);
                                    }
                                }
                            }
                        }
                    }
                }
                catch { }
            });
        }

        private void ParseAndUpdateStatus(string json)
        {
            if (isExiting) return;

            Match mWeb = Regex.Match(json, @"""webserver""\s*:\s*\{\s*""active""\s*:\s*""([^""]+)""");
            if (mWeb.Success) activeWebServer = mWeb.Groups[1].Value.ToLower();

            Match mPhp = Regex.Match(json, @"""php""\s*:\s*\{[^}]*""active_version""\s*:\s*""([^""]+)""");
            if (mPhp.Success) activePhp = mPhp.Groups[1].Value;

            Match mDbEng = Regex.Match(json, @"""database""\s*:\s*\{[^}]*""engine""\s*:\s*""([^""]+)""");
            Match mDbVer = Regex.Match(json, @"""database""\s*:\s*\{[^}]*""active_version""\s*:\s*""([^""]+)""");
            if (mDbEng.Success) activeDbEngine = mDbEng.Groups[1].Value.ToLower();
            if (mDbVer.Success) activeDbVer = mDbVer.Groups[1].Value;

            bool installedChanged = false;
            Match mInstPhp = Regex.Match(json, @"""installedPhp""\s*:\s*\[(.*?)\]");
            if (mInstPhp.Success)
            {
                List<string> newPhp = new List<string>();
                foreach (Match m in Regex.Matches(mInstPhp.Groups[1].Value, @"""([^""]+)"""))
                {
                    newPhp.Add(m.Groups[1].Value);
                }
                if (string.Join(",", installedPhp.ToArray()) != string.Join(",", newPhp.ToArray()))
                {
                    installedPhp = newPhp;
                    installedChanged = true;
                }
            }

            Match mInstDb = Regex.Match(json, @"""installedDb""\s*:\s*\[(.*?)\]");
            if (mInstDb.Success)
            {
                List<string> newDb = new List<string>();
                foreach (Match m in Regex.Matches(mInstDb.Groups[1].Value, @"""([^""]+)"""))
                {
                    newDb.Add(m.Groups[1].Value);
                }
                if (string.Join(",", installedDb.ToArray()) != string.Join(",", newDb.ToArray()))
                {
                    installedDb = newDb;
                    installedChanged = true;
                }
            }

            if (installedChanged)
            {
                if (trayMenu != null && trayMenu.IsHandleCreated)
                {
                    trayMenu.BeginInvoke(new Action(() => RebuildTrayMenu()));
                }
            }

            lastServices.Clear();
            Match mServicesBlock = Regex.Match(json, @"""services""\s*:\s*\[(.*?)\]\s*,\s*""config""", RegexOptions.Singleline);
            string srvJson = mServicesBlock.Success ? mServicesBlock.Groups[1].Value : json;
            MatchCollection objMatches = Regex.Matches(srvJson, @"\{[^{}]+\}");
            foreach (Match om in objMatches)
            {
                string objStr = om.Value;
                Match mName = Regex.Match(objStr, @"""name""\s*:\s*""([^""]+)""");
                Match mState = Regex.Match(objStr, @"""state""\s*:\s*""([^""]+)""");
                Match mPort = Regex.Match(objStr, @"""port""\s*:\s*([0-9]+)");
                Match mEngine = Regex.Match(objStr, @"""engine""\s*:\s*""([^""]*)""");
                Match mVer = Regex.Match(objStr, @"""version""\s*:\s*""([^""]*)""");
                Match mUptime = Regex.Match(objStr, @"""uptime""\s*:\s*""([^""]*)""");

                if (mName.Success && mState.Success)
                {
                    string name = mName.Groups[1].Value;
                    string state = mState.Groups[1].Value;
                    int port = mPort.Success ? int.Parse(mPort.Groups[1].Value) : 0;
                    string engine = mEngine.Success ? mEngine.Groups[1].Value : "";
                    string version = mVer.Success ? mVer.Groups[1].Value : "";
                    string uptime = mUptime.Success ? mUptime.Groups[1].Value : "";

                    lastServices[name] = new ServiceStateInfo
                    {
                        Name = name,
                        State = state,
                        Port = port,
                        Engine = engine,
                        Version = version,
                        Uptime = uptime
                    };
                }
            }

            if (mainForm != null && !mainForm.IsDisposed && mainForm.IsHandleCreated)
            {
                mainForm.BeginInvoke(new Action(() =>
                {
                    mainForm.UpdateUi(activeWebServer, activePhp, activeDbEngine, activeDbVer, lastServices);
                    UpdateTrayChecksOnly();
                }));
            }
            else
            {
                if (trayMenu != null && trayMenu.IsHandleCreated)
                {
                    trayMenu.BeginInvoke(new Action(() => UpdateTrayChecksOnly()));
                }
            }
        }

        public void SwitchWebServer(string name)
        {
            PostApi("/api/webserver/switch", "{\"webserver\":\"" + name + "\"}");
            PollStatus();
        }

        public void SwitchPhp(string ver)
        {
            PostApi("/api/php/switch", "{\"version\":\"" + ver + "\"}");
            PollStatus();
        }

        public void SwitchDatabase(string eng, string ver)
        {
            PostApi("/api/database/switch", "{\"engine\":\"" + eng + "\",\"version\":\"" + ver + "\"}");
            PollStatus();
        }

        public void ToggleService(string name, bool start)
        {
            string endpoint = start ? "/api/service/start" : "/api/service/stop";
            PostApi(endpoint, "{\"name\":\"" + name + "\"}");
            PollStatus();
        }

        public void PostApi(string path, string jsonBody)
        {
            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    byte[] data = Encoding.UTF8.GetBytes(jsonBody);
                    HttpWebRequest req = (HttpWebRequest)WebRequest.Create("http://127.0.0.1:" + appPort + path);
                    req.Method = "POST";
                    req.ContentType = "application/json";
                    req.ContentLength = data.Length;
                    req.Timeout = 3000;
                    using (Stream stream = req.GetRequestStream())
                    {
                        stream.Write(data, 0, data.Length);
                    }
                    using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse()) { }
                }
                catch { }
            });
        }

        public void OpenUrl(string url)
        {
            try { Process.Start(url); } catch { }
        }

        public void LaunchTerminal()
        {
            try
            {
                string cmdFile = Path.Combine(baseDir, "ToggleAMP.cmd");
                if (File.Exists(cmdFile))
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = "/k \"\"" + cmdFile + "\" terminal\"",
                        WorkingDirectory = baseDir,
                        UseShellExecute = true
                    });
                    return;
                }

                string jsFile = Path.Combine(baseDir, "ToggleAMP.js");
                if (!File.Exists(jsFile)) jsFile = Path.Combine(baseDir, "end-server.js");
                Process.Start(new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/k \"\"" + nodePath + "\" \"" + jsFile + "\" terminal\"",
                    WorkingDirectory = baseDir,
                    UseShellExecute = true
                });
            }
            catch { }
        }

        private void FreePort(int port)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = "cmd.exe",
                    Arguments = "/c netstat -ano -p tcp | findstr :" + port,
                    UseShellExecute = false,
                    RedirectStandardOutput = true,
                    CreateNoWindow = true
                };
                Process p = Process.Start(psi);
                string outStr = p.StandardOutput.ReadToEnd();
                p.WaitForExit();

                string[] lines = outStr.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
                foreach (string line in lines)
                {
                    if (line.Contains("LISTENING") || line.Contains("ESTABLISHED"))
                    {
                        string[] parts = Regex.Split(line.Trim(), @"\s+");
                        string pid = parts[parts.Length - 1];
                        int pIdNum;
                        if (int.TryParse(pid, out pIdNum) && pIdNum != Process.GetCurrentProcess().Id)
                        {
                            try { Process.GetProcessById(pIdNum).Kill(); } catch { }
                        }
                    }
                }
            }
            catch { }
        }

        public void ExitApplication()
        {
            if (isExiting) return;
            isExiting = true;

            statusTimer.Stop();
            logTimer.Stop();

            try
            {
                PostApi("/api/shutdown", "{}");
                Thread.Sleep(300);
            }
            catch { }

            string[] killList = new string[] {
                "nginx", "httpd", "php-cgi", "mysqld", "mariadbd", "redis-server", "mailpit"
            };
            foreach (string k in killList)
            {
                try
                {
                    foreach (Process proc in Process.GetProcessesByName(k))
                    {
                        try { proc.Kill(); } catch { }
                    }
                }
                catch { }
            }

            if (trayIcon != null)
            {
                trayIcon.Visible = false;
                trayIcon.Dispose();
            }

            if (mainForm != null && !mainForm.IsDisposed)
            {
                mainForm.Dispose();
            }

            if (Program.appMutex != null)
            {
                try { Program.appMutex.ReleaseMutex(); } catch { }
                try { Program.appMutex.Dispose(); } catch { }
                Program.appMutex = null;
            }

            Application.Exit();
        }
    }

    public class ServiceStateInfo
    {
        public string Name { get; set; }
        public string State { get; set; }
        public int Port { get; set; }
        public string Engine { get; set; }
        public string Version { get; set; }
        public string Uptime { get; set; }
    }

    public class MainForm : Form
    {
        private ToggleAMPApplicationContext context;
        private Label lblActiveWeb;
        private Label lblActivePhp;
        private Label lblActiveDb;
        private TableLayoutPanel servicesTable;
        private RichTextBox logBox;
        private Label logTitle;
        private Button btnStartAll;
        private Button btnStopAll;
        private Button btnDash;
        private Button btnWww;
        private Button btnTerm;
        private Button btnExit;
        private Button btnClearLogs;
        private ComboBox comboLang;
        private Dictionary<string, ServiceRowControls> rowMap = new Dictionary<string, ServiceRowControls>();

        // Header column labels
        private Label thService;
        private Label thEngine;
        private Label thPort;
        private Label thStatus;
        private Label thAction;

        public MainForm(ToggleAMPApplicationContext ctx)
        {
            context = ctx;
            this.DoubleBuffered = true;
            InitializeComponent();
            ApplyLanguage();
        }

        private void InitializeComponent()
        {
            this.Size = new Size(920, 680);
            this.MinimumSize = new Size(840, 600);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate 900
            this.ForeColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.25F, FontStyle.Regular);

            string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "nobreak.ico");
            if (!File.Exists(iconPath)) iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "web", "nobreak.ico");

            if (File.Exists(iconPath))
            {
                try { this.Icon = new Icon(iconPath); } catch { }
            }

            // 1. TOP HEADER PANEL (Location: 0, 0 / Height: 60)
            Panel headerPanel = new Panel
            {
                Location = new Point(0, 0),
                Size = new Size(this.ClientSize.Width, 60),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Color.FromArgb(30, 41, 59) // Slate 800
            };

            string pngPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ToggleAMP.png");
            if (!File.Exists(pngPath)) pngPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "end-server.png");
            if (!File.Exists(pngPath)) pngPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "nobreak.png");
            if (File.Exists(pngPath))
            {
                try
                {
                    PictureBox logoBox = new PictureBox
                    {
                        Image = Image.FromFile(pngPath),
                        SizeMode = PictureBoxSizeMode.Zoom,
                        Size = new Size(36, 36),
                        Location = new Point(14, 12)
                    };
                    headerPanel.Controls.Add(logoBox);
                }
                catch { }
            }

            Label titleLabel = new Label
            {
                Text = "ToggleAMP",
                Font = new Font("Segoe UI", 16F, FontStyle.Bold),
                ForeColor = Color.FromArgb(45, 212, 191), // Teal 400
                AutoSize = true,
                Location = new Point(56, 14)
            };
            headerPanel.Controls.Add(titleLabel);

            Label verLabel = new Label
            {
                Text = "v1.3.0",
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = Color.FromArgb(251, 191, 36),
                BackColor = Color.FromArgb(69, 26, 3),
                Padding = new Padding(6, 3, 6, 3),
                AutoSize = true,
                Location = new Point(168, 19)
            };
            headerPanel.Controls.Add(verLabel);

            comboLang = new ComboBox
            {
                DropDownStyle = ComboBoxStyle.DropDownList,
                BackColor = Color.FromArgb(15, 23, 42),
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                Width = 115,
                Location = new Point(232, 18)
            };
            comboLang.Items.Add("🇰🇷 한국어");
            comboLang.Items.Add("🇺🇸 English");
            comboLang.Items.Add("🇯🇵 日本語");
            comboLang.SelectedIndex = (I18n.CurrentLang == "ko") ? 0 : (I18n.CurrentLang == "ja" ? 2 : 1);
            comboLang.SelectedIndexChanged += (s, e) =>
            {
                string sel = (comboLang.SelectedIndex == 0) ? "ko" : (comboLang.SelectedIndex == 2 ? "ja" : "en");
                context.SetLanguage(sel);
            };
            headerPanel.Controls.Add(comboLang);

            FlowLayoutPanel badgePanel = new FlowLayoutPanel
            {
                FlowDirection = FlowDirection.RightToLeft,
                Dock = DockStyle.Right,
                Width = 480,
                Height = 50,
                Padding = new Padding(0, 10, 16, 0)
            };

            lblActiveDb = CreateBadge("DB: MARIADB 11.4", Color.FromArgb(56, 189, 248), Color.FromArgb(12, 74, 110));
            lblActivePhp = CreateBadge("PHP: 8.4", Color.FromArgb(167, 139, 250), Color.FromArgb(76, 29, 149));
            lblActiveWeb = CreateBadge("WEB: NGINX", Color.FromArgb(45, 212, 191), Color.FromArgb(19, 78, 74));

            badgePanel.Controls.Add(lblActiveDb);
            badgePanel.Controls.Add(lblActivePhp);
            badgePanel.Controls.Add(lblActiveWeb);
            headerPanel.Controls.Add(badgePanel);

            this.Controls.Add(headerPanel);

            // 2. ACTION TOOLBAR PANEL (Location: 0, 60 / Height: 46)
            Panel toolPanel = new Panel
            {
                Location = new Point(0, 60),
                Size = new Size(this.ClientSize.Width, 46),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Color.FromArgb(15, 23, 42) // Slate 900
            };

            btnStartAll = CreateButton(I18n.T("btn_start_all"), Color.FromArgb(13, 148, 136), Color.Black, (s, e) => context.PostApi("/api/start-all", "{}"));
            btnStartAll.Location = new Point(16, 7);
            toolPanel.Controls.Add(btnStartAll);

            btnStopAll = CreateButton(I18n.T("btn_stop_all"), Color.FromArgb(225, 29, 72), Color.White, (s, e) => context.PostApi("/api/stop-all", "{}"));
            btnStopAll.Location = new Point(125, 7);
            toolPanel.Controls.Add(btnStopAll);

            btnDash = CreateButton(I18n.T("btn_dash"), Color.FromArgb(79, 70, 229), Color.White, (s, e) => context.OpenUrl("http://localhost:4000"));
            btnDash.Location = new Point(230, 7);
            toolPanel.Controls.Add(btnDash);

            btnWww = CreateButton(I18n.T("btn_www"), Color.FromArgb(51, 65, 85), Color.White, (s, e) => Process.Start("explorer.exe", Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "www")));
            btnWww.Location = new Point(340, 7);
            toolPanel.Controls.Add(btnWww);

            btnTerm = CreateButton(I18n.T("btn_terminal"), Color.FromArgb(51, 65, 85), Color.White, (s, e) => context.LaunchTerminal());
            btnTerm.Location = new Point(420, 7);
            toolPanel.Controls.Add(btnTerm);

            btnExit = CreateButton(I18n.T("btn_exit"), Color.FromArgb(136, 19, 55), Color.FromArgb(254, 205, 211), (s, e) => context.ExitApplication());
            btnExit.Location = new Point(515, 7);
            toolPanel.Controls.Add(btnExit);

            this.Controls.Add(toolPanel);

            // 3. SERVICES TABLE CARD PANEL (Location: 16, 114 / Height: 215)
            Panel srvCardPanel = new Panel
            {
                Location = new Point(16, 114),
                Size = new Size(this.ClientSize.Width - 32, 215),
                Anchor = AnchorStyles.Top | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Color.FromArgb(24, 33, 47), // Slate 850
                Padding = new Padding(12, 6, 12, 6)
            };

            servicesTable = new TableLayoutPanel
            {
                Dock = DockStyle.Fill,
                ColumnCount = 5,
                RowCount = 6
            };
            servicesTable.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 26F)); // Service
            servicesTable.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 28F)); // Selected Engine/Version
            servicesTable.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 14F)); // Port
            servicesTable.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 20F)); // Running Status Check
            servicesTable.ColumnStyles.Add(new ColumnStyle(SizeType.Percent, 12F)); // Action Toggle

            // Row 0: Column Headers
            servicesTable.RowStyles.Add(new RowStyle(SizeType.Absolute, 28F));
            thService = CreateHeaderLabel(I18n.T("th_service"));
            thEngine = CreateHeaderLabel(I18n.T("th_engine"));
            thPort = CreateHeaderLabel(I18n.T("th_port"));
            thStatus = CreateHeaderLabel(I18n.T("th_status"));
            thAction = CreateHeaderLabel(I18n.T("th_action"));

            servicesTable.Controls.Add(thService, 0, 0);
            servicesTable.Controls.Add(thEngine, 1, 0);
            servicesTable.Controls.Add(thPort, 2, 0);
            servicesTable.Controls.Add(thStatus, 3, 0);
            servicesTable.Controls.Add(thAction, 4, 0);

            // Rows 1 to 5: 5 Services
            AddServiceRow("webserver", I18n.T("srv_web"), "NGINX (Port 80)", 1);
            AddServiceRow("php", I18n.T("srv_php"), "PHP 8.4 (FastCGI 9000)", 2);
            AddServiceRow("database", I18n.T("srv_db"), "MARIADB 11.4 (Port 3306)", 3);
            AddServiceRow("redis", I18n.T("srv_redis"), "Redis 5.0 (Port 6379)", 4);
            AddServiceRow("mailpit", I18n.T("srv_mailpit"), "Mailpit Webmail (Port 8025)", 5);

            srvCardPanel.Controls.Add(servicesTable);
            this.Controls.Add(srvCardPanel);

            // 4. EXPANDED LIVE ACTIVITY LOG STREAM PANEL (Location: 16, 338 / Height: Fill)
            Panel logCardPanel = new Panel
            {
                Location = new Point(16, 338),
                Size = new Size(this.ClientSize.Width - 32, this.ClientSize.Height - 350),
                Anchor = AnchorStyles.Top | AnchorStyles.Bottom | AnchorStyles.Left | AnchorStyles.Right,
                BackColor = Color.FromArgb(2, 6, 23), // Slate 950
                Padding = new Padding(12, 8, 12, 10)
            };

            Panel logHeaderPanel = new Panel
            {
                Dock = DockStyle.Top,
                Height = 28,
                BackColor = Color.Transparent
            };

            logTitle = new Label
            {
                Text = I18n.T("live_logs"),
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.FromArgb(148, 163, 184),
                Dock = DockStyle.Left,
                AutoSize = true
            };
            logHeaderPanel.Controls.Add(logTitle);

            btnClearLogs = new Button
            {
                Text = I18n.T("btn_clear_logs"),
                Font = new Font("Segoe UI", 8F, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                BackColor = Color.FromArgb(30, 41, 59),
                FlatStyle = FlatStyle.Flat,
                Dock = DockStyle.Right,
                Width = 65,
                Height = 24,
                Cursor = Cursors.Hand
            };
            btnClearLogs.FlatAppearance.BorderSize = 0;
            btnClearLogs.Click += (s, e) => logBox.Clear();
            logHeaderPanel.Controls.Add(btnClearLogs);

            logCardPanel.Controls.Add(logHeaderPanel);

            logBox = new RichTextBox
            {
                Dock = DockStyle.Fill,
                BackColor = Color.FromArgb(2, 6, 23),
                ForeColor = Color.FromArgb(226, 232, 240),
                Font = new Font("Consolas", 9.5F, FontStyle.Regular),
                BorderStyle = BorderStyle.None,
                ReadOnly = true
            };
            logCardPanel.Controls.Add(logBox);

            this.Controls.Add(logCardPanel);

            // Minimize to Tray on Close
            this.FormClosing += (s, e) =>
            {
                if (e.CloseReason == CloseReason.UserClosing)
                {
                    e.Cancel = true;
                    this.Hide();
                }
            };

            this.Shown += (s, e) => LoadInitialLogs();
        }

        private Label CreateHeaderLabel(string text)
        {
            return new Label
            {
                Text = text,
                Font = new Font("Segoe UI", 8.5F, FontStyle.Bold),
                ForeColor = Color.FromArgb(100, 116, 139),
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleLeft
            };
        }

        private Label CreateBadge(string text, Color fore, Color back)
        {
            Label l = new Label
            {
                Text = text,
                Font = new Font("Segoe UI", 8.5F, FontStyle.Bold),
                ForeColor = fore,
                BackColor = back,
                Padding = new Padding(8, 4, 8, 4),
                Margin = new Padding(4, 0, 4, 0),
                AutoSize = true
            };
            return l;
        }

        private Button CreateButton(string text, Color back, Color fore, EventHandler onClick)
        {
            Button b = new Button
            {
                Text = text,
                BackColor = back,
                ForeColor = fore,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 8.75F, FontStyle.Bold),
                Cursor = Cursors.Hand,
                AutoSize = true,
                Height = 32,
                Padding = new Padding(10, 0, 10, 0)
            };
            b.FlatAppearance.BorderSize = 0;
            b.Click += onClick;
            return b;
        }

        private void AddServiceRow(string key, string displayName, string defaultDetails, int rowIndex)
        {
            servicesTable.RowStyles.Add(new RowStyle(SizeType.Absolute, 34F));

            Label lblName = new Label
            {
                Text = displayName,
                Font = new Font("Segoe UI", 9.5F, FontStyle.Bold),
                ForeColor = Color.White,
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleLeft
            };

            Label lblDetails = new Label
            {
                Text = defaultDetails,
                Font = new Font("Segoe UI", 9F, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleLeft
            };

            Label lblPort = new Label
            {
                Text = "-",
                Font = new Font("Segoe UI", 9F, FontStyle.Regular),
                ForeColor = Color.FromArgb(203, 213, 225),
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleLeft
            };

            Label lblState = new Label
            {
                Text = "● " + I18n.T("stopped"),
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = Color.FromArgb(244, 63, 94),
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleLeft
            };

            Button btnToggle = new Button
            {
                Text = I18n.T("start"),
                BackColor = Color.FromArgb(13, 148, 136),
                ForeColor = Color.Black,
                FlatStyle = FlatStyle.Flat,
                Font = new Font("Segoe UI", 8.5F, FontStyle.Bold),
                Height = 25,
                Width = 64,
                Cursor = Cursors.Hand,
                Anchor = AnchorStyles.Left
            };
            btnToggle.FlatAppearance.BorderSize = 0;
            btnToggle.Click += (s, e) =>
            {
                bool isRunning = (btnToggle.Text == I18n.T("stop"));
                context.ToggleService(key, !isRunning);
            };

            servicesTable.Controls.Add(lblName, 0, rowIndex);
            servicesTable.Controls.Add(lblDetails, 1, rowIndex);
            servicesTable.Controls.Add(lblPort, 2, rowIndex);
            servicesTable.Controls.Add(lblState, 3, rowIndex);
            servicesTable.Controls.Add(btnToggle, 4, rowIndex);

            rowMap[key] = new ServiceRowControls
            {
                NameLabel = lblName,
                DetailsLabel = lblDetails,
                PortLabel = lblPort,
                StateLabel = lblState,
                ToggleButton = btnToggle
            };
        }

        public void ApplyLanguage()
        {
            this.Text = I18n.T("app_title");
            btnStartAll.Text = I18n.T("btn_start_all");
            btnStopAll.Text = I18n.T("btn_stop_all");
            btnDash.Text = I18n.T("btn_dash");
            btnWww.Text = I18n.T("btn_www");
            btnTerm.Text = I18n.T("btn_terminal");
            btnExit.Text = I18n.T("btn_exit");
            logTitle.Text = I18n.T("live_logs");
            btnClearLogs.Text = I18n.T("btn_clear_logs");

            thService.Text = I18n.T("th_service");
            thEngine.Text = I18n.T("th_engine");
            thPort.Text = I18n.T("th_port");
            thStatus.Text = I18n.T("th_status");
            thAction.Text = I18n.T("th_action");

            if (rowMap.ContainsKey("webserver")) rowMap["webserver"].NameLabel.Text = I18n.T("srv_web");
            if (rowMap.ContainsKey("php")) rowMap["php"].NameLabel.Text = I18n.T("srv_php");
            if (rowMap.ContainsKey("database")) rowMap["database"].NameLabel.Text = I18n.T("srv_db");
            if (rowMap.ContainsKey("redis")) rowMap["redis"].NameLabel.Text = I18n.T("srv_redis");
            if (rowMap.ContainsKey("mailpit")) rowMap["mailpit"].NameLabel.Text = I18n.T("srv_mailpit");

            comboLang.SelectedIndex = (I18n.CurrentLang == "ko") ? 0 : (I18n.CurrentLang == "ja" ? 2 : 1);
        }

        public void UpdateUi(string web, string php, string dbEng, string dbVer, Dictionary<string, ServiceStateInfo> services)
        {
            lblActiveWeb.Text = "WEB: " + web.ToUpper();
            lblActivePhp.Text = "PHP: " + php;
            lblActiveDb.Text = "DB: " + dbEng.ToUpper() + " " + dbVer;

            if (rowMap.ContainsKey("webserver"))
            {
                int p = (services.ContainsKey("webserver") && services["webserver"].Port > 0) ? services["webserver"].Port : 80;
                rowMap["webserver"].DetailsLabel.Text = web.ToUpper() + " (Port " + p + ")";
            }
            if (rowMap.ContainsKey("php"))
            {
                int p = (services.ContainsKey("php") && services["php"].Port > 0) ? services["php"].Port : 9000;
                rowMap["php"].DetailsLabel.Text = "PHP " + php + " (FastCGI " + p + ")";
            }
            if (rowMap.ContainsKey("database"))
            {
                int p = (services.ContainsKey("database") && services["database"].Port > 0) ? services["database"].Port : 3306;
                rowMap["database"].DetailsLabel.Text = dbEng.ToUpper() + " " + dbVer + " (Port " + p + ")";
            }
            if (rowMap.ContainsKey("redis"))
            {
                int p = (services.ContainsKey("redis") && services["redis"].Port > 0) ? services["redis"].Port : 6379;
                rowMap["redis"].DetailsLabel.Text = "Redis 5.0 (Port " + p + ")";
            }
            if (rowMap.ContainsKey("mailpit"))
            {
                int p = (services.ContainsKey("mailpit") && services["mailpit"].Port > 0) ? services["mailpit"].Port : 8025;
                rowMap["mailpit"].DetailsLabel.Text = "Mailpit Webmail (Port " + p + ")";
            }

            foreach (var kv in rowMap)
            {
                string srvKey = kv.Key;
                ServiceRowControls ctrl = kv.Value;

                if (services.ContainsKey(srvKey))
                {
                    ServiceStateInfo sInfo = services[srvKey];
                    bool running = (sInfo.State == "running");

                    ctrl.PortLabel.Text = (sInfo.Port > 0) ? "Port " + sInfo.Port : "-";
                    ctrl.PortLabel.ForeColor = running ? Color.FromArgb(45, 212, 191) : Color.FromArgb(203, 213, 225);

                    if (running)
                    {
                        ctrl.StateLabel.Text = "● " + I18n.T("running") + (string.IsNullOrEmpty(sInfo.Uptime) ? "" : " (" + sInfo.Uptime + ")");
                        ctrl.StateLabel.ForeColor = Color.FromArgb(34, 197, 94); // Green 500
                        ctrl.ToggleButton.Text = I18n.T("stop"); // "종료"
                        ctrl.ToggleButton.BackColor = Color.FromArgb(225, 29, 72); // Rose 600
                        ctrl.ToggleButton.ForeColor = Color.White;
                    }
                    else
                    {
                        ctrl.StateLabel.Text = "● " + I18n.T("stopped");
                        ctrl.StateLabel.ForeColor = Color.FromArgb(244, 63, 94); // Rose 500
                        ctrl.ToggleButton.Text = I18n.T("start"); // "시작"
                        ctrl.ToggleButton.BackColor = Color.FromArgb(13, 148, 136); // Teal 600
                        ctrl.ToggleButton.ForeColor = Color.Black;
                    }
                }
            }
        }

        public void LoadInitialLogs()
        {
            try
            {
                string logFile = Path.Combine(context.GetBaseDir(), "logs", "activity.log");
                if (File.Exists(logFile))
                {
                    using (FileStream fs = new FileStream(logFile, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                    {
                        long readBytes = Math.Min(fs.Length, 35000);
                        fs.Seek(Math.Max(0, fs.Length - readBytes), SeekOrigin.Begin);
                        using (StreamReader reader = new StreamReader(fs, Encoding.UTF8))
                        {
                            string raw = reader.ReadToEnd();
                            if (readBytes < fs.Length)
                            {
                                int firstNl = raw.IndexOf('\n');
                                if (firstNl >= 0 && firstNl < raw.Length - 1) raw = raw.Substring(firstNl + 1);
                            }
                            logBox.Clear();
                            AppendFormattedLogs(raw);
                            context.SetLastLogPos(fs.Position);
                        }
                    }
                }
            }
            catch { }
        }

        public void AppendLog(string logs)
        {
            if (this.IsDisposed || !this.IsHandleCreated) return;
            this.BeginInvoke(new Action(() =>
            {
                AppendFormattedLogs(logs);
            }));
        }

        private void AppendFormattedLogs(string logs)
        {
            if (string.IsNullOrEmpty(logs)) return;
            string[] lines = logs.Split(new char[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            logBox.SuspendLayout();
            try
            {
                foreach (string line in lines)
                {
                    Match m = Regex.Match(line, @"^\[(.*?)\]\s+\[(.*?)\]\s+(.*)$");
                    if (m.Success)
                    {
                        string ts = m.Groups[1].Value;
                        string srv = m.Groups[2].Value;
                        string msg = m.Groups[3].Value;

                        // Timestamp
                        logBox.SelectionStart = logBox.TextLength;
                        logBox.SelectionLength = 0;
                        logBox.SelectionColor = Color.FromArgb(100, 116, 139);
                        logBox.AppendText("[" + ts + "] ");

                        // Service tag
                        Color srvColor = Color.FromArgb(45, 212, 191);
                        if (srv == "system") srvColor = Color.FromArgb(56, 189, 248);
                        else if (srv == "webserver") srvColor = Color.FromArgb(129, 140, 248);
                        else if (srv == "php") srvColor = Color.FromArgb(192, 132, 252);
                        else if (srv == "database") srvColor = Color.FromArgb(251, 191, 36);
                        else if (srv.Contains("error")) srvColor = Color.FromArgb(248, 113, 113);

                        logBox.SelectionStart = logBox.TextLength;
                        logBox.SelectionLength = 0;
                        logBox.SelectionColor = srvColor;
                        logBox.AppendText("[" + srv + "] ");

                        // Message
                        Color msgColor = Color.FromArgb(226, 232, 240);
                        if (msg.IndexOf("error", StringComparison.OrdinalIgnoreCase) >= 0 || msg.IndexOf("failed", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            msgColor = Color.FromArgb(248, 113, 113);
                        }
                        else if (msg.IndexOf("running", StringComparison.OrdinalIgnoreCase) >= 0 || msg.IndexOf("started", StringComparison.OrdinalIgnoreCase) >= 0 || msg.IndexOf("success", StringComparison.OrdinalIgnoreCase) >= 0)
                        {
                            msgColor = Color.FromArgb(52, 211, 153);
                        }

                        logBox.SelectionStart = logBox.TextLength;
                        logBox.SelectionLength = 0;
                        logBox.SelectionColor = msgColor;
                        logBox.AppendText(msg + "\n");
                    }
                    else
                    {
                        logBox.SelectionStart = logBox.TextLength;
                        logBox.SelectionLength = 0;
                        logBox.SelectionColor = Color.FromArgb(203, 213, 225);
                        logBox.AppendText(line + "\n");
                    }
                }
                if (logBox.TextLength > 200000)
                {
                    logBox.Text = logBox.Text.Substring(100000);
                }
                logBox.SelectionStart = logBox.TextLength;
                logBox.ScrollToCaret();
            }
            finally
            {
                logBox.ResumeLayout();
            }
        }
    }

    public class ServiceRowControls
    {
        public Label NameLabel { get; set; }
        public Label DetailsLabel { get; set; }
        public Label PortLabel { get; set; }
        public Label StateLabel { get; set; }
        public Button ToggleButton { get; set; }
    }
}
