import { useEffect, useState } from 'react'
import { provider, persistence, doc } from '../lib/yjs-provider'

export function useYjsStatus() {
    const [status, setStatus] = useState({
        peers: 0,
        synced: false,
        connected: false,
    })

    useEffect(() => {
        const updateStatus = () => {
            setStatus({
                peers: provider.awareness?.getStates().size ?? 0,
                synced: persistence?.synced || false,
                connected: provider.ws?.readyState === WebSocket.OPEN,
            })
        }

        // Initial check
        updateStatus()

        // Listeners
        provider.on('status', updateStatus)
        provider.awareness?.on('change', updateStatus)
        if (persistence) {
            persistence.on('synced', updateStatus)
        }

        return () => {
            provider.off('status', updateStatus)
            provider.awareness?.off('change', updateStatus)
            if (persistence) {
                persistence.off('synced', updateStatus)
            }
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
