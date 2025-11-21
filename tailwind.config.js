/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 确保扫描到 src 文件夹下的所有 React 文件
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}