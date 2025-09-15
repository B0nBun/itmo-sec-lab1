/**
 * @param {string} currentPath 
 * @return {string}
 */
export function header(currentPath) {
    /** @type {[string, string][]} */
    const navigation = [
        ["Register", "/auth/register"],
        ["Login", "/auth/login"],
        ["Data", "/"],
        ["Logout", "/auth/logout"]
    ]
    /** @type {string[]} */
    const elems = []
    for (const [label, path] of navigation) {
        if (path == currentPath) {
            elems.push(label)
        } else {
            elems.push(`<a href="${path}">${label}</a>`)
        }
    }
    return `<h2>${elems.join(" | ")}</h2>`
}
