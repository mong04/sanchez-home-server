import { WebSocketServer } from 'ws'
import http from 'http'
import webpush from 'web-push'
import dotenv from 'dotenv'
import { ServerAdapter } from '../lib/backend/server-adapter.js'

dotenv.config()

// Helper to replace lib0/map to avoid direct dependency issues
const setIfUndefined = (map, key, create) => {
    let item = map.get(key)
    if (item === undefined) {
        item = create()
        map.set(key, item)
    }
    return item
}

const wsReadyStateConnecting = 0
const wsReadyStateOpen = 1
const wsReadyStateClosing = 2
const wsReadyStateClosed = 3

const pingTimeout = 30000

const port = process.env.PORT || 4444
const wss = new WebSocketServer({ noServer: true })

const server = http.createServer(async (request, response) => {
    console.log(`📡 [HTTP] ${request.method} ${request.url}`);

    // Enable CORS
    response.setHeader('Access-Control-Allow-Origin', '*')
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (request.method === 'OPTIONS') {
        response.writeHead(204)
        response.end()
        return
    }

    if (request.method === 'POST' && request.url === '/api/sfos/send-push') {
        let body = ''
        request.on('data', chunk => { body += chunk })
        request.on('end', async () => {
            try {
                const { userId, payload } = JSON.parse(body)
                const authHeader = request.headers.authorization || '';

                const pbUrl = process.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090'
                const targetId = userId;

                // 2. Fetch subscriptions via ServerAdapter
                const adapter = new ServerAdapter(pbUrl);
                const subs = await adapter.getPushSubscriptions(targetId, authHeader);

                if (subs.length === 0) {
                    console.warn(`No push subscriptions found for ${userId} (targetId: ${targetId})`)
                }

                // 2. Configure web-push
                webpush.setVapidDetails(
                    'mailto:admin@sanchez.family',
                    process.env.VITE_VAPID_PUBLIC_KEY || '',
                    process.env.VAPID_PRIVATE_KEY || ''
                )

                // 3. Send to all endpoints
                const results = await Promise.allSettled(subs.map(sub => {
                    const pushSubscription = {
                        endpoint: sub.endpoint,
                        keys: sub.keys
                    }
                    return webpush.sendNotification(pushSubscription, JSON.stringify(payload))
                }))

                console.log(`Push delivery to ${userId} complete. Results:`, results.length)
                response.writeHead(200, { 'Content-Type': 'application/json' })
                response.end(JSON.stringify({ success: true, count: results.length }))
            } catch (err) {
                console.error('Push Delivery Error:', err)
                response.writeHead(500, { 'Content-Type': 'application/json' })
                response.end(JSON.stringify({ error: err.message }))
            }
        })
        return
    }

    response.writeHead(200, { 'Content-Type': 'text/plain' })
    response.end('okay')
})

const topics = new Map()

const send = (conn, message) => {
    if (conn.readyState !== wsReadyStateConnecting && conn.readyState !== wsReadyStateOpen) {
        conn.close()
    }
    try {
        conn.send(JSON.stringify(message))
    } catch (e) {
        conn.close()
    }
}

const onconnection = conn => {
    const subscribedTopics = new Set()
    let closed = false
    let pongReceived = true
    const pingInterval = setInterval(() => {
        if (!pongReceived) {
            conn.close()
            clearInterval(pingInterval)
        } else {
            pongReceived = false
            try {
                conn.ping()
            } catch (e) {
                conn.close()
            }
        }
    }, pingTimeout)
    conn.on('pong', () => {
        pongReceived = true
    })
    conn.on('close', () => {
        subscribedTopics.forEach(topicName => {
            const subs = topics.get(topicName) || new Set()
            subs.delete(conn)
            if (subs.size === 0) {
                topics.delete(topicName)
            }
        })
        subscribedTopics.clear()
        closed = true
    })
    conn.on('message', message => {
        if (typeof message === 'string' || message instanceof Buffer) {
            message = JSON.parse(message)
        }
        if (message && message.type && !closed) {
            switch (message.type) {
                case 'subscribe':
                    (message.topics || []).forEach(topicName => {
                        if (typeof topicName === 'string') {
                            const topic = setIfUndefined(topics, topicName, () => new Set())
                            topic.add(conn)
                            subscribedTopics.add(topicName)
                        }
                    })
                    break
                case 'unsubscribe':
                    (message.topics || []).forEach(topicName => {
                        const subs = topics.get(topicName)
                        if (subs) {
                            subs.delete(conn)
                        }
                    })
                    break
                case 'publish':
                    if (message.topic) {
                        const receivers = topics.get(message.topic)
                        if (receivers) {
                            message.clients = receivers.size
                            receivers.forEach(receiver =>
                                send(receiver, message)
                            )
                        }
                    }
                    break
                case 'ping':
                    send(conn, { type: 'pong' })
            }
        }
    })
}
wss.on('connection', onconnection)

server.on('upgrade', (request, socket, head) => {
    const handleAuth = ws => {
        wss.emit('connection', ws, request)
    }
    wss.handleUpgrade(request, socket, head, handleAuth)
})

server.listen(port)

console.log('Signaling server running on localhost:', port)
