/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        register: 'url("../public/Assets/Images/login-study1.jpg")',
        login: 'url("../public/Assets/Images/login-study.jpg")',
        students: 'url("../public/Assets/Images/teacher2.jpg")',
        instructors: 'url("../public/Assets/Images/teacher1.jpg")',
        welcomePage: 'url("../public/Assets/Images/study1.jpg")',
      },
      colors: {
        nack: "#c4f4ea",
        main: "#e9f8f5",
        background1: 'rgba(255,255,255, 0.9)',
        shadow1: '0px 7px 14px rgba(0, 0, 0, .05), 0px 0px 3.12708px rgba(0, 0, 0, .0798), 0px 0px .931014px rgba(0, 0, 0, .1702)',
        shadow2: '0 0 0 1px #4a47b1',
        border1: '#b8b8b8',
        border2: '#d6d6d6',
        text1: '#3d3d3d',
        text2: '#e3e2fe'
      },
    },
  },
  plugins: [],
};
