/** @type {import('tailwindcss').Config} */
export default {
  // 告訴 Tailwind 去哪裡尋找 class name
  content: [
    "./index.html",
    // 1. 搜尋所有放在「最外層」的檔案 (例如 App.tsx, main.tsx)
    "./*.{js,ts,jsx,tsx}",            
    // 2. 搜尋 components/ 資料夾內的所有檔案
    "./components/**/*.{js,ts,jsx,tsx}", 
    // 3. 搜尋 services/ 資料夾內的所有檔案
    "./services/**/*.{js,ts,jsx,tsx}",   
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
