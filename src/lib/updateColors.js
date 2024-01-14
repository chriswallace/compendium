export function updateColors(page) {
    if (typeof document === 'undefined')
        return;

    // Define a mapping of page routes to class names
    const pageClassMap = {
        "/medici/": "medici",
        // Add other page routes and their corresponding class names
        // Example: "/anotherPage": "anotherPage-theme"
    };

    // Default class if the page is not in the map
    const defaultClass = "default";

    // Determine the class to set based on the current page
    const classToSet = pageClassMap[page] || defaultClass;

    // Set the class on the body element
    document.body.className = classToSet;
}