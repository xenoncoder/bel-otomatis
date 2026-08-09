$ErrorActionPreference = "Stop"

# Configuration
$PhpUrl = "https://windows.php.net/downloads/releases/archives/php-8.3.10-nts-Win32-vs16-x64.zip"
$NginxUrl = "https://nginx.org/download/nginx-1.26.3.zip"
$InnoSetupUrl = "https://github.com/jrsoftware/issrc/releases/download/is-6_7_3/innosetup-6.7.3.exe"

$BuildDir = "$PSScriptRoot\installer-build"
$AppDir = "$PSScriptRoot"
$PhpZip = "$BuildDir\php.zip"
$NginxZip = "$BuildDir\nginx.zip"
$InnoSetupExe = "$BuildDir\innosetup.exe"

# Clean previous extracts
Remove-Item -Path "$BuildDir\php" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$BuildDir\nginx" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$PhpZip" -Force -ErrorAction SilentlyContinue

# Create build directory
if (-not (Test-Path -Path $BuildDir)) {
    New-Item -ItemType Directory -Path $BuildDir | Out-Null
}

Write-Host "Downloading Nginx 1.26.3 Stable..."
if (-not (Test-Path -Path $NginxZip)) {
    Invoke-WebRequest -Uri $NginxUrl -OutFile $NginxZip
}

Write-Host "Downloading PHP 8.3 x64..."
if (-not (Test-Path -Path $PhpZip)) {
    Invoke-WebRequest -Uri $PhpUrl -OutFile $PhpZip
}

Write-Host "Compiling RunHiddenConsole.cs..."
& "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" /out:"$BuildDir\RunHiddenConsole.exe" "$BuildDir\RunHiddenConsole.cs"

Write-Host "Extracting Nginx..."
if (-not (Test-Path -Path "$BuildDir\nginx")) {
    Expand-Archive -Path $NginxZip -DestinationPath "$BuildDir\nginx" -Force
}

Write-Host "Extracting PHP..."
if (-not (Test-Path -Path "$BuildDir\php")) {
    Expand-Archive -Path $PhpZip -DestinationPath "$BuildDir\php" -Force
}

Write-Host "Performing Extreme Diet (Stripping Unused Files)..."
# Diet PHP
Remove-Item -Path "$BuildDir\php\phpdbg.exe" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$BuildDir\php\php-win.exe" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$BuildDir\php\php.ini-development" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$BuildDir\php\php.ini-production" -Force -ErrorAction SilentlyContinue

$KeepExts = @("php_curl.dll", "php_fileinfo.dll", "php_mbstring.dll", "php_openssl.dll", "php_pdo_sqlite.dll", "php_sqlite3.dll")
if (Test-Path "$BuildDir\php\ext") {
    Get-ChildItem -Path "$BuildDir\php\ext" -File | ForEach-Object {
        if ($KeepExts -notcontains $_.Name) {
            Remove-Item $_.FullName -Force
        }
    }
}

# Diet Nginx
Remove-Item -Path "$BuildDir\nginx\nginx-1.26.3\docs" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "$BuildDir\nginx\nginx-1.26.3\contrib" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Downloading Inno Setup..."
if (-not (Test-Path -Path $InnoSetupExe)) {
    Invoke-WebRequest -Uri $InnoSetupUrl -OutFile $InnoSetupExe
}

Write-Host "Installing Inno Setup locally..."
Start-Process -FilePath $InnoSetupExe -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/DIR=""$BuildDir\InnoSetup""" -Wait -NoNewWindow
$IsccExe = "$BuildDir\InnoSetup\iscc.exe"

if (-not (Test-Path -Path $IsccExe)) {
    Write-Error "Failed to install Inno Setup Compiler"
    exit 1
}

Write-Host "Generating Start/Stop scripts and Nginx Config..."

# Nginx config stub for dynamic path injection
$NginxConf = @'
worker_processes  1;
events {
    worker_connections  1024;
}
http {
    include       mime.types;
    default_type  application/octet-stream;
    sendfile        on;
    keepalive_timeout  65;

    server {
        listen       8000;
        server_name  localhost;
        
        # Absolute path placeholder
        root         {{APP_DIR}}www/public;
        
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";

        index index.php;
        charset utf-8;

        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        location = /favicon.ico { access_log off; log_not_found off; }
        location = /robots.txt  { access_log off; log_not_found off; }

        error_page 404 /index.php;

        location ~ \.php$ {
            fastcgi_pass   127.0.0.1:9000;
            fastcgi_param  SCRIPT_FILENAME {{APP_DIR}}www/public$fastcgi_script_name;
            include        fastcgi_params;
        }

        location ~ /\.(?!well-known).* {
            deny all;
        }
    }
}
'@
Set-Content -Path "$BuildDir\nginx.conf.stub" -Value $NginxConf -Encoding ASCII

# VBS script to run bat hidden
$RunHiddenVbs = @"
Set WshShell = CreateObject("WScript.Shell") 
WshShell.Run chr(34) & WScript.Arguments(0) & chr(34), 0
Set WshShell = Nothing
"@
Set-Content -Path "$BuildDir\run-hidden.vbs" -Value $RunHiddenVbs -Encoding ASCII

# Start App Bat
$StartBat = @"
@echo off
set APP_DIR=%~dp0
set PHP_DIR=%APP_DIR%php
set NGINX_DIR=%APP_DIR%nginx\nginx-1.26.3

echo Mengonfigurasi Nginx Path Secara Dinamis...
powershell -NoProfile -Command "(Get-Content '%APP_DIR%nginx\nginx-1.26.3\conf\nginx.conf.stub') -replace '\{\{APP_DIR\}\}', '%APP_DIR%'.Replace('\','/') | Set-Content '%APP_DIR%nginx\nginx-1.26.3\conf\nginx.conf'"

echo Menghubungkan direktori storage...
if not exist "%APP_DIR%www\public\storage" (
    cd /D "%APP_DIR%www\public"
    mklink /J storage "..\storage\app\public" >nul 2>&1
)

echo Memulai PHP FastCGI...
cd /D "%NGINX_DIR%"
"%APP_DIR%RunHiddenConsole.exe" "%PHP_DIR%\php-cgi.exe" -b 127.0.0.1:9000 -c "%PHP_DIR%\php.ini"

echo Memulai Nginx...
cd /D "%NGINX_DIR%"
"%APP_DIR%RunHiddenConsole.exe" nginx.exe

echo Membuka aplikasi...
start http://localhost:8000
"@
Set-Content -Path "$BuildDir\start.bat" -Value $StartBat -Encoding ASCII

# Stop App Bat
$StopBat = @"
@echo off
echo Menghentikan Nginx...
taskkill /F /IM nginx.exe /T >nul 2>&1
echo Menghentikan PHP FastCGI...
taskkill /F /IM php-cgi.exe /T >nul 2>&1
echo Menunggu penutupan sistem...
ping 127.0.0.1 -n 3 > nul
"@
Set-Content -Path "$BuildDir\stop.bat" -Value $StopBat -Encoding ASCII

Write-Host "Copying additional tools..."

Write-Host "Compiling SetVolume executable..."
$setVolCs = @"
using System;
using System.Runtime.InteropServices;
public class VolumeControl {
    [Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IAudioEndpointVolume {
        int RegisterControlChangeNotify(IntPtr pNotify);
        int UnregisterControlChangeNotify(IntPtr pNotify);
        int GetChannelCount(out int count);
        int SetMasterVolumeLevel(float fLevelDB, Guid pguidEventContext);
        int SetMasterVolumeLevelScalar(float fLevel, Guid pguidEventContext);
        int GetMasterVolumeLevel(out float pfLevelDB);
        int GetMasterVolumeLevelScalar(out float pfLevel);
    }
    [Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDevice {
        int Activate(ref Guid id, int clsCtx, int activationParams, out IAudioEndpointVolume aev);
    }
    [Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
    interface IMMDeviceEnumerator {
        int NotImpl1();
        int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice endpoint);
    }
    [ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
    class MMDeviceEnumeratorComObject { }
    public static void Main(string[] args) {
        float targetVolume;
        if (args.Length > 0 && float.TryParse(args[0], out targetVolume)) {
            if (targetVolume < 0) targetVolume = 0;
            if (targetVolume > 100) targetVolume = 100;
            IMMDeviceEnumerator deviceEnumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorComObject());
            IMMDevice device;
            deviceEnumerator.GetDefaultAudioEndpoint(0, 1, out device);
            Guid IID_IAudioEndpointVolume = typeof(IAudioEndpointVolume).GUID;
            IAudioEndpointVolume aev;
            device.Activate(ref IID_IAudioEndpointVolume, 1, 0, out aev);
            aev.SetMasterVolumeLevelScalar(targetVolume / 100.0f, Guid.Empty);
        }
    }
}
"@
Set-Content -Path "$BuildDir\setvol.cs" -Value $setVolCs -Encoding UTF8
Start-Process -FilePath "C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe" -ArgumentList "/nologo /out:`"$BuildDir\setvol.exe`" `"$BuildDir\setvol.cs`"" -Wait -NoNewWindow
if (Test-Path "$BuildDir\setvol.exe") {
    Copy-Item -Path "$BuildDir\setvol.exe" -Destination "$AppDir\setvol.exe" -Force
}

if (Test-Path "$AppDir\php.ini") {
    Copy-Item -Path "$AppDir\php.ini" -Destination "$BuildDir\php\php.ini" -Force
} else {
    Write-Host "Creating php.ini dynamically..."
    $PhpIniContent = "extension_dir = 'ext'
extension=curl
extension=fileinfo
extension=mbstring
extension=openssl
extension=pdo_sqlite
extension=sqlite3"
    Set-Content -Path "$BuildDir\php\php.ini" -Value $PhpIniContent -Encoding ASCII
}

Write-Host "Generating Inno Setup Script..."
# Inno Setup Script
$IssScript = @"
[Setup]
AppName=Bel Sekolah Otomatis
AppVersion=1.0
DefaultDirName={userappdata}\BelOtomatis
DefaultGroupName=Bel Sekolah Otomatis
OutputDir=$BuildDir
OutputBaseFilename=BelOtomatis-Installer
SetupIconFile=$AppDir\bell.ico
UninstallDisplayIcon={app}\bell.ico
Compression=lzma2/ultra64
SolidCompression=yes
PrivilegesRequired=lowest
DisableProgramGroupPage=yes

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Dirs]
Name: "{app}\php"
Name: "{app}\nginx"
Name: "{app}\www"

[Files]
Source: "php\*"; DestDir: "{app}\php"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "nginx\*"; DestDir: "{app}\nginx"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "nginx.conf.stub"; DestDir: "{app}\nginx\nginx-1.26.3\conf"; Flags: ignoreversion
Source: "start.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "stop.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "run-hidden.vbs"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\bell.ico"; DestDir: "{app}"; Flags: ignoreversion
Source: "RunHiddenConsole.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\app\*"; DestDir: "{app}\www\app"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\bootstrap\*"; DestDir: "{app}\www\bootstrap"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\config\*"; DestDir: "{app}\www\config"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\database\*"; DestDir: "{app}\www\database"; Excludes: "factories,factories\*,seeders,seeders\*"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\public\*"; DestDir: "{app}\www\public"; Excludes: "hot,storage"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\resources\*"; DestDir: "{app}\www\resources"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\routes\*"; DestDir: "{app}\www\routes"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\storage\*"; DestDir: "{app}\www\storage"; Excludes: "framework\cache\data\*,framework\views\*,logs\*"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\vendor\*"; DestDir: "{app}\www\vendor"; Excludes: "*\tests\*,*\docs\*,*\*.md"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "..\setvol.exe"; DestDir: "{app}\www"
Source: "..\artisan"; DestDir: "{app}\www"; Flags: ignoreversion
Source: "..\.env"; DestDir: "{app}\www"; Flags: ignoreversion

[Icons]
Name: "{group}\Bel Sekolah Otomatis"; Filename: "{app}\run-hidden.vbs"; Parameters: """{app}\start.bat"""; IconFilename: "{app}\bell.ico"
Name: "{group}\Uninstall Bel Sekolah Otomatis"; Filename: "{uninstallexe}"
Name: "{userdesktop}\Bel Sekolah Otomatis"; Filename: "{app}\run-hidden.vbs"; Parameters: """{app}\start.bat"""; IconFilename: "{app}\bell.ico"; Tasks: desktopicon

[Registry]
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "BelSekolahOtomatis"; ValueData: """{sys}\wscript.exe"" ""{app}\run-hidden.vbs"" ""{app}\start.bat"""; Flags: uninsdeletevalue

[Run]
Filename: "{app}\start.bat"; Description: "Jalankan Bel Sekolah Otomatis"; Flags: postinstall nowait runhidden runasoriginaluser

[UninstallRun]
RunOnceId: "StopApp"; Filename: "{app}\stop.bat"; Flags: runhidden waituntilterminated

[UninstallDelete]
Type: filesandordirs; Name: "{app}"
"@

Set-Content -Path "$BuildDir\installer.iss" -Value $IssScript -Encoding ASCII

Write-Host "Compiling Setup..."
Start-Process -FilePath $IsccExe -ArgumentList "$BuildDir\installer.iss" -Wait -NoNewWindow

Write-Host "Installer built successfully."
