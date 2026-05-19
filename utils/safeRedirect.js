export function safeRedirect(path, fallback = "/") {
    if (
        typeof path === "string" &&
        path.startsWith("/") &&
        !path.startsWith("//")
    ) {
        return path;
    }
    return fallback;
}
