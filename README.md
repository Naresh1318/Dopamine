# Dopamine
A desktop app providing a easy to use wrapper on top of OpenVibe  to perform BCI experiments.

<p align=center>
    <img src="https://raw.githubusercontent.com/Naresh1318/Dopamine/master/resources/icons/icon.png" alt="Dopamine"/>
    <p align="center"> <b>BCIs for classrooms</b> </p>
</p>

<p align=center>
  <img src="https://github.com/Naresh1318/Dopamine/raw/master/README/ui_gif.gif" alt="Cover" style="width: 100px;"/>
    <p align="center"> <b>Screenhot</b> </p>
</p>


## Installation

### Prerequisite
1. Download and install Openvibe version 2.2 from [here](https://drive.google.com/open?id=1D66xB06bcuZwnd9uICdfH7yiSbR6pAmF). Make sure not to change the default installation steps.

2. Install your headset acquisition software. For Cognionics headsets install the acquisition software from [here](https://drive.google.com/open?id=15Mh59hJcAcmPncSCMVl-nhWGIjcorBjC).

### Install
1. Download the latest version of Dopamine from [here](https://github.com/Naresh1318/Dopamine/releases).

2. Connect your BCI headset to your PC, check impedance and all that fun stuff.

3. Start an LSL stream from your Headset application. If your manufacturer does not support LSL look [here](https://github.com/sccn/labstreaminglayer).

4. If you have a cognionics headset follow instructions from [here](https://drive.google.com/file/d/1oV1uiYXO0vl_Lwl3DB1Nc3sIiC0FgPPY/view?usp=sharing) to get started!


## Build

### Prerprerequisiteeq
Install prerequisites mentioned above.

### Running and packaging 

1. Install node.js along with npm. Tested on node v11.8.0 and npm 6.5.0

2. Open up command prompt or powershell. Do not use the WSL terminal.

3. Clone this repo and install dependencies:
```bash
git clone https://github.com/Naresh1318/Dopamine
cd Dopamine
npm install
```

4. Run Dopamine:

```bash
npm start
```

5. Build Dopamine into an executable:
```bash
npm run package-win
```

6. The previous command would have created a `Dopamine-win32-x64` directory under the project root directory. Copy and paste `batch_scripts`
and `openvibe_scenarios` directories from project root to `Dopamine-win32-x64` directory.

7. Double click on Dopamine.exe under `Dopamine-win32-x64` to run the built project.


## Built Using
1. Electron.js
2. Node.js
3. Vue.js
