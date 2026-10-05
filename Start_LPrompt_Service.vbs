' ==============================================================
'  LPrompt Studio (v2.5) - Silent Background Service Launcher
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

' Optional notify user
WScript.Sleep 1000
WshShell.Popup "LPrompt Background Service (v2.5) da khoi dong thanh cong!" & vbCrLf & _
               "Dia chi: http://localhost:8484" & vbCrLf & _
               "Co so du lieu: data\lprompt.db (Embedded SQLite)", 4, "LPrompt Studio v2.5", 64
