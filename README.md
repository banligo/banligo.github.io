# Logsite

Yingqiu 的个人网站，使用 Jekyll 构建。

## 一页式首页

- `index.html`：Hello、Study、About 三个区域。
- `_includes/study-content.md`：学习、论文、会议和报告记录，修改这里会更新首页 Study。
- `_data/navigation.yml`：顶部锚点导航。
- `_sass/custom.scss`：首页与网站的自定义样式。
- 原 `/study/`、`/about.html` 地址会跳转到首页相应区域。

## Diary 入口与更新

首页不显示 Diary 按钮，顶部导航也不显示 Diary。

**进入方法：滚动到任意页面最底部，点击版权行最前面的 `©` 符号。**
也可以收藏 `https://banligo.github.io/diary/`，直接进入。

- `_diary/`：原有日记文件，仍在原位置。
- `_pages/diary.md`：日记目录。增加日记后，在这里加上链接。
- `assets/images/`、`assets/documents/`：图片和附件。
- 日记页面带有 `noindex, nofollow`，且不列入站点地图；搜索引擎是否及何时移除旧收录由搜索引擎决定。
- 这是低调入口，没有登录或密码保护。知道网址的人仍可访问；公开 GitHub 仓库中也能看到日记原文。

此前创建的 `banligo/diary-private` 仅作为一次性私有备份保留，不是当前入口，也不会自动同步。
本地 `.private/` 已被 Git 和 Jekyll 排除。

## 本地预览与发布

```sh
bundle install
bundle exec jekyll serve --host 127.0.0.1
```

打开 `http://127.0.0.1:4000`。

修改完成后，提交并推送到公开仓库的 `master` 分支，GitHub Pages 会重新构建网站。
