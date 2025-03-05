# 媒体提示库（Media Prompt Gallery）
## 项目概述
媒体提示库是一个用于存储和管理媒体文件（图片和视频）及其相关提示词的应用程序。该应用允许用户上传媒体文件，添加AI提示词，并在一个美观的画廊中查看和管理这些内容。

## 功能特点
- 支持图片和视频文件上传
- 为每个媒体文件添加AI提示词
- 指定使用的AI模型
- 在画廊中查看所有媒体文件
- 编辑和删除已上传的媒体项
- 使用IndexedDB在浏览器本地存储数据
- 响应式设计，适配各种设备屏幕
## 技术栈
- 前端框架 : React + TypeScript
- 构建工具 : Vite
- 样式 : Tailwind CSS
- 图标 : Lucide React
- 存储 : IndexedDB
## 安装与运行
### 前提条件
- Node.js (v14+)
- npm 或 yarn
### 安装步骤
1. 克隆仓库
```bash
git clone https://github.com/yourusername/UploadMedia.git
cd UploadMedia
 ```
```

2. 安装依赖
```bash
npm install
 ```

或

```bash
yarn
 ```

3. 启动开发服务器
```bash
npm run dev
 ```

或

```bash
yarn dev
 ```

4. 打开浏览器访问 http://localhost:5173
## 使用指南
1. 点击上传区域或拖放文件来添加图片或视频
2. 为上传的媒体添加AI提示词
3. 选择使用的AI模型（可选）
4. 点击保存按钮将媒体项添加到画廊
5. 在画廊中查看、编辑或删除媒体项

## 项目结构
```plaintext
UploadMedia/
├── public/
├── src/
│   ├── components/       # React组件
│   │   ├── MediaGallery.tsx  # 媒体画廊组件
│   │   ├── UploadForm.tsx    # 上传表单组件
│   ├── context/          # React上下文
│   │   ├── MediaContext.tsx  # 媒体数据管理上下文
│   ├── styles/           # 样式文件
│   ├── types.ts          # TypeScript类型定义
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # 应用入口点
│   └── index.css         # 全局样式
├── .gitignore
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
 ```
```

## 贡献指南
1. Fork 仓库
2. 创建功能分支 ( git checkout -b feature/amazing-feature )
3. 提交更改 ( git commit -m 'Add some amazing feature' )
4. 推送到分支 ( git push origin feature/amazing-feature )
5. 创建Pull Request
## 许可证
MIT
