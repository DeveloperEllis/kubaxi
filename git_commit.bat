@echo off
set /p commit_msg="Introduce el mensaje de commit (ENTER para terminar): "

echo.
echo === Comandos a ejecutar ===
echo git add .
echo git commit -m "%commit_msg%"
echo git push developerellis main
echo ===========================
echo.

git add .
git commit -m "%commit_msg%"
git push developerellis main

echo.
echo Proceso de Git completado con mensaje: %commit_msg%
pause