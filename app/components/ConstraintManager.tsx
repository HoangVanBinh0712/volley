'use client';

import { useState, useEffect } from 'react';
import { BasicPlayer } from '@/app/types/volleyball';
import { fetchAllPlayers } from '@/app/lib/playerQueries';

interface ConstraintManagerProps {
    onTogetherGroupsChange: (groups: string[][]) => void;
    onSeparateGroupsChange: (groups: string[][]) => void;
    initialTogetherGroups?: string[][];
    initialSeparateGroups?: string[][];
}

export default function ConstraintManager({
    onTogetherGroupsChange,
    onSeparateGroupsChange,
    initialTogetherGroups = [],
    initialSeparateGroups = []
}: ConstraintManagerProps) {
    const [togetherGroups, setTogetherGroups] = useState<string[][]>(initialTogetherGroups);
    const [separateGroups, setSeparateGroups] = useState<string[][]>(initialSeparateGroups);
    const [allPlayerNames, setAllPlayerNames] = useState<string[]>([]);
    const [showTogetherSuggestions, setShowTogetherSuggestions] = useState<{ [key: string]: boolean }>({});
    const [showSeparateSuggestions, setShowSeparateSuggestions] = useState<{ [key: string]: boolean }>({});
    const [loadingPlayers, setLoadingPlayers] = useState(false);

    // Fetch all player names from Supabase on mount
    useEffect(() => {
        const loadPlayers = async () => {
            try {
                setLoadingPlayers(true);
                const players = await fetchAllPlayers();
                setAllPlayerNames(players.map(p => p.name));
            } catch (error) {
                console.error('Failed to load players for suggestions:', error);
            } finally {
                setLoadingPlayers(false);
            }
        };
        loadPlayers();
    }, []);

    const addTogetherGroup = () => {
        const newGroups = [...togetherGroups, ['', '']];
        setTogetherGroups(newGroups);
        onTogetherGroupsChange(newGroups);
    };

    const addSeparateGroup = () => {
        const newGroups = [...separateGroups, ['', '']];
        setSeparateGroups(newGroups);
        onSeparateGroupsChange(newGroups);
    };

    const removeTogetherGroup = (index: number) => {
        const newGroups = togetherGroups.filter((_, i) => i !== index);
        setTogetherGroups(newGroups);
        onTogetherGroupsChange(newGroups);
    };

    const removeSeparateGroup = (index: number) => {
        const newGroups = separateGroups.filter((_, i) => i !== index);
        setSeparateGroups(newGroups);
        onSeparateGroupsChange(newGroups);
    };

    const updateTogetherPlayer = (groupIndex: number, playerIndex: number, value: string) => {
        const newGroups = togetherGroups.map((group, i) =>
            i === groupIndex
                ? group.map((player, j) => (j === playerIndex ? value : player))
                : group
        );
        setTogetherGroups(newGroups);
        onTogetherGroupsChange(newGroups);
    };

    const updateSeparatePlayer = (groupIndex: number, playerIndex: number, value: string) => {
        const newGroups = separateGroups.map((group, i) =>
            i === groupIndex
                ? group.map((player, j) => (j === playerIndex ? value : player))
                : group
        );
        setSeparateGroups(newGroups);
        onSeparateGroupsChange(newGroups);
    };

    const getFilteredSuggestions = (value: string): string[] => {
        if (!value) return allPlayerNames;
        return allPlayerNames.filter((name: string) =>
            name.toLowerCase().includes(value.toLowerCase())
        );
    };

    const toggleTogetherSuggestion = (key: string) => {
        setShowTogetherSuggestions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const toggleSeparateSuggestion = (key: string) => {
        setShowSeparateSuggestions(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    return (
        <div className="bg-green-50 border-2 border-green-200 p-4 rounded-xl space-y-6">
            <h3 className="text-base font-bold text-green-900">🔗 Ràng Buộc Người Chơi</h3>

            {/* Together Groups Section */}
            <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-700">
                        👥 Together Groups (Cùng Đội):
                    </label>
                    <button
                        onClick={addTogetherGroup}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition duration-200"
                    >
                        + Thêm Nhóm
                    </button>
                </div>

                {togetherGroups.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Chưa có nhóm nào. Nhấn "+ Thêm Nhóm" để bắt đầu.</p>
                ) : (
                    <div className="space-y-3">
                        {togetherGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-300 space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-gray-600">Nhóm {groupIndex + 1}</span>
                                    <button
                                        onClick={() => removeTogetherGroup(groupIndex)}
                                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition duration-200"
                                    >
                                        ✕ Xóa
                                    </button>
                                </div>

                                {group.map((player, playerIndex) => {
                                    const suggestionKey = `together_${groupIndex}_${playerIndex}`;
                                    const filteredSuggestions = getFilteredSuggestions(player);

                                    return (
                                        <div key={playerIndex} className="relative">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-gray-600 w-6">P{playerIndex + 1}:</span>
                                                <input
                                                    type="text"
                                                    value={player}
                                                    onChange={(e) => updateTogetherPlayer(groupIndex, playerIndex, e.target.value)}
                                                    onFocus={() => toggleTogetherSuggestion(suggestionKey)}
                                                    placeholder="Nhập tên người chơi"
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                />
                                            </div>

                                            {/* Suggestions Dropdown */}
                                            {showTogetherSuggestions[suggestionKey] && player && (
                                                <div className="absolute top-full left-8 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                                    {filteredSuggestions.length > 0 ? (
                                                        filteredSuggestions.map((suggestion, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    updateTogetherPlayer(groupIndex, playerIndex, suggestion);
                                                                    toggleTogetherSuggestion(suggestionKey);
                                                                }}
                                                                className="w-full text-left px-3 py-2 hover:bg-green-100 text-sm transition duration-150"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <p className="px-3 py-2 text-sm text-gray-500">Không tìm thấy</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Separate Groups Section */}
            <div className="space-y-3 bg-white p-4 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                    <label className="block text-sm font-semibold text-gray-700">
                        ✖️ Separate Groups (Khác Đội):
                    </label>
                    <button
                        onClick={addSeparateGroup}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded transition duration-200"
                    >
                        + Thêm Nhóm
                    </button>
                </div>

                {separateGroups.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">Chưa có nhóm nào. Nhấn "+ Thêm Nhóm" để bắt đầu.</p>
                ) : (
                    <div className="space-y-3">
                        {separateGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-gray-50 p-3 rounded-lg border border-gray-300 space-y-2">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-gray-600">Nhóm {groupIndex + 1}</span>
                                    <button
                                        onClick={() => removeSeparateGroup(groupIndex)}
                                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition duration-200"
                                    >
                                        ✕ Xóa
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    {group.map((player, playerIndex) => {
                                        const suggestionKey = `separate_${groupIndex}_${playerIndex}`;
                                        const filteredSuggestions = getFilteredSuggestions(player);

                                        return (
                                            <div key={playerIndex} className="relative flex-1">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-xs font-semibold text-gray-600 w-5">P{playerIndex + 1}:</span>
                                                    <input
                                                        type="text"
                                                        value={player}
                                                        onChange={(e) => updateSeparatePlayer(groupIndex, playerIndex, e.target.value)}
                                                        onFocus={() => toggleSeparateSuggestion(suggestionKey)}
                                                        placeholder={`Người ${playerIndex + 1}`}
                                                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                                    />
                                                </div>

                                                {/* Suggestions Dropdown */}
                                                {showSeparateSuggestions[suggestionKey] && player && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                                                        {filteredSuggestions.length > 0 ? (
                                                            filteredSuggestions.map((suggestion, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        updateSeparatePlayer(groupIndex, playerIndex, suggestion);
                                                                        toggleSeparateSuggestion(suggestionKey);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 hover:bg-green-100 text-sm transition duration-150"
                                                                >
                                                                    {suggestion}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className="px-3 py-2 text-sm text-gray-500">Không tìm thấy</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
