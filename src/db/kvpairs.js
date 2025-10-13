import assert from "node:assert/strict"

export class KVPairs {
    /**
     * @param {import('node:sqlite').DatabaseSync} database
     */
    constructor(database) {
        this.database = database
        this.database.exec(`
            create table if not exists kvpairs(
                key text primary key,
                value text
            ) strict;
        `)
    }

    /**
     * @param {string} key 
     * @param {string} value 
     */
    set(key, value) {
        const statement = this.database.prepare(`
            insert into kvpairs(key, value) values(:key, :value)
                on conflict(key) do update set value = :value
        `)
        statement.run({key, value})
    }
    
    /**
     * @param {string} key 
     * @returns {string | undefined}
     */
    get(key) {
        const statement = this.database.prepare(`
            select * from kvpairs where key = :key
        `)
        const iter = statement.iterate({ key })
        const row = iter.next().value
        if (row == undefined) {
            return undefined
        }
        const value = row["value"]
        assert(typeof value == "string")
        return value
    }

    /**
     * @returns {Map<string, string>}
     */
    getAll() {
        /** @type {Map<string, string>} */
        const map = new Map()
        const iter = this.database.prepare("select * from kvpairs").iterate()
        for (const row of iter) {
            const { key, value } = row
            assert(typeof value == "string")
            assert(typeof key == "string")
            map.set(key, value)
        }
        return map
    }

    /**
     * @param {string} key 
     * @return {boolean}
     */
    delete(key) {
        const statement = this.database.prepare(`
            delete from kvpairs where key = :key
        `)
        const result = statement.run({ key })
        return result.changes > 0
    }
}

