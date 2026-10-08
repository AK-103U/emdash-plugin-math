<p align="center">
  <img src="logo.svg" alt="KaTeX" width="300">
</p>

<h1 align="center">emdash-plugin-math</h1>

<p align="center">
  中文 · <a href="README_en.md">English</a>
</p>

---

# 中文

本插件为 EmDash CMS 增加 LaTeX 公式渲染。插件使用 KaTeX，并在服务端渲染公式。

## 功能

插件提供三项功能。

- **服务端渲染。** Astro 组件在构建时或请求时运行 KaTeX。页面直接输出 HTML。公式不依赖客户端 JavaScript。
- **可复制。** 读者选中公式并复制，得到 LaTeX 源码。没有这项处理时，复制结果是散乱的字符。
- **可换主题。** 插件提供五种语义色调，并开放 `--emdash-math-*` CSS 变量。主题覆盖这些变量，即可改变全站公式的外观。

LaTeX 写错时，插件显示原始源码。插件不留空白，也不显示乱码。

## 环境要求

- EmDash 1.2.0 或更高版本
- Astro 7.3.0 或更高版本

## 安装

本插件是 native 插件。native 插件从 npm 安装，并在 `astro.config.mjs` 中注册。

只安装依赖不会启用插件。你必须修改 Astro 配置。

第 1 步：安装包。

```bash
pnpm add @ak-103u/emdash-plugin-math
```

第 2 步：在 `astro.config.mjs` 中注册插件。

```typescript title="astro.config.mjs"
import { defineConfig } from "astro/config";
import emdash from "emdash/astro";
import { mathPlugin } from "@ak-103u/emdash-plugin-math";

export default defineConfig({
	integrations: [
		emdash({
			// native 插件放入 plugins 数组。不要放入 sandboxed 数组。
			plugins: [mathPlugin()],
		}),
	],
});
```

第 3 步：重新部署站点。

## 为什么必须是 native 插件

一个自定义 Portable Text 块需要两个部分：编辑器定义，以及 Astro 渲染组件。

只有 native 插件能提供 Astro 组件。宿主站点构建时必须导入该组件。沙箱插件能用 Block Kit 描述编辑器界面，但不能提供渲染组件。

native 插件不能发布到 EmDash registry。请从 npm 安装本插件。

## 配置项

把配置项传给 `mathPlugin()`。插件通过 `page:fragments` 钩子把配置写入页面。

| 配置项 | 类型 | 默认值 | 作用 |
| --- | --- | --- | --- |
| `copyable` | `boolean` | `true` | 读者复制公式时，改写剪贴板内容。禁止复制的站点请设为 `false`。 |
| `copyDelimiters` | `boolean` | `false` | 在复制的 LaTeX 两端加 `$…$` 或 `$$…$$`。这样粘贴到 Markdown 中可直接作为公式使用。 |
| `copyButton` | `boolean` | `true` | 鼠标悬停时显示复制按钮。 |
| `tones` | `MathTone[]` | 全部 | 编辑器色调选择器中提供的色调。限制此列表可让作者只使用主题允许的配色。 |

```typescript
mathPlugin({
	copyDelimiters: true,
	tones: ["none", "accent"],
});
```

## 换主题

在主题的 CSS 中覆盖自定义属性。插件不使用 `!important`，因此同等优先级的规则即可生效。

```css
:root {
	--emdash-math-radius: 0;
	--emdash-math-margin: 2rem;
	--emdash-math-tag-color: var(--color-brand);
}

/* 为每种色调指定主题自己的配色 */
.emdash-math[data-tone="accent"] {
	--emdash-math-bg: light-dark(#eff6ff, #172554);
	--emdash-math-border: light-dark(#bfdbfe, #1e40af);
}
```

可用的属性：`--emdash-math-bg`、`--emdash-math-border`、`--emdash-math-color`、`--emdash-math-padding`、`--emdash-math-radius`、`--emdash-math-margin`、`--emdash-math-tag-color`。

主题定义了 EmDash 自己的变量时，插件使用这些变量（`--color-fill`、`--color-border`、`--color-muted`、`--radius-lg`）。主题没有定义时，插件使用中性值。因此插件也能在纯 Astro 站点中工作。

## 页面要求

公式块本身没有要求。组件导入自己的 CSS。Astro 打包并去重这些 CSS。

复制功能和复制按钮通过 `page:fragments` 钩子注入。此钩子要求主题的布局渲染 `<EmDashHead>`。如果主题没有渲染 `<EmDashHead>`，公式仍然正确显示，但读者无法复制 LaTeX 源码。

## 数据格式

公式块以 Portable Text 格式存储。

```json
{
	"_type": "mathBlock",
	"_key": "01JMATH…",
	"latex": "\\int_0^\\infty e^{-x^2}\\,dx = \\frac{\\sqrt{\\pi}}{2}",
	"tag": "(1)",
	"tone": "accent"
}
```

`tag` 和 `tone` 可以省略。卸载本插件后，已存储的 JSON 保持不变。公式块只是不再渲染。

## 无障碍

KaTeX 以 `output: "htmlAndMathml"` 运行。每个公式同时带有 MathML 树和可见 HTML。屏幕阅读器和文本提取工具读取 MathML 树。

公式容器还设置了 `role="math"` 和 `aria-label`。`aria-label` 的值是 LaTeX 源码。

## 已知限制

- **不支持行内公式。** `mathBlock` 是块级 Portable Text 节点。EmDash 编辑器把插件块注册为 `group: "block"`。因此公式不能放在段落内部。行内公式需要 EmDash 提供新的编辑器支持。
- **KaTeX 只支持 LaTeX 数学的一个子集。** KaTeX 无法解析的命令显示为原始源码。插件不会静默失败。

## 开发

```bash
pnpm install
pnpm build        # tsdown → dist/index.mjs + dist/index.d.mts
pnpm typecheck
```

`src/astro/` 和 `src/styles/` 以源码形式发布。宿主的 Astro 构建会编译它们。因此这两个目录必须保留在发布的包中。

## 许可

MIT
