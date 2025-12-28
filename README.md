# 🎨 SillyTavern Login Theme Manager

让SillyTavern的登录界面变得更加精彩！这个插件允许用户轻松切换和分享登录页面主题。

## ✨ 功能特性

- 🎭 **一键切换主题** - 在多个登录主题之间轻松切换
- 📥 **导入主题** - 从CSS文件导入其他作者分享的主题
- 📤 **导出主题** - 分享你自己的主题给其他用户
- 🗑️ **管理主题** - 删除不需要的主题
- 💾 **自动备份** - 自动备份原始登录样式

## 📦 安装

### 方法一：直接复制

1. 下载此插件文件夹
2. 将整个 `SillyTavern-LoginThemes` 文件夹复制到你的 SillyTavern 安装目录下的 `plugins` 文件夹中
3. 在 `config.yaml` 中启用服务器插件：
   ```yaml
   enableServerPlugins: true
   ```
4. 重启 SillyTavern

### 方法二：Git Clone

```bash
cd /path/to/SillyTavern/plugins
git clone https://github.com/your-username/SillyTavern-LoginThemes.git login-themes
```

## 🔧 使用方法

### API 端点

插件会在 `/api/plugins/login-themes/` 下创建以下API端点：

| 端点 | 方法 | 描述 |
|------|------|------|
| `/list` | GET | 获取所有可用主题列表 |
| `/current` | GET | 获取当前使用的主题 |
| `/apply` | POST | 应用指定主题 |
| `/import` | POST | 导入新主题 |
| `/delete/:themeId` | DELETE | 删除主题 |
| `/export/:themeId` | GET | 导出主题 |

### 使用示例

#### 获取主题列表
```javascript
const response = await fetch('/api/plugins/login-themes/list');
const data = await response.json();
console.log(data.themes); // 主题列表
console.log(data.currentTheme); // 当前主题ID
```

#### 切换主题
```javascript
await fetch('/api/plugins/login-themes/apply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ themeId: 'cafeteria' })
});
// 刷新页面即可看到新主题
location.reload();
```

#### 导入主题
```javascript
const cssContent = `/* Your theme CSS */
body.login { ... }`;

await fetch('/api/plugins/login-themes/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        name: 'My Cool Theme',
        css: cssContent,
        metadata: {
            author: 'Your Name',
            description: 'A cool theme description',
            version: '1.0.0'
        }
    })
});
```

## 🎨 创建主题

### 主题文件格式

主题是一个标准的CSS文件，需要以 `body.login` 作为选择器前缀来确保只影响登录页面。

```css
/**
 * @name 我的主题名称
 * @author 作者名
 * @description 主题描述
 * @version 1.0.0
 */

body.login {
    /* 你的样式 */
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

body.login #dialogue_popup {
    /* 登录框样式 */
    background: rgba(255, 255, 255, 0.9);
    border-radius: 20px;
}

/* 更多样式... */
```

### 主题元数据

在CSS文件开头使用注释标记元数据：
- `@name` - 主题显示名称
- `@author` - 作者名
- `@description` - 主题描述
- `@version` - 版本号

### 分享主题

1. 创建你的主题CSS文件
2. 在开头添加元数据注释
3. 将CSS文件分享给其他用户
4. 其他用户使用导入功能添加主题

## 📁 文件结构

```
SillyTavern-LoginThemes/
├── index.js          # 主插件文件
├── package.json      # 包信息
├── config.json       # 运行时配置（自动生成）
├── README.md         # 说明文档
└── themes/           # 主题文件夹
    ├── _original_backup.css  # 原始样式备份
    ├── cafeteria.css         # 食堂主题
    ├── cyberpunk.css         # 赛博朋克主题
    └── ...
```

## 🛡️ 安全说明

- 只导入来自可信来源的主题
- 主题CSS在应用前不会被执行任何JavaScript
- 插件会自动备份原始登录样式

## 🤝 贡献

欢迎提交PR来添加新功能或分享你的主题！

### 提交主题

1. Fork 这个仓库
2. 将你的主题CSS添加到 `themes/` 文件夹
3. 提交 Pull Request

## 📄 许可证

MIT License

---

Made with ❤️ for the SillyTavern Community
