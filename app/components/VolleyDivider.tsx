'use client';

import { useState, useEffect } from 'react';
import { Player } from '@/app/types/volleyball';
import { isValidBasicPlayerData, normalizePlayerPositions } from '../utils/volleyUtils';
import { TAILWIND_STYLES } from '@/app/constants/volleyConstants';
import DivideTab from './DivideTab';
import EditTab from './EditTab';

interface Constraints {
    togetherGroups: string[][];
    separateGroups: string[][];
}

export default function VolleyDivider() {
    const [loadedPlayers, setLoadedPlayers] = useState<Player[]>([]);
    const [editablePlayers, setEditablePlayers] = useState<Player[]>([]);
    const [loadedConstraints, setLoadedConstraints] = useState<Constraints>({ togetherGroups: [], separateGroups: [] });
    const [numTeams, setNumTeams] = useState<number>(0);
    const [activeTab, setActiveTab] = useState('divide-tab');
    const [loadFileText, setLoadFileText] = useState('📂 Tải File Người Chơi (.json)');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target?.result as string);
                
                // Normalize positions in the loaded JSON before validation
                const normalized = { ...data, players: normalizePlayerPositions(data.players || []) };

                const isValid = isValidBasicPlayerData(normalized);

                if (isValid) {
                    setLoadedPlayers(normalized.players);
                    setEditablePlayers(normalized.players.map((p: Player, index: number) => ({
                        ...p,
                        id: index
                    })));
                    // support both old keys and new keys in imported JSON
                    setLoadedConstraints({
                        togetherGroups: data.togetherGroups || data.chung || [],
                        separateGroups: data.separateGroups || data.rieng || []
                    });
                    // set number of teams from import if provided
                    if (typeof data.nTeams === 'number' && data.nTeams > 0) {
                        setNumTeams(data.nTeams);
                    }
                    setLoadFileText(`📂 Đã Tải File (${data.players.length} người)`);
                    setSuccessMessage(`✅ Tải file thành công!\n👥 ${data.players.length} người chơi đã được nạp`);
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 3000);
                } else {
                    alert(`Lỗi: File JSON không hợp lệ với chế độ Basic (position_tier, sub_position_tier). Vui lòng kiểm tra định dạng dữ liệu.`);
                }
            } catch (error) {
                alert('Lỗi đọc/phân tích JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        };
        reader.readAsText(file);
    };

    const handleFileSelectEdit = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target?.result as string);
                
                // Normalize positions in the loaded JSON before validation
                const normalized = { ...data, players: normalizePlayerPositions(data.players || []) };

                const isValid = isValidBasicPlayerData(normalized);

                if (isValid) {
                    setEditablePlayers(normalized.players.map((p: Player, index: number) => ({
                        ...p,
                        id: index
                    })));
                    setLoadedConstraints({
                        togetherGroups: data.togetherGroups || data.chung || [],
                        separateGroups: data.separateGroups || data.rieng || []
                    });
                    if (typeof data.nTeams === 'number' && data.nTeams > 0) {
                        setNumTeams(data.nTeams);
                    }
                    setSuccessMessage(`✅ Tải file thành công!\n👥 ${data.players.length} người chơi đã được nạp`);
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 3000);
                } else {
                    alert(`Lỗi: File JSON không hợp lệ với chế độ Basic (position_tier, sub_position_tier). Vui lòng kiểm tra định dạng dữ liệu.`);
                }
            } catch (error) {
                alert('Lỗi đọc/phân tích JSON: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        };
        reader.readAsText(file);
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
                        loadedPlayers={loadedPlayers}
                        loadFileText={loadFileText}
                        onFileSelect={handleFileSelect}
                        numTeams={numTeams}
                        togetherGroups={loadedConstraints.togetherGroups}
                        separateGroups={loadedConstraints.separateGroups}
                    />
                )}

                {activeTab === 'edit-tab' && (
                    <EditTab
                        editablePlayers={editablePlayers}
                        loadedConstraints={loadedConstraints}
                        onFileSelect={handleFileSelectEdit}
                        onUpdatePlayers={setEditablePlayers}
                    />
                )}

                {/* Success Toast Popup */}
                {showSuccessPopup && (
                    <div className="fixed top-4 right-4 z-50 animate-slide-in">
                        <div className="bg-white rounded-lg shadow-2xl p-4 max-w-sm border-l-4 border-green-500">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">✅</div>
                                <div className="space-y-1">
                                    {successMessage.split('\n').map((line, idx) => (
                                        <p key={idx} className={idx === 0 ? "font-semibold text-gray-800" : "text-sm text-gray-600"}>
                                            {line}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
