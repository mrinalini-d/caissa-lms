// Shared in-memory store for verification codes.
// Works for single-instance dev; swap for Redis/DB in multi-instance production.
const codes = new Map()
export default codes
