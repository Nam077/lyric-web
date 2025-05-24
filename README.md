# Lyric Web - React + TypeScript + Vite

Một ứng dụng React hiện đại được xây dựng với Vite và TypeScript, tối ưu hóa cho hiệu suất và trải nghiệm phát triển tốt nhất.

## 🚀 Tính năng

- ⚡️ **Vite** - Build tool nhanh với Hot Module Replacement (HMR)
- ⚛️ **React 18** - Thư viện UI hiện đại với hooks
- 🎯 **TypeScript** - Type safety và IntelliSense tốt hơn
- 📏 **ESLint** - Linting và code quality
- 🎨 **CSS Modules** - Styling được hỗ trợ sẵn

## 📦 Cài đặt

```bash
# Clone dự án (nếu cần)
git clone <repository-url>
cd lyric-web

# Cài đặt dependencies
npm install
```

## 🛠️ Scripts

```bash
# Khởi chạy development server
npm run dev

# Build cho production
npm run build

# Preview build production
npm run preview

# Lint code
npm run lint
```

## 🏗️ Cấu trúc dự án

```
lyric-web/
├── .github/              # GitHub và Copilot configurations
├── public/               # Static assets
├── src/                  # Source code
│   ├── assets/          # Images, icons, etc.
│   ├── components/      # React components
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Entry point
├── index.html           # HTML template
├── package.json         # Dependencies và scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── eslint.config.js     # ESLint configuration
```

## 🎯 Hướng dẫn phát triển

1. **Development**: Chạy `npm run dev` và mở http://localhost:5173
2. **Type Safety**: Sử dụng TypeScript cho tất cả components và functions
3. **Code Quality**: Code được lint tự động với ESLint
4. **Hot Reload**: Thay đổi code sẽ được cập nhật ngay lập tức

## 📝 Ghi chú

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
