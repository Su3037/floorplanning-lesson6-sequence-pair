<p class="eyebrow">学习记录</p>

## 我的学习记录

记录只保存在这台设备的这个浏览器里。换设备或清除浏览数据前，请先导出。

```html
<div id="progress-root"><p class="muted">正在读取记录…</p></div>
<div class="btn-row" style="margin-top:18px">
<button class="btn primary" type="button" id="export">导出记录（JSON）</button>
<label class="btn" for="import">导入记录…</label><input id="import" type="file" accept="application/json,.json" class="sr-only">
<button class="btn quiet" type="button" id="clear">清除本机记录</button>
</div>
<p id="import-msg" class="small" role="status" aria-live="polite"></p>
```

### 关于教师平台上的进度

教师课程平台在另一个域名下，浏览器不允许本课读取它的存储，所以**不会自动迁移**旧进度。导入只接受本课导出的 JSON（schemaVersion 1），会检查文件大小、版本和题目编号，不认识的字段会被丢弃。
