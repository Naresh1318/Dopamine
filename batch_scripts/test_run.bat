C:\BCI2000.x64\prog\operator.exe --OnConnect "-LOAD PARAMETERFILE ../parms/examples/CursorTask_SignalGenerator.prm; SETCONFIG" ^
             --OnSetConfig "-SET STATE Running 1"  ^
             --OnSuspend "-QUIT"