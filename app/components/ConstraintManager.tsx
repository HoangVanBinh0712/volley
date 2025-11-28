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
        <div className="bg-linear-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 p-5 rounded-xl space-y-6 shadow-sm">
            <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2">
                <span className="text-2xl">🔗</span>
                Ràng Buộc Người Chơi
            </h3>

            {/* Together Groups Section */}
            <div className="space-y-4 bg-white p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-base font-bold text-blue-900">
                        <span className="text-xl">👥</span>
                        Together Groups <span className="text-sm font-normal text-gray-600">(Cùng Đội)</span>
                    </label>
                    <button
                        onClick={addTogetherGroup}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                        + Thêm Nhóm
                    </button>
                </div>

                {togetherGroups.length === 0 ? (
                    <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-lg p-4 text-center">
                        <p className="text-sm text-blue-700">💡 Chưa có nhóm nào. Nhấn "+ Thêm Nhóm" để bắt đầu.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {togetherGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-blue-900 bg-blue-200 px-3 py-1 rounded-full">Nhóm {groupIndex + 1}</span>
                                    <button
                                        onClick={() => removeTogetherGroup(groupIndex)}
                                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition duration-200 shadow-sm"
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
                                                <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-1 rounded w-10 text-center">P{playerIndex + 1}</span>
                                                <input
                                                    type="text"
                                                    value={player}
                                                    onChange={(e) => updateTogetherPlayer(groupIndex, playerIndex, e.target.value)}
                                                    onFocus={() => toggleTogetherSuggestion(suggestionKey)}
                                                    placeholder="Nhập tên người chơi"
                                                    className="flex-1 px-3 py-2 border-2 border-blue-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                                />
                                            </div>

                                            {/* Suggestions Dropdown */}
                                            {showTogetherSuggestions[suggestionKey] && player && (
                                                <div className="absolute top-full left-12 right-0 mt-1 bg-white border-2 border-blue-300 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
                                                    {filteredSuggestions.length > 0 ? (
                                                        filteredSuggestions.map((suggestion, idx) => (
                                                            <button
                                                                key={idx}
                                                                onClick={() => {
                                                                    updateTogetherPlayer(groupIndex, playerIndex, suggestion);
                                                                    toggleTogetherSuggestion(suggestionKey);
                                                                }}
                                                                className="w-full text-left px-4 py-2 hover:bg-blue-100 text-sm font-medium transition duration-150 border-b border-blue-100 last:border-0"
                                                            >
                                                                {suggestion}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <p className="px-4 py-2 text-sm text-gray-500">Không tìm thấy</p>
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
            <div className="space-y-4 bg-white p-5 rounded-xl border-2 border-orange-200 shadow-sm">
                <div className="flex justify-between items-center">
                    <label className="flex items-center gap-2 text-base font-bold text-orange-900">
                        <span className="text-xl">✖️</span>
                        Separate Groups <span className="text-sm font-normal text-gray-600">(Khác Đội)</span>
                    </label>
                    <button
                        onClick={addSeparateGroup}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                        + Thêm Nhóm
                    </button>
                </div>

                {separateGroups.length === 0 ? (
                    <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-lg p-4 text-center">
                        <p className="text-sm text-orange-700">💡 Chưa có nhóm nào. Nhấn "+ Thêm Nhóm" để bắt đầu.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {separateGroups.map((group, groupIndex) => (
                            <div key={groupIndex} className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200 space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-bold text-orange-900 bg-orange-200 px-3 py-1 rounded-full">Nhóm {groupIndex + 1}</span>
                                    <button
                                        onClick={() => removeSeparateGroup(groupIndex)}
                                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition duration-200 shadow-sm"
                                    >
                                        ✕ Xóa
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {group.map((player, playerIndex) => {
                                        const suggestionKey = `separate_${groupIndex}_${playerIndex}`;
                                        const filteredSuggestions = getFilteredSuggestions(player);

                                        return (
                                            <div key={playerIndex} className="relative">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-orange-700 bg-orange-200 px-2 py-1 rounded w-10 text-center">P{playerIndex + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={player}
                                                        onChange={(e) => updateSeparatePlayer(groupIndex, playerIndex, e.target.value)}
                                                        onFocus={() => toggleSeparateSuggestion(suggestionKey)}
                                                        placeholder={`Người ${playerIndex + 1}`}
                                                        className="flex-1 px-3 py-2 border-2 border-orange-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                                    />
                                                </div>

                                                {/* Suggestions Dropdown */}
                                                {showSeparateSuggestions[suggestionKey] && player && (
                                                    <div className="absolute top-full left-12 right-0 mt-1 bg-white border-2 border-orange-300 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
                                                        {filteredSuggestions.length > 0 ? (
                                                            filteredSuggestions.map((suggestion, idx) => (
                                                                <button
                                                                    key={idx}
                                                                    onClick={() => {
                                                                        updateSeparatePlayer(groupIndex, playerIndex, suggestion);
                                                                        toggleSeparateSuggestion(suggestionKey);
                                                                    }}
                                                                    className="w-full text-left px-4 py-2 hover:bg-orange-100 text-sm font-medium transition duration-150 border-b border-orange-100 last:border-0"
                                                                >
                                                                    {suggestion}
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <p className="px-4 py-2 text-sm text-gray-500">Không tìm thấy</p>
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
