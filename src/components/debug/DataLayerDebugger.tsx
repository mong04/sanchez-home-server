import React, { useState } from 'react';
import { useInfinityLog } from '../../hooks/use-infinity-log';
import { useChores } from '../../hooks/use-organizer';

export const DataLayerDebugger: React.FC = () => {
    const { items: logItems, addItem: addLogItem, removeItem: removeLogItem } = useInfinityLog();
    const { items: choreItems, addChore, rotateChore, deleteChore } = useChores();

    const [newLogContent, setNewLogContent] = useState('');
    const [newChoreTitle, setNewChoreTitle] = useState('');
    const [newChoreAssignee, setNewChoreAssignee] = useState('Me');

    const handleAddLog = (e: React.FormEvent) => {
        e.preventDefault();
        if (newLogContent.trim()) {
            addLogItem(newLogContent, ['debug']);
            setNewLogContent('');
        }
    };

    const handleAddChore = (e: React.FormEvent) => {
        e.preventDefault();
        if (newChoreTitle.trim()) {
            const assignees = newChoreAssignee.split(',').map(s => s.trim()).filter(Boolean);
            addChore(newChoreTitle, assignees.length ? assignees : ['Me'], 'daily', 10);
            setNewChoreTitle('');
        }
    };

    return (
        <div className="p-4 border-t border-gray-200 mt-8 bg-gray-50">
            <h2 className="text-xl font-bold mb-4">🔧 Data Layer Debugger</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Infinity Log Section */}
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-2">Infinity Log ({logItems.length})</h3>
                    <form onSubmit={handleAddLog} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newLogContent}
                            onChange={(e) => setNewLogContent(e.target.value)}
                            placeholder="New log entry..."
                            className="flex-1 border p-1 rounded"
                        />
                        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Add</button>
                    </form>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {logItems.map(item => (
                            <li key={item.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                <span className="text-sm">{item.content}</span>
                                <button
                                    onClick={() => removeLogItem(item.id)}
                                    className="text-red-500 text-xs hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Chores Section */}
                <div className="bg-white p-4 rounded shadow">
                    <h3 className="text-lg font-semibold mb-2">Chores ({choreItems.length})</h3>
                    <form onSubmit={handleAddChore} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newChoreTitle}
                            onChange={(e) => setNewChoreTitle(e.target.value)}
                            placeholder="Chore title..."
                            className="flex-1 border p-1 rounded"
                        />
                        <input
                            type="text"
                            value={newChoreAssignee}
                            onChange={(e) => setNewChoreAssignee(e.target.value)}
                            placeholder="Assignees (comma sep)"
                            className="w-32 border p-1 rounded"
                        />
                        <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">Add</button>
                    </form>
                    <ul className="space-y-2 max-h-60 overflow-y-auto">
                        {choreItems.map(item => (
                            <li key={item.id} className="flex justify-between items-center bg-gray-100 p-2 rounded">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => rotateChore(item.id)}
                                        className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded hover:bg-blue-200"
                                    >
                                        Rotate
                                    </button>
                                    <span className="text-sm">
                                        {item.title} ({item.assignees[item.currentTurnIndex] || 'Unassigned'})
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteChore(item.id)}
                                    className="text-red-500 text-xs hover:text-red-700"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
