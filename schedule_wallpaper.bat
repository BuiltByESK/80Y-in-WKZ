@echo off
echo 80Y-in-Weeks Life Calendar Wallpaper - Task Scheduler Setup

:: Check for admin rights and self-elevate if needed
NET SESSION >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Administrative privileges required...
    echo A UAC prompt will appear requesting administrator permissions.
    echo.
    powershell -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

echo Setting up scheduled task for 80Y-in-Weeks Life Calendar Wallpaper

:: Get the current directory where the script is located
set SCRIPT_DIR=%~dp0
set SCRIPT_PATH=%SCRIPT_DIR%80Y-in-Weeks.js

:: Create XML file for the task with run-at-login-if-missed behavior
echo Creating XML task definition...
(
echo ^<?xml version="1.0" encoding="UTF-16"?^>
echo ^<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task"^>
echo   ^<RegistrationInfo^>
echo     ^<Description^>Updates the 80Y-in-Weeks life calendar wallpaper^</Description^>
echo   ^</RegistrationInfo^>
echo   ^<Triggers^>
echo     ^<CalendarTrigger^>
echo       ^<StartBoundary^>2023-01-01T00:00:00^</StartBoundary^>
echo       ^<Enabled^>true^</Enabled^>
echo       ^<ScheduleByWeek^>
echo         ^<DaysOfWeek^>
echo           ^<Monday /^>
echo         ^</DaysOfWeek^>
echo         ^<WeeksInterval^>1^</WeeksInterval^>
echo       ^</ScheduleByWeek^>
echo     ^</CalendarTrigger^>
echo     ^<LogonTrigger^>
echo       ^<Enabled^>true^</Enabled^>
echo     ^</LogonTrigger^>
echo   ^</Triggers^>
echo   ^<Principals^>
echo     ^<Principal id="Author"^>
echo       ^<LogonType^>InteractiveToken^</LogonType^>
echo       ^<RunLevel^>LeastPrivilege^</RunLevel^>
echo     ^</Principal^>
echo   ^</Principals^>
echo   ^<Settings^>
echo     ^<MultipleInstancesPolicy^>IgnoreNew^</MultipleInstancesPolicy^>
echo     ^<DisallowStartIfOnBatteries^>false^</DisallowStartIfOnBatteries^>
echo     ^<StopIfGoingOnBatteries^>false^</StopIfGoingOnBatteries^>
echo     ^<AllowHardTerminate^>true^</AllowHardTerminate^>
echo     ^<StartWhenAvailable^>true^</StartWhenAvailable^>
echo     ^<RunOnlyIfNetworkAvailable^>false^</RunOnlyIfNetworkAvailable^>
echo     ^<IdleSettings^>
echo       ^<StopOnIdleEnd^>true^</StopOnIdleEnd^>
echo       ^<RestartOnIdle^>false^</RestartOnIdle^>
echo     ^</IdleSettings^>
echo     ^<AllowStartOnDemand^>true^</AllowStartOnDemand^>
echo     ^<Enabled^>true^</Enabled^>
echo     ^<Hidden^>false^</Hidden^>
echo     ^<RunOnlyIfIdle^>false^</RunOnlyIfIdle^>
echo     ^<WakeToRun^>false^</WakeToRun^>
echo     ^<ExecutionTimeLimit^>PT72H^</ExecutionTimeLimit^>
echo     ^<Priority^>7^</Priority^>
echo   ^</Settings^>
echo   ^<Actions Context="Author"^>
echo     ^<Exec^>
echo       ^<Command^>node^</Command^>
echo       ^<Arguments^>"%SCRIPT_PATH%"^</Arguments^>
echo     ^</Exec^>
echo   ^</Actions^>
echo ^</Task^>
) > "%TEMP%\80Y-in-Weeks_Task.xml"

:: Register the task from the XML file
echo Creating weekly scheduled task to run on Monday at midnight (and at login if missed)...
schtasks /Create /TN "80Y-in-Weeks Life Calendar Wallpaper" /XML "%TEMP%\80Y-in-Weeks_Task.xml" /F

:: Clean up the temporary XML file
del "%TEMP%\80Y-in-Weeks_Task.xml"

echo.
echo Task scheduled successfully!
echo Your life calendar wallpaper will:
echo  - Update automatically each Monday at midnight
echo  - Run at login if the computer was off during scheduled time
echo.
echo Press any key to exit...
pause > nul 