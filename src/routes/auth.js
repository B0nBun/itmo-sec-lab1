import { Router } from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { constants as httpConstants } from "node:http2"
import { header } from "../header.js"

/** @typedef {import('../db/users.js').Users} Users */

/**
 * @param {string} jwtSecret
 * @returns {import("express").RequestHandler}
 */
export function authMiddleware(jwtSecret) {
    return (req, res, next) => {
        const token = req.cookies["jwt"]
        if (typeof token != "string") {
            res.sendStatus(httpConstants.HTTP_STATUS_UNAUTHORIZED)
            return
        }
        try {
            const payload = jwt.verify(token, jwtSecret)
            if (typeof payload != "object" || typeof payload["username"] != "string") {
                res.sendStatus(httpConstants.HTTP_STATUS_UNAUTHORIZED)
                return
            }
            res.locals["username"] = payload["username"]
            next()
        } catch {
            res.sendStatus(httpConstants.HTTP_STATUS_UNAUTHORIZED)
            return
        }
    }
}

/**
 * @param {Users} users 
 * @param {string} jwtSecret
 * @returns {Router}
 */
export function authRouter(users, jwtSecret) {
    const auth = Router()
    
    auth.get("/logout", async (req, res) => {
        res.cookie("jwt", undefined)
        res.redirect("/auth/login")
    })

    auth.get("/login", async (req, res) => {
        res.set("Content-Type", "text/html")
        res.send(`
        ${header(req.originalUrl)}
        <form method="POST">
            <label for="username">Username:</label> <input type="text" placeholder="Username" name="username" />
            <label for="password">Password:</label> <input type="password" placeholder="Password" name="password" />
            <button type="submit">Login</button>
        </form>
        `)
    })

    auth.post("/login", async (req, res) => {
        if (req.body == undefined) {
            res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
            return
        }
        const { username, password } = req.body
        if (typeof username != "string" || typeof password != "string") {
            res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
            return
        }
        const user = users.get(username)
        if (user == undefined) {
            res.sendStatus(httpConstants.HTTP_STATUS_UNAUTHORIZED)
            return
        }
        const authorized = await bcrypt.compare(password, user.passwordHash)
        if (!authorized) {
            res.sendStatus(httpConstants.HTTP_STATUS_UNAUTHORIZED)
            return
        }

        const token = jwt.sign({ username }, jwtSecret, { expiresIn: "1h" })
        res.cookie("jwt", token, {
            httpOnly: true,
            secure: false,
        })
        res.redirect("/")
    })

    auth.get("/register", async (req, res) => {
        res.set("Content-Type", "text/html")
        res.send(`
        ${header(req.originalUrl)}
        <form method="POST">
            <label for="username">Username:</label> <input type="text" placeholder="Username" name="username" />
            <label for="password">Password:</label> <input type="password" placeholder="Password" name="password" />
            <button type="submit">Register</button>
        </form>
        `)
    })

    auth.post("/register", async (req, res) => {
        if (req.body == undefined) {
            res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
            return
        }
        const { username, password } = req.body
        if (typeof username != "string" || typeof password != "string") {
            res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
            return
        }
        
        await createUser(users, username, password)

        res.redirect("/auth/login")
    })

    return auth
}

/**
 * This function is exposed purely for the convenience of creating initial mock users
 * @param {Users} users
 * @param {string} username 
 * @param {string} password 
 */
export async function createUser(users, username, password) {
    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(password, salt)

    users.create(username, passwordHash)
}