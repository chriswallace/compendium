module.exports = {
    content: ['./src/**/*.{html,js,svelte,ts}', './static/collection/*.html'],
    theme: {
        borderRadius: {
            none: 0,
            sm: 'var(--border-radius-sm)',
            md: 'var(--border-radius-md)',
            lg: 'var(--border-radius-lg)',
            full: '500px'
        },
        extend: {
            colors: {
                primary: 'var(--color-primary)',
                secondary: 'var(--color-secondary)',
                success: 'var(--color-background-success)',
                success_text: 'var(--color-text-success)',
                error: 'var(--color-background-error)',
                error_text: 'var(--color-text-error)',
                gray: {
                    100: '#F5F5F5',
                    200: '#E0E0E0',
                    300: '#BDBDBD',
                    400: '#9E9E9E',
                    500: '#7E7E7E',
                    600: '#616161',
                    700: '#424242',
                    800: '#303030',
                    900: '#1C1C1C'
                }
            },
            fontFamily: {
                display: ['var(--serif-font-family)', 'serif'],
                sans: ['var(--font-family)', 'sans-serif'],
                body: ['var(--font-family)', 'sans-serif']
            }
        }
    },
    plugins: [require('@tailwindcss/typography')]
};