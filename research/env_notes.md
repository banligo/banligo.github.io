---
title: "Computer Environment Setup Notes (Mac)"
layout: article
---


### VS code

`Cmd + Shift + P` Open Command Palette <br>

For LaTeX:

`control+option+J` forward search <br>
`double click` or `command+click` backward search <br>



### Server

**Linux Using**

`pwd` get current directory <br>
`ls` check files in current directory <br>
`scp username@server:$(pwd)/filename .` <br>
`cd` back to home <br>
`cd ..` back to parent directory <br>
`cd ../..` back to grandparent directory <br>
`tree` view directory structure <br>
`cp file1 file2` copy file1 to file2 <br>
`rm file.py` delete file.py <br>
`mkdir newdir` create a new directory <br>
`readlink -f filename.py` get absolute path of filename.py

**Keyboard Shortcuts**
`Tab` autocomplete file/directory names <br>
`Ctrl + A` to initial selection <br>
`Ctrl + E` to end selection <br>
`Ctrl + U` to delete from initial selection to cursor <br>
`Ctrl + K` to delete from cursor to end of line <br>
`Ctrl + L` clear


#### CfCA

VPN: heyn @=*2R$pKn#k7

`% ssh -L 9077:localhost:9077 heyn@an09.cfca.nao.ac.jp` connect to server

`% scp -r /path/to/local/project heyn@an09.cfca.nao.ac.jp:/home/heyn/project` upload local file to server

`% source myenv/bin/activate`  activate env

`% scp heyn@an09.cfca.nao.ac.jp:/home/heyn/project/results/*.png /path/to/local/folder/` download resultsback to local

scp -r /Users/yingqiu/Desktop/master1/05research/02_phase_correlation/step_0.py heyn@an09.cfca.nao.ac.jp:/home/heyn/tryit/02_phase_correlation
scp heyn@an09.cfca.nao.ac.jp:/home/heyn/tryit/02_phase_correlation/figure_output/Pk_N512_b1000_fNL10_20250828.pdf /Users/yingqiu/Desktop/Downloads

`jupyter lab --no-browser --port=9077`

Connect to your server via Remote SSH in VS Code
- `Cmd+Shift+P` type and select Remote-SSH: Connect to Host...
    - Enter your server SSH address: heyn@an.cfca.nao.ac.jp
    - Type: Python: Select Interpreter 可以换环境

