# [linuxacademy-download-chrome](https://github.com/neotan/linuxacademy-download-chrome)
A JavaScript for extracting videos (.m3u8) and subtitles (.vtt) URLs from linuxacademy.com

## Usage

1. Make sure `ffmpeg.exe` and `wget.exe` are installed and set in the `path` of OS, i.e. can get info. by running `ffmpeg -version` and `wget -version` in terminal or cmd.
1. Log-in and open a course, e.g. https://linuxacademy.com/cp/modules/view/id/245
1. Run the script in the `Console` or `Sources` tab of `Chrome DevTools` (by pressing `F12`)
1. The result will be shown in the console, including: 
    * cmd for downloading `Videos` with 'ffmpeg'
    * cmd for downloading `Subtitles` with 'wget'
    * cmd for marking all `Lessons` completed
1. Copy and save one of above cmd to a bash file, e.g. `get.sh`
1. Execute `./get.sh` to start downloading

## Note
`&&` in the cmd means executing commands **line by line (Recommanded)**, revise it to `&` will execute commands in **parallel**.  
