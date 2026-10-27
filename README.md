# Logsite

Yingqiu 的个人网站，使用 Jekyll 构建。

## 个人主页

- `index.html`：板栗标识、姓名与研究关键词、邮箱、教育背景、奖项资助及学术成果；中文标题为主。
- `_includes/study-content.md`：学习、论文、会议和报告记录，修改这里会更新独立的 `/study/` 页面。
- `_data/navigation.yml`：Diary 等文章页的导航；主页与 Study 共用 `_layouts/profile.html` 中的导航。
- `assets/css/profile.css`：主页、Study、日记共用的视觉样式。
- `_sass/custom.scss`：旧版归档等遗留页面的样式，日记已不再使用。
- `/study/` 为详细学习与研究记录；`/about.html` 跳转到首页个人介绍。
- `assets/documents/CV-贺迎秋.pdf`：公开简历；替换同名文件即可更新。
- `/seamshift/`：十关随机几何与拓扑解谜游戏，入口位于首页“实习与项目经历”；开发、测试和数学规则见 [README-SEAMLOOM.md](README-SEAMLOOM.md)。

## Diary 入口与更新

首页不显示 Diary 按钮，顶部导航也不显示 Diary。

**进入方法：滚动到任意页面最底部，点击版权行最前面的 `©` 符号。**
也可以收藏 `https://banligo.github.io/diary/`，直接进入。

- `_diary/`：日记正文，新日记可省略 layout；如需显式指定，请使用 `layout: diary`。
- `_layouts/diary.html`：日记正文布局，含长文目录和返回链接。
- `_layouts/diary-index.html`：日记目录布局。
- `_pages/diary.md`：按年份分组的日记目录。增加日记后，在相应列表中加上链接，使用 `/diary/文件名.html`。
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

首页暂时下线：`_config.yml` 的 `exclude` 中加入了 `/index.html`，构建不会发布根首页，根地址由 `404.html` 返回 404；`/seamshift/` 游戏照常发布。恢复首页时删除这一条排除配置即可，首页源码未删除。
