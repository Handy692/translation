# 英语翻译练习 Web 应用 v3.0

一个功能完整的英语翻译练习Web应用，支持文件上传、多种练习模式、AI评价、单词本管理和PWA安装。

## 项目简介

英语翻译练习是一个纯前端实现的Web应用，旨在帮助用户提高英语翻译能力。应用支持上传Word文档进行练习，提供分句练习和整篇练习两种模式，并集成AI评价功能对翻译结果进行智能评估。

## 主要功能特性

### 1. 文件上传
- 支持上传Word文档（.docx格式）
- 自动解析文档内容
- 文档预览功能

### 2. 文档选择
- 显示已上传的文档列表
- 支持选择要练习的文档
- 文档信息展示

### 3. 练习模式
- **分句练习模式**：逐句翻译，支持上一句/下一句导航
- **整篇练习模式**：一次性完成整篇文章翻译

### 4. AI评价系统
- 智能翻译质量评估
- 语法和用词建议
- 翻译准确性评分
- 详细的内容校对

### 5. 结果展示
- 原文与译文对照显示
- AI评价结果展示
- PDF生成和下载功能
- 排除单词详情的优化PDF布局

### 6. 翻译历史
- 保存所有翻译记录
- 按时间排序
- 支持查看历史练习结果

### 7. 单词本功能
- 收集练习中遇到的生词
- 分页显示（每页9个单词）
- 页面跳转功能
- 单词详情查看

### 8. PWA支持
- 可安装为独立应用
- 离线功能支持
- 跨平台兼容（支持Microsoft Edge等浏览器）
- 自定义应用图标

## 技术栈

- **前端框架**：纯HTML5 + CSS3 + JavaScript
- **样式**：CSS3（Flexbox + Grid布局）
- **PDF生成**：html2canvas.js
- **翻译API**：MyMemory Translation API
- **PWA**：Service Worker + Web App Manifest
- **图标**：多尺寸PNG图标（72x72到512x512）

## 安装和运行

### 环境要求
- 现代浏览器（推荐Microsoft Edge、Chrome、Firefox）
- Python 3.x（用于本地服务器）

### 快速启动

1. 克隆或下载项目到本地

2. 启动本地服务器：
```bash
cd translation
python -m http.server 8000
```

3. 在浏览器中打开：
```
http://localhost:8000
```

## 使用说明

### 基本流程

1. **上传文档**
   - 点击"上传文件"按钮
   - 选择Word文档（.docx格式）
   - 等待文档解析完成

2. **选择文档**
   - 在文档列表中选择要练习的文档
   - 查看文档预览信息

3. **选择练习模式**
   - 分句练习：适合逐句精练
   - 整篇练习：适合整体翻译练习

4. **开始练习**
   - 根据练习模式输入翻译
   - 分句模式可使用"上一句"/"下一句"导航
   - 完成后点击"提交评价"

5. **查看结果**
   - 查看AI评价结果
   - 浏览原文与译文对照
   - 下载PDF存档

6. **管理单词本**
   - 查看收集的生词
   - 使用分页导航浏览
   - 输入页码快速跳转

### PWA安装指南

#### 在Microsoft Edge中安装

1. 在Edge浏览器中打开应用
2. 点击地址栏右侧的"安装应用"图标（📥）
3. 在弹出的对话框中点击"安装"
4. 应用将作为独立应用安装到系统中

#### 安装后的功能

- 作为独立窗口运行
- 添加到开始菜单
- 支持离线访问
- 自定义应用图标

## 文件结构

```
translation/
├── index.html                      # 主页
├── 1_upload.html                   # 文件上传页面
├── 2_document_selection.html       # 文档选择页面
├── 3_mode_selection.html           # 练习模式选择页面
├── 4_sentence_practice.html        # 分句练习页面
├── 4_passage_practice.html         # 整篇练习页面
├── 4_evaluation.html               # AI评价页面
├── 4_result.html                   # 结果展示页面
├── translation-history.html        # 翻译历史页面
├── wordbook.html                   # 单词本页面
├── styles.css                      # 全局样式
├── script.js                       # 核心JavaScript
├── config.js                       # 配置文件
├── enhanced-translation.js         # 增强翻译功能
├── mymemory-translation.js         # MyMemory API集成
├── html2canvas.min.js              # PDF生成库
├── manifest.json                   # PWA配置文件
├── service-worker.js               # Service Worker
├── 404.html                        # 404错误页面
├── .gitignore                      # Git忽略文件
└── icons/                          # 应用图标目录
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    ├── icon-512x512.png
    └── icon.svg
```

## 版本历史

### v3.0（当前版本）
- ✨ 新增PWA支持，可安装为独立应用
- ✨ 添加自定义应用图标
- ✨ 优化PDF生成功能，排除单词详情部分
- ✨ 改进分页导航，支持页面跳转
- 🐛 修复文件上传导航问题
- 🐛 修复PDF布局问题
- 📱 响应式设计优化

### v2.0
- ✨ 新增分句练习模式
- ✨ 新增整篇练习模式
- ✨ 集成AI评价功能
- ✨ 添加翻译历史记录
- ✨ 实现单词本功能

### v1.0
- 🎉 初始版本发布
- ✨ 基础文件上传功能
- ✨ 文档选择功能
- ✨ 基础翻译功能

## 浏览器兼容性

- Microsoft Edge（推荐）✅
- Google Chrome ✅
- Mozilla Firefox ✅
- Safari ✅

## 注意事项

1. **文件格式**：目前仅支持.docx格式的Word文档
2. **网络连接**：AI评价功能需要网络连接
3. **本地存储**：使用LocalStorage保存数据，清除浏览器缓存会丢失数据
4. **PWA功能**：需要HTTPS或localhost环境才能正常使用PWA功能

## 许可证

本项目仅供学习和个人使用。

## 联系方式

如有问题或建议，欢迎反馈。

---

**英语翻译练习 v3.0** - 让翻译学习更高效！
