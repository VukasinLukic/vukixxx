@echo off
echo Setting up VukiXX autostart...
set STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
copy /Y "c:\Vukixxx\vukixx-mcp\start-mcp.bat" "%STARTUP%\vukixx-mcp.bat"
echo Done. VukiXX MCP will start with Windows.
