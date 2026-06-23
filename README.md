<h1 align="center">RootWords · 词根记单词</h1>

<p align="center">
  基于 UniApp + Vue 3 的 IELTS 常见词根词汇记忆工具<br>
  支持 H5 浏览器和微信小程序
</p>

---

## 简介

 **RootWords** 是一个帮助记忆英语词根词汇的轻量应用。通过将 253 个常见词根按词根归类、展示构词法（前缀/词根/后缀）、提供单词读音和记忆测试，帮助学习者理解单词的内在逻辑，从而更高效地扩充词汇量。

项目覆盖 253 个常见词根（spect、dict、port、struct 等），收录 1307 个相关词汇，每个词条包含词性、构词成分、中文释义、英文例句、中文翻译和音标。

## 功能

| 页面 | 功能 |
|------|------|
| **首页**（词根列表） | 卡片网格展示所有词根，显示词根、释义、词源、单词数量和进度条。进度条随记忆测试结果着色（浅灰 → 浅红 → 浅绿）。 |
| **词根详情** | 展示单个词根的图标、前后缀列表、所有单词的释义、构词拆解、音标、例句及对应中文翻译。支持单词和例句的 TTS 朗读。上一页/下一页切换词根。 |
| **记忆测试** | 当前词根的四选一选择题模式。单词以随机顺序出现，选择答案后即时显示正确/错误标记。完成后展示得分、正确率、鼓励语，并提供"再试一次"和"返回"按钮。 |

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | [Vue 3](https://vuejs.org/) (Composition API + `<script setup>`) |
| 跨端 | [UniApp 3](https://uniapp.dcloud.net.cn/) |
| 构建 | [Vite 5](https://vitejs.dev/) + `@dcloudio/vite-plugin-uni` |
| 语音 | Web Speech API (H5) / TTS 占位 (小程序) |
| 存储 | localStorage（记忆测试进度持久化） |
| 目标 | H5 浏览器 · 微信小程序 |

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装 & 启动

```bash
# 进入项目目录
cd rootwords-uni

# 安装依赖
npm install --legacy-peer-deps

# 启动 H5 开发服务器（默认 http://localhost:5173）
npm run dev:h5

# 构建 H5 生产版本
npm run build:h5

# 微信小程序开发（需先配置 manifest.json 中的 appid）
npm run dev:mp-weixin
npm run build:mp-weixin
```

> 微信小程序模式下，TTS 朗读功能需要额外接入音频文件或后端 TTS 服务。

## 项目结构

```
rootwords-uni/
├── src/
│   ├── pages/
│   │   ├── index/          # 首页 — 词根列表卡片网格
│   │   │   └── index.vue
│   │   ├── detail/         # 词根详情 — 单词列表 + 构词拆解
│   │   │   └── detail.vue
│   │   └── quiz/           # 记忆测试 — 四选一答题
│   │       └── quiz.vue
│   ├── utils/
│   │   ├── data.js         # 词根 & 单词数据源
│   │   ├── progress.js     # 记忆测试进度存储 (localStorage)
│   │   └── speech.js       # 跨平台 TTS 朗读封装
│   ├── App.vue
│   ├── main.ts
│   ├── pages.json          # 页面路由 & 导航栏配置
│   ├── manifest.json       # UniApp 应用配置
│   └── uni.scss            # 全局样式变量
├── index.html              # H5 入口
├── vite.config.cjs         # Vite 配置
├── tsconfig.json
├── package.json
└── README.md
```

## 数据格式

每条词根数据的结构如下：

```json
{
  "root": "spect",
  "meaning": "看，观察",
  "origin": "拉丁语 specere",
  "icon": "🔭",
  "affixes": [
    ["prefix", "in-", "向内"],
    ["suffix", "-ator", "…者"]
  ],
  "words": [
    [
      "inspect",           // 单词
      "v.",                // 词性
      ["in-", "spect"],    // 构词成分
      "检查，审视",        // 中文释义
      "The building was...", // 英文例句
      "/ɪnˈspekt/",        // 音标
      "这座建筑..."         // 例句中文翻译
    ]
  ]
}
```

## License

MIT
