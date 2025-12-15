/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ⚡️ 確保這個 colors 區塊存在，Tailwind 才能識別 sausage-xxx 樣式
      colors: {
        sausage: {
          50: '#FFF0ED',  
          100: '#FDD5CD', 
          200: '#FCA08C', 
          600: '#E85F39', // 這是您的主要橘色 (按鈕顏色)
          700: '#D54D2A', 
          800: '#99341B', 
          900: '#331108', // 這是您的主要文字顏色
        }
      }
    },
  },
  plugins: [],
}
