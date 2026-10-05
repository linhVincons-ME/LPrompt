' Compatibility launcher: start the registered Windows Service, never spawn a loose Node process.
Set shellApp = CreateObject("Shell.Application")
Set fso = CreateObject("Scripting.FileSystemObject")
currentDir = fso.GetParentFolderName(WScript.ScriptFullName)
scriptPath = currentDir & "\service\windows\Start-LPromptService.ps1"
arguments = "-NoProfile -ExecutionPolicy Bypass -File """ & scriptPath & """ -OpenBrowser"
shellApp.ShellExecute "powershell.exe", arguments, "", "runas", 0
