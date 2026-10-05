' ==============================================================
'  LPrompt Studio (v3.0) - Silent Background Service Launcher
'  Chay ngam hoan toan, KHONG hien cua so den console
' ==============================================================

Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Get current script directory
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)

' Command to run node server/index.js
cmd = "cmd.exe /c cd /d """ & currentDir & """ && node server/index.js"

' Run hidden (0 = hide window, false = do not wait)
WshShell.Run cmd, 0, False

' Health verification and user notification are handled by Run_LPrompt_Service.bat.
