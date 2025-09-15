import { Router } from "express"
import { constants as httpConstants } from "node:http2"
import { KVPairs } from "../db/kvpairs.js"

/**
 * @param {KVPairs} kvpairs 
 * @returns {Router}
 */
export function apiRouter(kvpairs) {
    const api = Router()
    
    api.get("/data", (req, res) => {
        const pairs = kvpairs.getAll()
        res.json(Object.fromEntries(pairs))
    })
    
    api.get("/api/data/:key", (req, res) => {
        const key = req.params.key
        const value = kvpairs.get(key)
        res.json({ value: value })
    })
    
    // TODO: Remove things below
    api.delete("/api/data/:key", (req, res) => {
        const key = req.params.key
        const deleted = kvpairs.delete(key)
        res.json({ deleted })
    })
    
    api.put("/api/data", (req, res) => {
        const body = req.body
        if (body == undefined) {
            res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
            return
        }
        const { key, value } = body
        if (typeof key != "string" || typeof value != "string") {
            res.sendStatus(httpConstants.HTTP_STATUS_BAD_REQUEST)
            return
        }
        kvpairs.set(key, value)
        res.json({})
    })

    return api
}
