:: Train xDAWN
C:\"Program Files"\openvibe-2.2.0-64bit\openvibe-designer.cmd --no-gui ^
                    --play="C:\Users\%USERNAME%\AppData\Roaming\openvibe-2.2.0\scenarios\bci-examples\p300-speller-xDAWN\p300-xdawn-2-train-xDAWN.xml"

:: Train LDA Classifier
C:\"Program Files"\openvibe-2.2.0-64bit\openvibe-designer.cmd --no-gui ^ 
                    --play="C:\Users\%USERNAME%\AppData\Roaming\openvibe-2.2.0\scenarios\bci-examples\p300-speller-xDAWN\p300-xdawn-3-train-classifier.xml"
