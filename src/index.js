import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"

import { DatabaseSync } from "node:sqlite"
import { constants as httpConstants } from "node:http2"
import assert from "node:assert/strict"

import { KVPairs } from "./db/kvpairs.js"
import { Users } from "./db/users.js"
import { apiRouter } from "./routes/api.js"
import { authMiddleware, authRouter, createUser } from "./routes/auth.js"
import { header } from "./header.js"

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET
const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH
const PORT = Number.parseInt(process.env.PORT || '3000')
assert(JWT_SECRET != undefined)

const databaseSync = new DatabaseSync(SQLITE_DB_PATH || ":memory:")
const kvpairs = new KVPairs(databaseSync)
const users = new Users(databaseSync)

kvpairs.set("foo", "bar")
kvpairs.set("<script>alert(1)</script><i>italic</i>", "<b>BOLD</b>")
kvpairs.set("b0ba", "KiKi")
kvpairs.set("fizz", "buzz")

await createUser(users, "Alice", "password")
await createUser(users, "Bob", "password")

const authorizationMiddleware = authMiddleware(JWT_SECRET)

const app = express().
    use(express.json()).
    use(express.urlencoded()).
    use(cookieParser())

app.use("/auth", authRouter(users, JWT_SECRET))

app.use("/api", authorizationMiddleware, apiRouter(kvpairs))

app.get("/", authorizationMiddleware, (req, res) => {
    const pairs = kvpairs.getAll()
    const userList = users.getAll()
    
    res.set("Content-Type", "text/html")
    res.write(header(req.path))
    res.write("<h2>Data</h2>")
    res.write(`
        <form method="POST">
            <label for="key">Key:</label> <input type="text" placeholder="Key" name="key" />
            <label for="value">Value:</label> <input type="text" placeholder="Value" name="value" />
            <button type="submit">Set</button>
        </form>
    `)
    res.write("<ul>")
    for (const [key, value] of pairs.entries()) {
        res.write(`<li>${encodeURIComponent(key)}: ${encodeURIComponent(value)}</li>`)
    }
    res.write("</ul>")

    res.write("<h2>Users</h2>")
    res.write("<ul>")
    for (const { username } of userList) {
        let text = encodeURIComponent(username)
        if (username == res.locals["username"]) {
            text = `<b>${text}</b>`
        }
        res.write(`<li>${text}</li>`)
    }
    res.write("</ul>")
    res.end()
})

app.post("/", authorizationMiddleware, (req, res) => {
    if (req.body == undefined) {
        res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
        return
    }
    const { key, value } = req.body
    if (typeof key != "string" || typeof value != "string") {
        res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
        return
    }

    kvpairs.set(key, value)
    res.redirect("/")
})


app.listen(PORT, () => {
    console.log(`app started: http://localhost:${PORT}/auth/login`)
})