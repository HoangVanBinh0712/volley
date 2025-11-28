'use client';

import { useState } from 'react';
import { Player, Team } from '@/app/types/volleyball';
import { TAILWIND_STYLES } from '@/app/constants/volleyConstants';
import DivideTab from './DivideTab';
import EditTab from './EditTab';

interface Constraints {
    togetherGroups: string[][];
    separateGroups: string[][];
}

export default function VolleyDivider() {
    const [editablePlayers, setEditablePlayers] = useState<Player[]>([]);
    const [loadedConstraints, setLoadedConstraints] = useState<Constraints>({ togetherGroups: [], separateGroups: [] });
    const [activeTab, setActiveTab] = useState('divide-tab');

    const handleDatabasePlayersSelected = (players: Player[]) => {
        setEditablePlayers(players);
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-linear-to-br from-gray-50 to-gray-100 min-h-screen">
            <style>{TAILWIND_STYLES}</style>

            <div className="max-w-2xl mx-auto bg-white shadow-2xl rounded-2xl p-4 sm:p-6 md:p-8 space-y-8">
                {/* HEADER */}
                <header className="text-center pt-6 pb-4 border-b-4 border-indigo-600 rounded-t-2xl bg-linear-to-r from-indigo-50 to-purple-50">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 mb-2">
                        <span className="inline-block align-middle mr-2 text-3xl sm:text-4xl">🏐</span>
                        VOLLEY PRO-DIVIDER
                    </h1>
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mb-4">Hệ thống cân bằng vị trí & chiến lực</p>
                </header>

                {/* TABS */}
                <div className="border-b-2 border-gray-200">
                    <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('divide-tab')}
                            className={`tab-button px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base transition duration-200 ease-in-out whitespace-nowrap ${
                                activeTab === 'divide-tab' ? 'active-tab' : ''
                            }`}
                        >
                            ⚔️ Chia Đội
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('edit-tab')}
                            className={`tab-button px-4 sm:px-6 py-3 font-semibold text-sm sm:text-base transition duration-200 ease-in-out whitespace-nowrap ${
                                activeTab === 'edit-tab' ? 'active-tab' : ''
                            }`}
                        >
                            ✏️ Chỉnh Sửa
                        </button>
                    </nav>
                </div>

                {/* TAB CONTENT */}
                {activeTab === 'divide-tab' && (
                    <DivideTab
                        togetherGroups={loadedConstraints.togetherGroups}
                        separateGroups={loadedConstraints.separateGroups}
                        onPlayersLoaded={handleDatabasePlayersSelected}
                        loadedPlayers={editablePlayers}
                    />
                )}

                {activeTab === 'edit-tab' && (
                    <EditTab
                        editablePlayers={editablePlayers}
                        loadedConstraints={loadedConstraints}
                        onUpdatePlayers={setEditablePlayers}
                    />
                )}
            </div>
        </div>
    );
}
