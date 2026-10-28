@echo off
cd /d "%~dp0\.."
set PYTHONPATH=.
echo Running Urban Infrastructure Intelligence Test Suite ...
.\venv\Scripts\python.exe -m pytest backend/tests/test_core.py -v
pause
