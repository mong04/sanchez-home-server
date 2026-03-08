import { useEffect, useState } from 'react'
import { getProvider, persistence, doc } from '../lib/yjs-provider'

export function useYjsStatus() {
    const [status, setStatus] = useState({
        peers: 0,
        synced: false,
        connected: false,
    })

    useEffect(() => {
        const updateStatus = () => {
            const provider = getProvider();
            setStatus({
                peers: provider?.awareness?.getStates().size ?? 0,
                synced: persistence?.synced || false,
                connected: provider?.ws?.readyState === WebSocket.OPEN,
            })
        }

        // Initial check
        updateStatus()

        // Listeners
        const provider = getProvider();
        provider?.on('status', updateStatus)
        provider?.awareness?.on('change', updateStatus)
        if (persistence) {
            persistence.on('synced', updateStatus)
        }

        return () => {
            const currentProvider = getProvider();
            currentProvider?.off('status', updateStatus)
            currentProvider?.awareness?.off('change', updateStatus)
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
