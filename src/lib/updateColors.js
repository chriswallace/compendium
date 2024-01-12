// Update colors based on the current page
export function updateColors(page) {
    let colorPalette;
    switch (page) {
        case "/medici":
            colorPalette = {
                primary: "var(--color-secondary)",
                secondary: "var(--color-primary)",
                background: "var(--color-tertiary)",
            };
            break;
        // Define other pages and their color palettes here
        default:
            colorPalette = {
                primary: "var(--color-secondary)",
                secondary: "var(--color-primary)",
                background: "var(--background-without-opacity)",
            };
    }
    // Set CSS variables
    document.documentElement.style.setProperty(
        "--nav-text",
        colorPalette.primary,
    );
    document.documentElement.style.setProperty(
        "--nav-hover-text",
        colorPalette.secondary,
    );
    document.documentElement.style.setProperty(
        "--nav-background",
        colorPalette.background,
    );
}