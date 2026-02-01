@echo off
call npm test run tests/integration/dashboard.test.tsx > test-output.txt 2>&1
echo Done >> test-output.txt
