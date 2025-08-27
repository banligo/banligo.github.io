---
title: "Computer Environment Setup Notes (Mac)"
layout: article
---

### Server

ssh -L 9001:localhost:9001 heyn@an.cfca.nao.ac.jp

jupyter lab --no-browser --port=9001

Connect to your server via Remote SSH in VS Code
- Press Cmd+Shift+P (or Ctrl+Shift+P on Windows) → type and select Remote-SSH: Connect to Host...
    - Enter your server SSH address: heyn@an.cfca.nao.ac.jp
    - Type: Python: Select Interpreter 可以换环境


### VS code

- `Shift + Command + P` Open Command Palette

For LaTeX:

- `control+option+J` forward search

- `double click` or `command+click` backward search

