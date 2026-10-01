# 给 AI 的提示词

把下面任意一段连同 `starter/data.json`（或其中一部分）一起交给 AI。按你的想法改就行。

风格不用跟现在的网站一样，`tokens.css` 只是参考。试试在提示词里加一句「风格：赛博朋克 / 像素游戏 / 日系杂志 / 水彩手账 / 极简黑白……」。

## 重做首页

> 我要为「蓝色大肥鱼.com」设计一个新首页。这是一个收录 AI 娘二创作品的网站：DeepSeek 娘、Claude 娘、通义千问娘等 AI 模型的拟人化表情包、梗图、插画、设定图和漫画。
> 附件 data.json 是网站的真实数据（角色、分类、作品）。风格请自由发挥，不用沿用现在的网站。
> 请写一个单文件 `index.html`：用 `<script src="../../starter/data.js">` 读取 `window.SITE_DATA`，展示作品，图片用数据里的 `thumb` 地址。所有路径用相对路径。

## 角色页

> 为「蓝色大肥鱼.com」设计一个角色页。每个角色有自己的代表色（tokens.css 里的 `--art-<角色id>-a` 和 `--art-<角色id>-b`）。
> 页面先列出全部角色，点进某个角色后显示 TA 的作品。数据来自 `window.SITE_DATA`。

## 换一种风格

> 现在的网站是「网格纸 + 白纸卡片 + 手绘墨线」风格。请保留数据和功能，换成你觉得更适合 AI 娘二创站的风格，并说明为什么这样设计。

## 数据结构速查

```text
characters[]  id, name, aliases[], colorSoft, colorDeep
categories[]  id, name, description          （meme 梗图 / illustration 插画 / setting 设定图 / comic 漫画）
works[]       slug, name, description, commentary, characterId, categoryIds[], tags[],
              width, height, createdAt, thumb, large, original, page
```

`thumb` 是列表用的小图，`large` 是查看用的大图，`original` 是原图，`page` 是该作品在正式站的地址。
