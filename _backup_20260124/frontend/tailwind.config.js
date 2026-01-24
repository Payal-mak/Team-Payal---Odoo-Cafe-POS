/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fef3e2',
                    100: '#fde7c5',
                    200: '#fbcf8b',
                    300: '#f9b751',
                    400: '#f79f17',
                    500: '#d68410',
                    600: '#b56a0d',
                    700: '#94500a',
                    800: '#733607',
                    900: '#521c04',
                },
                cafe: {
                    brown: '#6B4423',
                    cream: '#F5E6D3',
                    orange: '#FF8C42',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'bounce-slow': 'bounce 3s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
            },
        },
    },
    plugins: [],
}
