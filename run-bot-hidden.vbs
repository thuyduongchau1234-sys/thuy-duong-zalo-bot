Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c " & chr(34) & "c:\Users\ABC\Desktop\Zalo_AI_Assistant_Setup\start-bot.bat" & chr(34), 0
Set WshShell = Nothing
