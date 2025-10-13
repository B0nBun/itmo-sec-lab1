import { Router } from "express"

/**
 * @param {import('../db/kvpairs.js').KVPairs} kvpairs 
 * @returns {Router}
 */
export function apiRouter(kvpairs) {
    const api = Router()
    
    api.get("/data", (req, res) => {
        const pairs = kvpairs.getAll()
        res.json(Object.fromEntries(pairs))
    })
    
    api.get("/data/:key", (req, res) => {
        const key = req.params.key
        const value = kvpairs.get(key)
        res.json({ value: value })
    })

    return api
}
