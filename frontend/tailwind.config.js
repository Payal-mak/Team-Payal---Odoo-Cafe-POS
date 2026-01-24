/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Coffee-inspired color palette
                coffee: {
                    50: '#faf8f5',
                    100: '#f5f0e8',
                    200: '#e8dcc8',
                    300: '#d4c2a0',
                    400: '#b89968',
                    500: '#a07d4d',
                    600: '#8b6940',
                    700: '#6f5436',
                    800: '#5c4530',
                    900: '#4d3a29',
                },
                cream: {
                    50: '#fefdfb',
                    100: '#fdf9f3',
                    200: '#faf3e6',
                    300: '#f5e9d1',
                    400: '#edd9b3',
                    500: '#e3c798',
                    600: '#d4af7a',
                    700: '#c0935f',
                    800: '#a67a4f',
                    900: '#8b6644',
                },
                espresso: {
                    50: '#f7f6f5',
                    100: '#e8e4e0',
                    200: '#d1c7bd',
                    300: '#b5a595',
                    400: '#9a8471',
                    500: '#7d6a58',
                    600: '#655546',
                    700: '#4f433a',
                    800: '#3d342e',
                    900: '#2d2520',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
