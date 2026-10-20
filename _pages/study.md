---
title: 学习与研究
layout: profile
permalink: /study/
---
<header class="study-heading">
  <a class="back-link" href="{{ '/' | relative_url }}">← 返回主页</a>
  <h1>学习与研究</h1>
  <p>论文、学位论文、课程笔记，以及会议与讨论会记录。</p>
  <nav class="study-index" aria-label="页面目录">
    <a href="#papers">论文</a>
    <a href="#theses">学位论文</a>
    <a href="#notes">课程笔记</a>
    <a href="#conferences">会议</a>
    <a href="#seminars">讨论会</a>
  </nav>
</header>
<div class="study-content">
  {% capture study_content %}{% include study-content.md %}{% endcapture %}
  {{ study_content | markdownify }}
</div>
