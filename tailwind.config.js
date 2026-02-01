export default {
    darkMode: 'class', // 'selector' is the v4 replacement but 'class' is often supported as alias or via update. 
    // Since v4 prefers CSS config, but we need to force class strategy if defaults generally use media.
    // Actually, for v4, simply having the CSS variables and the .dark class in CSS is usually enough for the COLORS.
    // But for the `dark:` variant to work based on a class, we need this config.
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {},
    },
    plugins: [],
}
