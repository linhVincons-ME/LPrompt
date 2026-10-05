import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const serviceDir = path.resolve('service/windows');
const read = (name) => fs.readFileSync(path.join(serviceDir, name), 'utf8');

describe('Windows Service package', () => {
  it('uses a configurable, least-privilege WinSW configuration', () => {
    const template = read('LPromptService.xml.template');
    expect(template).toContain('<startmode>{{START_MODE}}</startmode>');
    expect(template).toContain('<username>NT AUTHORITY\\LocalService</username>');
    expect(template).not.toContain('<username>LocalSystem</username>');
    expect(template).toContain('<stoptimeout>20 sec</stoptimeout>');
    expect(template).toContain('LPROMPT_SHUTDOWN_TIMEOUT_MS');
  });

  it('pins and verifies the WinSW binary', () => {
    const installer = read('Install-LPromptService.ps1');
    expect(installer).toContain("$winSwVersion = '2.12.0'");
    expect(installer).toMatch(/\$winSwSha256 = '[A-F0-9]{64}'/);
    expect(installer).toContain('Get-FileHash');
    expect(installer).toContain("[ValidateSet('Manual', 'Automatic')]");
    expect(installer).not.toContain("$script:LPromptRoot /grant '*S-1-5-19:(OI)(CI)RX' /T");
  });

  it('never force-kills Node from service control scripts', () => {
    const controls = [
      'Start-LPromptService.ps1',
      'Stop-LPromptService.ps1',
      'Restart-LPromptService.ps1',
      'Uninstall-LPromptService.ps1'
    ].map(read).join('\n');
    expect(controls).not.toMatch(/Stop-Process|taskkill/i);
    expect(controls).toContain('Stop-Service');
    expect(controls).toContain('Wait-LPromptServiceStatus');
  });

  it('preserves launcher exit codes and rolls back failed startup', () => {
    const launchers = [
      'Run_LPrompt_Service.bat',
      'Stop_LPrompt_Service.bat',
      'Install_LPrompt_Windows_Service.bat',
      'Restart_LPrompt_Service.bat',
      'Uninstall_LPrompt_Windows_Service.bat'
    ].map((name) => fs.readFileSync(path.resolve(name), 'utf8'));
    for (const launcher of launchers) {
      expect(launcher).toContain('set "LPROMPT_EXIT=%errorlevel%"');
      expect(launcher).toContain('exit /b %LPROMPT_EXIT%');
    }
    const installer = read('Install-LPromptService.ps1');
    expect(installer).toContain('không đạt health check và đã được dừng');
    expect(installer).toContain('đã thử rollback đăng ký service');
    const legacyLauncher = fs.readFileSync(path.resolve('Start_LPrompt_Service.vbs'), 'utf8');
    expect(legacyLauncher).not.toContain('node server/index.js');
    expect(legacyLauncher).toContain('Start-LPromptService.ps1');
  });
});
