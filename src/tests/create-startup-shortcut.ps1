$appdata = [System.Environment]::GetFolderPath('ApplicationData')
$path = Join-Path $appdata 'Microsoft\Windows\Start Menu\Programs\Startup\Zalo-AI-Assistant.lnk'
$Shell = New-Object -ComObject WScript.Shell
$Shortcut = $Shell.CreateShortcut($path)
$Shortcut.TargetPath = 'c:\Users\ABC\Desktop\Zalo_AI_Assistant_Setup\start-bot.bat'
$Shortcut.WorkingDirectory = 'c:\Users\ABC\Desktop\Zalo_AI_Assistant_Setup'
$Shortcut.Save()
Write-Host "Startup shortcut created successfully at: $path"
