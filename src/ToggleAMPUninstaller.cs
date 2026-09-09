using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace ToggleAMPUninstaller
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);

            DialogResult dr = MessageBox.Show(
                "ToggleAMP 로컬 웹 개발 환경을 컴퓨터에서 완전히 삭제(제거)하시겠습니까?",
                "ToggleAMP v1.3.0 제거",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            if (dr != DialogResult.Yes) return;

            string baseDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');

            // 1. Kill all running processes
            string[] killList = new string[] {
                "nginx", "httpd", "php-cgi", "mysqld", "mariadbd", "redis-server", "mailpit", "ToggleAMP", "nobreak"
            };
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

            // 2. Remove Shortcuts
            try
            {
                string desktopLnk1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "ToggleAMP.lnk");
                if (File.Exists(desktopLnk1)) File.Delete(desktopLnk1);
                string desktopLnk2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), "nobreak.lnk");
                if (File.Exists(desktopLnk2)) File.Delete(desktopLnk2);

                string startMenu1 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "ToggleAMP");
                if (Directory.Exists(startMenu1)) Directory.Delete(startMenu1, true);
                string startMenu2 = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Programs), "nobreak");
                if (Directory.Exists(startMenu2)) Directory.Delete(startMenu2, true);
            }
            catch { }

            // 3. Remove Registry
            try
            {
                Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\ToggleAMP", false);
                Registry.CurrentUser.DeleteSubKeyTree(@"Software\Microsoft\Windows\CurrentVersion\Uninstall\nobreak", false);
            }
            catch { }

            // 4. Ask about keeping www and data
            DialogResult drKeep = MessageBox.Show(
                "사용자 프로젝트 파일(www/ 폴더)과 데이터베이스(data/ 폴더)를 보존하시겠습니까?\n\n[예]: 프로젝트 및 DB 보존 (추천)\n[아니요]: 모든 파일 완전 삭제",
                "사용자 데이터 보존 선택",
                MessageBoxButtons.YesNo,
                MessageBoxIcon.Question
            );

            bool keepData = (drKeep == DialogResult.Yes);

            // Self-delete via cmd script
            string tempBat = Path.Combine(Path.GetTempPath(), "endserver_cleanup.bat");
            using (StreamWriter sw = new StreamWriter(tempBat, false, System.Text.Encoding.Default))
            {
                sw.WriteLine("@echo off");
                sw.WriteLine("timeout /t 1 /nobreak >nul");
                if (keepData)
                {
                    sw.WriteLine("for /d %%D in (\"" + baseDir + "\\*\") do (");
                    sw.WriteLine("  if /i not \"%%~nxD\"==\"www\" if /i not \"%%~nxD\"==\"data\" rd /s /q \"%%D\"");
                    sw.WriteLine(")");
                    sw.WriteLine("for %%F in (\"" + baseDir + "\\*\") do (");
                    sw.WriteLine("  del /f /q \"%%F\"");
                    sw.WriteLine(")");
                }
                else
                {
                    sw.WriteLine("rd /s /q \"" + baseDir + "\"");
                }
                sw.WriteLine("del /f /q \"%~f0\"");
            }

            ProcessStartInfo psi = new ProcessStartInfo
            {
                FileName = tempBat,
                CreateNoWindow = true,
                UseShellExecute = false,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            Process.Start(psi);

            MessageBox.Show(
                "ToggleAMP가 성공적으로 제거되었습니다." + (keepData ? "\n(프로젝트 및 데이터베이스는 보존되었습니다)" : ""),
                "제거 완료",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information
            );

            Environment.Exit(0);
        }
    }
}
