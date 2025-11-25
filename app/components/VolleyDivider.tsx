'use client';

import { useState, useEffect } from 'react';
import { Player, isAdvancePlayer } from '@/app/types/volleyball';
import { isValidAdvancePlayerData, isValidBasicPlayerData } from '@/app/utils/volleyUtils';
import { MOCK_DATA, TAILWIND_STYLES } from '@/app/constants/volleyConstants';
import DivideTab from './DivideTab';
import EditTab from './EditTab';

interface Constraints {
    chung: string[][];
    rieng: string[][];
}

export default function VolleyDivider() {
    const [loadedPlayers, setLoadedPlayers] = useState<Player[]>([]);
    const [editablePlayers, setEditablePlayers] = useState<Player[]>([]);
    const [loadedConstraints, setLoadedConstraints] = useState<Constraints>({ chung: [], rieng: [] });
    const [activeTab, setActiveTab] = useState('divide-tab');
    const [loadFileText, setLoadFileText] = useState('📂 Tải File Người Chơi (.json)');
    const [mode, setMode] = useState<'advance' | 'basic'>('basic');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Initialize with mock data
    useEffect(() => {
        const data = MOCK_DATA;
        setLoadedPlayers(data.players);
        setEditablePlayers(data.players.map((p, index) => {
            const player = { ...p, id: index };
            if (isAdvancePlayer(player)) {
                return {
                    ...player,
                    chuyen: player.chuyen || 0,
                    cong: player.cong || 0,
                    thu: player.thu || 0,
                };
            }
            return player;
        }));
        setLoadedConstraints({ chung: data.chung || [], rieng: data.rieng || [] });
        setLoadFileText(`📂 Đã Tải File Demo (${data.players.length} người)`);
    }, []);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target?.result as string);
                
                // Validate based on selected mode
                const isValid = mode === 'advance' 
                    ? isValidAdvancePlayerData(data)
                    : isValidBasicPlayerData(data);
                
                if (isValid) {
                    setLoadedPlayers(data.players);
                    setEditablePlayers(data.players.map((p: Player, index: number) => {
                        const player = { ...p, id: index };
                        if (isAdvancePlayer(player)) {
                            return {
                                ...player,
                                chuyen: player.chuyen || 0,
                                cong: player.cong || 0,
                                thu: player.thu || 0,
                            };
                        }
                        return player;
                    }));
                    setLoadedConstraints({ chung: data.chung || [], rieng: data.rieng || [] });
                    setLoadFileText(`📂 Đã Tải File (${data.players.length} người)`);
                    setSuccessMessage(`✅ Tải file thành công!\n👥 ${data.players.length} người chơi đã được nạp`);
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 3000);
                } else {
                    const modeText = mode === 'advance' ? 'Advance (chuyen, cong, thu)' : 'Basic (position_tier, sub_position_tier)';
                    alert(`Lỗi: File JSON không hợp lệ với chế độ ${modeText}. Vui lòng kiểm tra định dạng dữ liệu.`);
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
                
                // Validate based on selected mode
                const isValid = mode === 'advance' 
                    ? isValidAdvancePlayerData(data)
                    : isValidBasicPlayerData(data);
                
                if (isValid) {
                    setEditablePlayers(data.players.map((p: Player, index: number) => {
                        const player = { ...p, id: index };
                        if (isAdvancePlayer(player)) {
                            return {
                                ...player,
                                chuyen: player.chuyen || 0,
                                cong: player.cong || 0,
                                thu: player.thu || 0,
                            };
                        }
                        return player;
                    }));
                    setLoadedConstraints({ chung: data.chung || [], rieng: data.rieng || [] });
                    setSuccessMessage(`✅ Tải file thành công!\n👥 ${data.players.length} người chơi đã được nạp`);
                    setShowSuccessPopup(true);
                    setTimeout(() => setShowSuccessPopup(false), 3000);
                } else {
                    const modeText = mode === 'advance' ? 'Advance (chuyen, cong, thu)' : 'Basic (position_tier, sub_position_tier)';
                    alert(`Lỗi: File JSON không hợp lệ với chế độ ${modeText}. Vui lòng kiểm tra định dạng dữ liệu.`);
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
                    
                    {/* Mode Selector */}
                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <span className="text-sm font-semibold text-gray-700">Chế độ:</span>
                        <div className="flex gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="advance"
                                    checked={mode === 'advance'}
                                    onChange={(e) => setMode(e.target.value as 'advance' | 'basic')}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                                    ⚡ Advance (Chi Tiết)
                                </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="mode"
                                    value="basic"
                                    checked={mode === 'basic'}
                                    onChange={(e) => setMode(e.target.value as 'advance' | 'basic')}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                                    ⭐ Basic (Đơn Giản)
                                </span>
                            </label>
                        </div>
                    </div>
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
                        mode={mode}
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
