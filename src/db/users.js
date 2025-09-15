import assert from "node:assert/strict"
import { DatabaseSync } from "node:sqlite"

/** @typedef {{ username: string, passwordHash: string }} User */

export class Users {
    /**
     * @param {DatabaseSync} database
     */
    constructor(database) {
        this.database = database
        this.database.exec(`
            create table if not exists users(
                username text primary key,
                password_hash text
            ) strict;
        `)
    }

    /**
     * @param {string} username 
     * @param {string} passwordHash 
     */
    create(username, passwordHash) {
        const statement = this.database.prepare(`
            insert into users(username, password_hash)
                values (:username, :passwordHash);
        `)
        statement.run({ username, passwordHash })
    }

    /**
     * @param {string} username 
     * @returns {User | undefined}
     */
    get(username) {
        const statement = this.database.prepare(`
            select * from users where username = :username;
        `)
        const rows = statement.iterate({ username })
        const row = rows.next()
        if (row == undefined || row.value == undefined) {
            return undefined
        }
        const passwordHash = row.value["password_hash"]
        assert(typeof passwordHash == "string")
        return { username, passwordHash }
    }

    /**
     * @returns {User[]}
     */
    getAll() {
        const statement = this.database.prepare(`
            select * from users;
        `)
        const rows = statement.iterate()
        /** @type {User[]} */
        const users = []
        for (const row of rows) {
            const { username, "password_hash": passwordHash } = row
            assert(typeof passwordHash == "string")
            assert(typeof username == "string")
            const user = { username, passwordHash }
            users.push(user)
        }
        return users
    }
}
