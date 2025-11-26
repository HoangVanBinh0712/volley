'use client';

import { useState, useEffect } from 'react';
import { BasicPlayer } from '@/app/types/volleyball';
import { fetchAllPlayers } from '@/app/lib/playerQueries';

interface PlayerSelectionProps {
    onPlayersSelected: (players: BasicPlayer[]) => void;
}

export default function PlayerSelection({ onPlayersSelected }: PlayerSelectionProps) {
    const [players, setPlayers] = useState<BasicPlayer[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showTable, setShowTable] = useState(false);

    /**
     * Load all players from database
     */
    const handleLoadPlayers = async () => {
        setLoading(true);
        setError(null);
        try {
            const fetchedPlayers = await fetchAllPlayers();
            console.log('Loaded players:', fetchedPlayers);
            setPlayers(fetchedPlayers);
            setShowTable(true);
            if (fetchedPlayers.length === 0) {
                setError('No players found. Check RLS policies in Supabase or verify table has data.');
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to load players';
            console.error('Full error:', err);
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Toggle player selection
     */
    const togglePlayer = (id: number | undefined) => {
        if (id === undefined) return;
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    /**
     * Select/deselect all players
     */
    const toggleSelectAll = () => {
        if (selectedIds.size === players.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(players.map(p => p.id).filter(id => id !== undefined) as number[]));
        }
    };

    /**
     * Confirm selection and pass to parent component
     */
    const handleConfirmSelection = () => {
        const selected = players.filter(p => p.id !== undefined && selectedIds.has(p.id));
        onPlayersSelected(selected);
        // Keep table open for re-selection
    };

    return (
        <div className="space-y-4">
            {/* Load Button */}
            {!showTable && (
                <button
                    onClick={handleLoadPlayers}
                    disabled={loading}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition duration-200"
                >
                    {loading ? 'Loading Players...' : 'Load Players from Database'}
                </button>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            {/* Player Selection Table */}
            {showTable && (
                <div className="space-y-3">
                    {/* Header with Selection Counter */}
                    <div className="flex flex-col gap-4 bg-linear-to-r from-indigo-50 to-blue-50 p-5 rounded-lg border-2 border-indigo-200">
                        <div className="text-lg font-bold text-indigo-900">
                            Selected Players: <span className="text-2xl text-indigo-600">{selectedIds.size}</span> <span className="text-gray-600">/ {players.length}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={toggleSelectAll}
                                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                            >
                                {selectedIds.size === players.length ? '✓ Deselect All' : '○ Select All'}
                            </button>
                            <button
                                onClick={handleConfirmSelection}
                                disabled={selectedIds.size === 0}
                                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                            >
                                ✅ Confirm ({selectedIds.size})
                            </button>
                            <button
                                onClick={() => {
                                    setShowTable(false);
                                    setSelectedIds(new Set());
                                }}
                                className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                            >
                                ↺ Reset
                            </button>
                        </div>
                    </div>

                    {/* Player Table */}
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="w-full">
                            <thead className="bg-indigo-600 text-white sticky top-0">
                                <tr>
                                    <th className="px-4 py-3 text-left w-12">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.size === players.length && players.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-5 h-5 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Tên</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Biệt Danh</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Vị Trí Gốc</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Cấp Độ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Vị Trí Phụ</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase">Cấp Độ Phụ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                                {players.map((player, idx) => (
                                    <tr
                                        key={player.id || idx}
                                        className={`transition duration-150 ${
                                            idx % 2 === 0 ? 'bg-white hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-50'
                                        }`}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(player.id || 0)}
                                                onChange={() => togglePlayer(player.id)}
                                                className="w-5 h-5 cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-gray-900">
                                            {player.name}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {player.nickName || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {player.position || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                            {player.position_tier || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                            {player.sub_position || '-'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                            {player.sub_position_tier || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
