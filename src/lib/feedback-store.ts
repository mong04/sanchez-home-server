
import { doc } from './yjs-store'

export interface FeedbackItem {
    id: string
    subject: string
    description: string
    type: 'bug' | 'feature' | 'other'
    createdAt: string
    status: 'new' | 'reviewed' | 'resolved'
}

// Get the shared Array for feedback
export const feedbackArray = doc.getArray<FeedbackItem>('feedback')

/**
 * Adds a new feedback item to the store.
 */
export const addFeedback = (item: Omit<FeedbackItem, 'id' | 'createdAt' | 'status'>) => {
    const newItem: FeedbackItem = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'new',
        ...item
    }

    // Add to the beginning of the list
    doc.transact(() => {
        feedbackArray.insert(0, [newItem])
    })

    console.log('Feedback added:', newItem)
}

/**
 * Simple hook-like helper to get current feedback (note: components should use useYArray ideally, or observe via useEffect)
 * Since this is a simple store file, we just export the raw Y.Array for components to observe.
 */
