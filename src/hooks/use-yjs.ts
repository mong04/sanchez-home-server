import { useEffect, useState } from 'react'
import { webrtcProvider, persistence, doc } from '../lib/yjs-store'

export function useYjsStatus() {
    const [status, setStatus] = useState({
        peers: 0,
        synced: false,
        connected: false,
    })

    useEffect(() => {
        const updateStatus = () => {
            setStatus({
                peers: webrtcProvider.awareness.getStates().size,
                synced: persistence.synced,
                connected: webrtcProvider.connected,
            })
        }

        // Initial check
        updateStatus()

        // Listeners
        webrtcProvider.on('status', updateStatus)
        webrtcProvider.on('peers', updateStatus)
        persistence.on('synced', updateStatus)
        webrtcProvider.awareness.on('change', updateStatus)

        return () => {
            webrtcProvider.off('status', updateStatus)
            webrtcProvider.off('peers', updateStatus)
            persistence.off('synced', updateStatus)
            webrtcProvider.awareness.off('change', updateStatus)
        }
    }, [])

    return status
}

export function useSystemData() {
    const [data, setData] = useState<Record<string, unknown> | null>(null)

    useEffect(() => {
        const systemMap = doc.getMap('system')

        const update = () => {
            setData(systemMap.toJSON())
        }

        // Initial
        update()

        // Listener
        systemMap.observe(update)

        return () => systemMap.unobserve(update)
    }, [])

    return data
}
