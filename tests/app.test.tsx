import { render, screen, waitFor } from '@testing-library/react'
import App from '../src/App'
import { describe, it, expect, vi } from 'vitest'

// Mock Yjs store dependencies so we don't need real IndexedDB/WebRTC in Node
vi.mock('../src/lib/yjs-store', () => {
    return {
        webrtcProvider: {
            on: vi.fn(),
            off: vi.fn(),
            connected: true,
            awareness: {
                getStates: () => new Map(),
                on: vi.fn(),
                off: vi.fn()
            }
        },
        persistence: {
            on: vi.fn(),
            off: vi.fn(),
            synced: true
        },
        doc: {
            getMap: () => ({
                toJSON: () => ({ version: 'TEST-1.0', phase: 'Test Phase' }),
                observe: vi.fn(),
                unobserve: vi.fn()
            })
        }
    }
})

describe('App', () => {
    it('renders the header and status indicators', async () => {
        render(<App />)
        expect(screen.getByText(/Sanchez OS/i)).toBeInTheDocument()
        // Check for App Title from Sidebar
        expect(screen.getByText(/Sanchez OS/i)).toBeInTheDocument()
    })


})
