using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace ToggleAMPInstaller
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new InstallerForm());
        }
    }

    public class InstallerForm : Form
    {
        private Panel pnlWelcome;
        private Panel pnlProgress;
        private Panel pnlFinish;

        // Welcome Controls
        private TextBox txtInstallPath;
        private CheckBox chkDesktopShortcut;
        private CheckBox chkStartMenu;
        private CheckBox chkRegisterUninstall;
        private Button btnInstall;

        // Progress Controls
        private ProgressBar progressBar;
        private Label lblProgressStatus;
        private Label lblProgressDetail;

        // Finish Controls
        private CheckBox chkLaunchNow;
        private Button btnFinish;

        private string defaultPath = @"C:\ToggleAMP";
        private string selfExePath;
        private long zipOffset = 0;
        private long zipLength = 0;

        public InstallerForm()
        {
            selfExePath = Application.ExecutablePath;
            InitializeComponent();
            CheckPayload();
        }

        private void InitializeComponent()
        {
            this.Text = "ToggleAMP v1.3.0 — 설치 마법사 (Setup Wizard)";
            this.Size = new Size(620, 470);
            this.MinimumSize = new Size(620, 470);
            this.MaximumSize = new Size(620, 470);
            this.FormBorderStyle = FormBorderStyle.FixedDialog;
            this.MaximizeBox = false;
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(15, 23, 42); // Slate 900
            this.ForeColor = Color.FromArgb(248, 250, 252);
            this.Font = new Font("Segoe UI", 9.25F, FontStyle.Regular);

            // Icon
            try
            {
                string iconPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ToggleAMP.ico");
                if (File.Exists(iconPath)) this.Icon = new Icon(iconPath);
            }
            catch { }

            // 1. TOP HEADER (Height: 70)
            Panel headerPanel = new Panel
            {
                Location = new Point(0, 0),
                Size = new Size(this.ClientSize.Width, 70),
                BackColor = Color.FromArgb(30, 41, 59) // Slate 800
            };

            Label titleLabel = new Label
            {
                Text = "ToggleAMP v1.3.0 설치 마법사",
                Font = new Font("Segoe UI", 15F, FontStyle.Bold),
                ForeColor = Color.FromArgb(45, 212, 191), // Teal 400
                AutoSize = true,
                Location = new Point(20, 14)
            };
            headerPanel.Controls.Add(titleLabel);

            Label subTitleLabel = new Label
            {
                Text = "현대적인 멀티 스택 로컬 웹 개발 환경 (Nginx/Apache, PHP 5.2~8.4, DB, Redis, Mailpit)",
                Font = new Font("Segoe UI", 8.5F, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184),
                AutoSize = true,
                Location = new Point(22, 42)
            };
            headerPanel.Controls.Add(subTitleLabel);

            this.Controls.Add(headerPanel);

            // 2. PAGE 1: WELCOME & CONFIG PANEL
            pnlWelcome = new Panel
            {
                Location = new Point(0, 70),
                Size = new Size(this.ClientSize.Width, this.ClientSize.Height - 70),
                BackColor = Color.Transparent,
                Padding = new Padding(24)
            };

            Label lblIntro = new Label
            {
                Text = "ToggleAMP 멀티 스택 로컬 개발 환경을 컴퓨터에 설치합니다.",
                Font = new Font("Segoe UI", 9.5F, FontStyle.Regular),
                ForeColor = Color.FromArgb(226, 232, 240),
                Location = new Point(24, 18),
                Size = new Size(550, 24)
            };
            pnlWelcome.Controls.Add(lblIntro);

            // Path Group
            Label lblPathTitle = new Label
            {
                Text = "📁 설치 대상 폴더 (Destination Folder):",
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = Color.FromArgb(56, 189, 248),
                Location = new Point(24, 52),
                AutoSize = true
            };
            pnlWelcome.Controls.Add(lblPathTitle);

            txtInstallPath = new TextBox
            {
                Text = defaultPath,
                Location = new Point(24, 76),
                Width = 440,
                Height = 26,
                BackColor = Color.FromArgb(2, 6, 23),
                ForeColor = Color.White,
                Font = new Font("Segoe UI", 9.5F)
            };
            pnlWelcome.Controls.Add(txtInstallPath);

            Button btnBrowse = new Button
            {
                Text = "찾아보기...",
                Location = new Point(472, 75),
                Width = 98,
                Height = 28,
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnBrowse.FlatAppearance.BorderSize = 0;
            btnBrowse.Click += (s, e) =>
            {
                using (FolderBrowserDialog fbd = new FolderBrowserDialog())
                {
                    fbd.Description = "ToggleAMP를 설치할 폴더를 선택하세요.";
                    fbd.SelectedPath = txtInstallPath.Text;
                    if (fbd.ShowDialog() == DialogResult.OK)
                    {
                        txtInstallPath.Text = fbd.SelectedPath;
                    }
                }
            };
            pnlWelcome.Controls.Add(btnBrowse);

            // Options Group
            Label lblOptTitle = new Label
            {
                Text = "⚙️ 추가 작업 및 바로가기 옵션:",
                Font = new Font("Segoe UI", 9F, FontStyle.Bold),
                ForeColor = Color.FromArgb(56, 189, 248),
                Location = new Point(24, 120),
                AutoSize = true
            };
            pnlWelcome.Controls.Add(lblOptTitle);

            chkDesktopShortcut = new CheckBox
            {
                Text = "바탕화면에 바로가기 생성 (Create Desktop Shortcut)",
                Checked = true,
                Location = new Point(28, 145),
                AutoSize = true,
                ForeColor = Color.FromArgb(226, 232, 240)
            };
            pnlWelcome.Controls.Add(chkDesktopShortcut);

            chkStartMenu = new CheckBox
            {
                Text = "시작 메뉴 프로그램에 등록 (Create Start Menu Folder)",
                Checked = true,
                Location = new Point(28, 172),
                AutoSize = true,
                ForeColor = Color.FromArgb(226, 232, 240)
            };
            pnlWelcome.Controls.Add(chkStartMenu);

            chkRegisterUninstall = new CheckBox
            {
                Text = "제어판 프로그램 추가/제거에 등록 (Register in Windows Apps)",
                Checked = true,
                Location = new Point(28, 199),
                AutoSize = true,
                ForeColor = Color.FromArgb(226, 232, 240)
            };
            pnlWelcome.Controls.Add(chkRegisterUninstall);

            // Bottom Buttons
            btnInstall = new Button
            {
                Text = "⚡ 지금 설치 (Install)",
                Location = new Point(400, 270),
                Width = 170,
                Height = 38,
                BackColor = Color.FromArgb(13, 148, 136), // Teal 600
                ForeColor = Color.Black,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnInstall.FlatAppearance.BorderSize = 0;
            btnInstall.Click += (s, e) => StartInstallation();
            pnlWelcome.Controls.Add(btnInstall);

            Button btnCancel = new Button
            {
                Text = "취소 (Cancel)",
                Location = new Point(300, 270),
                Width = 90,
                Height = 38,
                BackColor = Color.FromArgb(51, 65, 85),
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnCancel.FlatAppearance.BorderSize = 0;
            btnCancel.Click += (s, e) => this.Close();
            pnlWelcome.Controls.Add(btnCancel);

            this.Controls.Add(pnlWelcome);

            // 3. PAGE 2: PROGRESS PANEL
            pnlProgress = new Panel
            {
                Location = new Point(0, 70),
                Size = new Size(this.ClientSize.Width, this.ClientSize.Height - 70),
                BackColor = Color.Transparent,
                Visible = false,
                Padding = new Padding(24)
            };

            lblProgressStatus = new Label
            {
                Text = "ToggleAMP 파일을 설치 대상 폴더로 복사 및 압축 해제 중입니다...",
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = Color.FromArgb(45, 212, 191),
                Location = new Point(24, 40),
                Size = new Size(550, 28)
            };
            pnlProgress.Controls.Add(lblProgressStatus);

            progressBar = new ProgressBar
            {
                Location = new Point(24, 80),
                Size = new Size(550, 26),
                Style = ProgressBarStyle.Continuous
            };
            pnlProgress.Controls.Add(progressBar);

            lblProgressDetail = new Label
            {
                Text = "준비 중...",
                Font = new Font("Consolas", 8.5F),
                ForeColor = Color.FromArgb(148, 163, 184),
                Location = new Point(24, 115),
                Size = new Size(550, 60)
            };
            pnlProgress.Controls.Add(lblProgressDetail);

            this.Controls.Add(pnlProgress);

            // 4. PAGE 3: FINISH PANEL
            pnlFinish = new Panel
            {
                Location = new Point(0, 70),
                Size = new Size(this.ClientSize.Width, this.ClientSize.Height - 70),
                BackColor = Color.Transparent,
                Visible = false,
                Padding = new Padding(24)
            };

            Label lblFinishTitle = new Label
            {
                Text = "🎉 ToggleAMP v1.3.0 설치가 완료되었습니다!",
                Font = new Font("Segoe UI", 14F, FontStyle.Bold),
                ForeColor = Color.FromArgb(34, 197, 94), // Green 500
                Location = new Point(24, 30),
                AutoSize = true
            };
            pnlFinish.Controls.Add(lblFinishTitle);

            Label lblFinishDesc = new Label
            {
                Text = "이제 바탕화면 바로가기 또는 설치 폴더에서 ToggleAMP를 실행하여\n멀티 스택 웹 개발 환경을 즉시 사용하실 수 있습니다.",
                Font = new Font("Segoe UI", 9.5F),
                ForeColor = Color.FromArgb(226, 232, 240),
                Location = new Point(26, 75),
                Size = new Size(540, 50)
            };
            pnlFinish.Controls.Add(lblFinishDesc);

            chkLaunchNow = new CheckBox
            {
                Text = "🚀 지금 ToggleAMP 실행하기 (Launch ToggleAMP now)",
                Checked = true,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                ForeColor = Color.FromArgb(45, 212, 191),
                Location = new Point(28, 150),
                AutoSize = true
            };
            pnlFinish.Controls.Add(chkLaunchNow);

            btnFinish = new Button
            {
                Text = "완료 (Finish)",
                Location = new Point(410, 260),
                Width = 160,
                Height = 38,
                BackColor = Color.FromArgb(13, 148, 136),
                ForeColor = Color.Black,
                Font = new Font("Segoe UI", 10F, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnFinish.FlatAppearance.BorderSize = 0;
            btnFinish.Click += (s, e) =>
            {
                if (chkLaunchNow.Checked)
                {
                    string targetExe = Path.Combine(txtInstallPath.Text.Trim(), "ToggleAMP.exe");
                    if (File.Exists(targetExe))
                    {
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = targetExe,
                            WorkingDirectory = txtInstallPath.Text.Trim()
                        });
                    }
                }
                this.Close();
            };
            pnlFinish.Controls.Add(btnFinish);

            this.Controls.Add(pnlFinish);
        }

        private void CheckPayload()
        {
            try
            {
                using (FileStream fs = new FileStream(selfExePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    if (fs.Length > 16)
                    {
                        fs.Seek(fs.Length - 16, SeekOrigin.Begin);
                        byte[] magic = new byte[8];
                        fs.Read(magic, 0, 8);
                        string magicStr = Encoding.ASCII.GetString(magic);
                        if (magicStr == "ENDSERVERZ" || magicStr == "NOBREAKZ")
                        {
                            byte[] lenBytes = new byte[8];
                            fs.Read(lenBytes, 0, 8);
                            zipLength = BitConverter.ToInt64(lenBytes, 0);
                            zipOffset = fs.Length - 16 - zipLength;
                        }
                    }
                }
            }
            catch { }
        }

        private void StartInstallation()
        {
            string targetDir = txtInstallPath.Text.Trim();
            if (string.IsNullOrEmpty(targetDir))
            {
                MessageBox.Show("설치할 대상 폴더 경로를 입력하세요.", "알림", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            pnlWelcome.Visible = false;
            pnlProgress.Visible = true;
            progressBar.Value = 5;

            bool makeDesktop = chkDesktopShortcut.Checked;
            bool makeStartMenu = chkStartMenu.Checked;
            bool registerUninstall = chkRegisterUninstall.Checked;

            ThreadPool.QueueUserWorkItem(_ =>
            {
                try
                {
                    PerformInstall(targetDir, makeDesktop, makeStartMenu, registerUninstall);
                    this.BeginInvoke(new Action(() =>
                    {
                        pnlProgress.Visible = false;
                        pnlFinish.Visible = true;
                    }));
                }
                catch (Exception ex)
                {
                    this.BeginInvoke(new Action(() =>
                    {
                        MessageBox.Show("설치 중 오류가 발생했습니다: " + ex.Message, "오류", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        pnlProgress.Visible = false;
                        pnlWelcome.Visible = true;
                    }));
                }
            });
        }

        private void PerformInstall(string targetDir, bool makeDesktop, bool makeStartMenu, bool registerUninstall)
        {
            UpdateProgress(2, "기존 실행 중인 서비스 정리 중...");
            string[] killList = new string[] { "nginx", "httpd", "php-cgi", "mysqld", "mariadbd", "redis-server", "mailpit", "ToggleAMP", "nobreak" };
            foreach (string k in killList)
            {
                try
                {
                    foreach (Process p in Process.GetProcessesByName(k))
                    {
                        try { p.Kill(); } catch { }
                    }
                }
                catch { }
            }

            if (!Directory.Exists(targetDir))
            {
                Directory.CreateDirectory(targetDir);
            }

            // Extract embedded ZIP or bundled zip file
            if (zipLength > 0 && zipOffset > 0)
            {
                // Embedded in this EXE
                using (FileStream fs = new FileStream(selfExePath, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
                {
                    fs.Seek(zipOffset, SeekOrigin.Begin);
                    using (SubStream sub = new SubStream(fs, zipLength))
                    using (ZipArchive archive = new ZipArchive(sub, ZipArchiveMode.Read))
                    {
                        int total = archive.Entries.Count;
                        int current = 0;

                        foreach (ZipArchiveEntry entry in archive.Entries)
                        {
                            current++;
                            string destPath = Path.Combine(targetDir, entry.FullName.Replace('/', '\\'));

                            if (string.IsNullOrEmpty(entry.Name))
                            {
                                if (!Directory.Exists(destPath)) Directory.CreateDirectory(destPath);
                                continue;
                            }

                            string parentDir = Path.GetDirectoryName(destPath);
                            if (!Directory.Exists(parentDir)) Directory.CreateDirectory(parentDir);

                            entry.ExtractToFile(destPath, true);

                            int pct = (int)((current / (double)total) * 80.0) + 10;
                            UpdateProgress(pct, entry.FullName);
                        }
                    }
                }
            }
            else
            {
                // Look for adjacent ToggleAMP-v1.3.0.zip or source folder
                string adjZip = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ToggleAMP-v1.3.0.zip");
                if (!File.Exists(adjZip)) adjZip = @"C:\ToggleAMP_backup\ToggleAMP-v1.3.0.zip";

                if (File.Exists(adjZip))
                {
                    using (ZipArchive archive = ZipFile.OpenRead(adjZip))
                    {
                        int total = archive.Entries.Count;
                        int current = 0;

                        foreach (ZipArchiveEntry entry in archive.Entries)
                        {
                            current++;
                            string destPath = Path.Combine(targetDir, entry.FullName.Replace('/', '\\'));

                            if (string.IsNullOrEmpty(entry.Name))
                            {
                                if (!Directory.Exists(destPath)) Directory.CreateDirectory(destPath);
                                continue;
                            }

                            string parentDir = Path.GetDirectoryName(destPath);
                            if (!Directory.Exists(parentDir)) Directory.CreateDirectory(parentDir);

                            entry.ExtractToFile(destPath, true);

                            int pct = (int)((current / (double)total) * 80.0) + 10;
                            UpdateProgress(pct, entry.FullName);
                        }
                    }
                }
                else
                {
                    // Copy from existing directory if available
                    string srcDir = @"C:\ToggleAMP";
                    if (!Directory.Exists(srcDir)) srcDir = @"C:\koken";

                    if (Directory.Exists(srcDir) && !srcDir.Equals(targetDir, StringComparison.OrdinalIgnoreCase))
                    {
                        CopyDirectory(srcDir, targetDir);
                    }
                }
            }

            UpdateProgress(90, "바로가기 및 바로가기 등록 중...");

            string mainExe = Path.Combine(targetDir, "ToggleAMP.exe");
            string mainIco = Path.Combine(targetDir, "ToggleAMP.ico");

            // Desktop Shortcut
            if (makeDesktop)
            {
                string desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
                string lnkPath = Path.Combine(desktopPath, "ToggleAMP.lnk");
                CreateShortcut(lnkPath, mainExe, targetDir, mainIco);
            }

            // Start Menu Shortcut
            if (makeStartMenu)
            {
                string startMenuPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "ToggleAMP");
                if (!Directory.Exists(startMenuPath)) Directory.CreateDirectory(startMenuPath);
                CreateShortcut(Path.Combine(startMenuPath, "ToggleAMP.lnk"), mainExe, targetDir, mainIco);
            }

            // Create Uninstaller
            string uninstallerExe = Path.Combine(targetDir, "uninstall.exe");
            GenerateUninstaller(uninstallerExe);

            // Register in Windows Uninstall
            if (registerUninstall)
            {
                RegisterInWindows(targetDir, uninstallerExe, mainIco);
            }

            UpdateProgress(100, "설치가 완료되었습니다.");
        }

        private void UpdateProgress(int pct, string detail)
        {
            if (this.IsDisposed || !this.IsHandleCreated) return;
            this.BeginInvoke(new Action(() =>
            {
                progressBar.Value = Math.Min(100, Math.Max(0, pct));
                lblProgressDetail.Text = detail;
            }));
        }

        private void CopyDirectory(string sourceDir, string destinationDir)
        {
            DirectoryInfo dir = new DirectoryInfo(sourceDir);
            DirectoryInfo[] dirs = dir.GetDirectories();

            if (!Directory.Exists(destinationDir)) Directory.CreateDirectory(destinationDir);

            FileInfo[] files = dir.GetFiles();
            foreach (FileInfo file in files)
            {
                string temppath = Path.Combine(destinationDir, file.Name);
                file.CopyTo(temppath, true);
            }

            foreach (DirectoryInfo subdir in dirs)
            {
                string temppath = Path.Combine(destinationDir, subdir.Name);
                CopyDirectory(subdir.FullName, temppath);
            }
        }

        private void CreateShortcut(string shortcutPath, string targetPath, string workDir, string iconPath)
        {
            try
            {
                Type shellType = Type.GetTypeFromProgID("WScript.Shell");
                dynamic shell = Activator.CreateInstance(shellType);
                dynamic shortcut = shell.CreateShortcut(shortcutPath);
                shortcut.TargetPath = targetPath;
                shortcut.WorkingDirectory = workDir;
                shortcut.IconLocation = iconPath + ",0";
                shortcut.Description = "ToggleAMP v1.3.0 - Multi-Stack Local Dev";
                shortcut.Save();
            }
            catch { }
        }

        private void RegisterInWindows(string installDir, string uninstallerPath, string iconPath)
        {
            try
            {
                string keyPath = @"Software\Microsoft\Windows\CurrentVersion\Uninstall\ToggleAMP";
                using (RegistryKey key = Registry.CurrentUser.CreateSubKey(keyPath))
                {
                    if (key != null)
                    {
                        key.SetValue("DisplayName", "ToggleAMP v1.3.0 (Local Web Dev)");
                        key.SetValue("DisplayVersion", "1.3.0");
                        key.SetValue("Publisher", "ToggleAMP");
                        key.SetValue("DisplayIcon", iconPath);
                        key.SetValue("InstallLocation", installDir);
                        key.SetValue("UninstallString", "\"" + uninstallerPath + "\"");
                        key.SetValue("NoModify", 1, RegistryValueKind.DWord);
                        key.SetValue("NoRepair", 1, RegistryValueKind.DWord);
                    }
                }
            }
            catch { }
        }

        private void GenerateUninstaller(string outPath)
        {
            try
            {
                string srcUninstaller = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "src", "uninstall.exe");
                if (File.Exists(srcUninstaller))
                {
                    File.Copy(srcUninstaller, outPath, true);
                }
            }
            catch { }
        }
    }

    public class SubStream : Stream
    {
        private Stream baseStream;
        private long length;
        private long position;

        public SubStream(Stream baseStream, long length)
        {
            this.baseStream = baseStream;
            this.length = length;
            this.position = 0;
        }

        public override bool CanRead { get { return true; } }
        public override bool CanSeek { get { return false; } }
        public override bool CanWrite { get { return false; } }
        public override long Length { get { return length; } }
        public override long Position
        {
            get { return position; }
            set { throw new NotSupportedException(); }
        }

        public override int Read(byte[] buffer, int offset, int count)
        {
            if (position >= length) return 0;
            int toRead = (int)Math.Min(count, length - position);
            int read = baseStream.Read(buffer, offset, toRead);
            position += read;
            return read;
        }

        public override void Flush() { }
        public override long Seek(long offset, SeekOrigin origin) { throw new NotSupportedException(); }
        public override void SetLength(long value) { throw new NotSupportedException(); }
        public override void Write(byte[] buffer, int offset, int count) { throw new NotSupportedException(); }
    }
}
