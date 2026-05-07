/** @type {import('tailwindcss').Config} */

const colors = require('tailwindcss/colors');

module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                primary: { ...colors.violet },
                gray: { ...colors.slate },
            },
            keyframes: {
                shimmer: {
                    '0%':   { transform: 'translateX(0)' },
                    '100%': { transform: 'translateX(400%)' },
                },
            },
            animation: {
                shimmer: 'shimmer 2s linear infinite',
            },
        },
    },
};