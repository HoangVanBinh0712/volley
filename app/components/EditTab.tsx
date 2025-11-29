'use client';

import { useState } from 'react';
import { Player } from '@/app/types/volleyball';
import { fetchAllPlayers, updatePlayer, deletePlayer, createPlayer } from '@/app/lib/playerQueries';
import { ROLE_OPTIONS } from '@/app/constants/volleyConstants';
import { useToast } from './ToastProvider';

interface EditTabProps {
    onUpdatePlayers: (players: Player[]) => void;
}

// Tier scores mapping
const TIER_SCORES: Record<string, number> = {
    'S': 95,
    'A+': 85,
    'A': 75,
    'B+': 65,
    'B': 55,
    'C+': 45,
    'C': 35
};

// Extract tier keys for dropdown options
const TIER_OPTIONS = Object.keys(TIER_SCORES);

interface NewPlayerForm {
    name: string;
    nickName: string;
    position: string;
    position_tier: string;
    sub_position: string;
    sub_position_tier: string;
}

const emptyNewPlayer: NewPlayerForm = {
    name: '',
    nickName: '',
    position: '',
    position_tier: '',
    sub_position: '',
    sub_position_tier: ''
};

export default function EditTab({
    onUpdatePlayers
}: EditTabProps) {
    const [players, setPlayers] = useState<Player[]>([]);
    const [editingRowId, setEditingRowId] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [deletedIds, setDeletedIds] = useState<Set<number>>(new Set());
    const [modifiedIds, setModifiedIds] = useState<Set<number>>(new Set());
    const [addedIds, setAddedIds] = useState<Set<number>>(new Set());
    const [newPlayer, setNewPlayer] = useState<NewPlayerForm>(emptyNewPlayer);
    const [isCreating, setIsCreating] = useState(false);
    const { showToast } = useToast();

    /**
     * Load players from database
     */
    const handleLoadPlayers = async () => {
        setIsLoading(true);
        try {
            const fetchedPlayers = await fetchAllPlayers();
            setPlayers(fetchedPlayers);
            onUpdatePlayers(fetchedPlayers);
            setDeletedIds(new Set());
            setModifiedIds(new Set());
            setAddedIds(new Set());
            setEditingRowId(null);
            showToast('Đã tải người chơi từ cơ sở dữ liệu thành công!', 'success');
        } catch (error) {
            showToast('Lỗi tải người chơi: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Update player field in local state
     */
    const updatePlayerField = (id: number, field: string, value: any) => {
        const updatedPlayers = players.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        );
        setPlayers(updatedPlayers);
        setModifiedIds(prev => new Set(prev).add(id));
    };

    const editRow = (id: number) => {
        setEditingRowId(id);
    };

    const saveRow = (id: number) => {
        setEditingRowId(null);
    };

    /**
     * Mark player for deletion (red row) or remove from local state if new
     */
    const markForDeletion = (id: number) => {
        // If it's a new player (negative ID), just remove it from state immediately
        if (id < 0) {
            setPlayers(prev => prev.filter(p => p.id !== id));
            setAddedIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(id);
                return newSet;
            });
            return;
        }
        
        // For existing DB players, mark for deletion
        setDeletedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    /**
     * Save all changes and deletions to database
     */
    const handleSaveAll = async () => {
        setIsSaving(true);
        try {
            // Create new players (with negative IDs)
            for (const id of addedIds) {
                const player = players.find(p => p.id === id);
                if (player && id < 0) {
                    await createPlayer({
                        name: player.name,
                        nickName: player.nickName,
                        position: player.position,
                        position_tier: player.position_tier,
                        sub_position: player.sub_position,
                        sub_position_tier: player.sub_position_tier
                    });
                }
            }

            // Delete marked players (only real DB players with positive IDs)
            for (const id of deletedIds) {
                if (id > 0) {
                    await deletePlayer(id);
                }
            }

            // Update modified players (only real DB players with positive IDs)
            for (const id of modifiedIds) {
                if (id > 0) {
                    const player = players.find(p => p.id === id);
                    if (player) {
                        await updatePlayer(id, player);
                    }
                }
            }

            // Reload from database to get fresh data
            const fetchedPlayers = await fetchAllPlayers();
            setPlayers(fetchedPlayers);
            onUpdatePlayers(fetchedPlayers);
            setDeletedIds(new Set());
            setModifiedIds(new Set());
            setAddedIds(new Set());
            showToast('Đã lưu tất cả thay đổi thành công!', 'success');
        } catch (error) {
            showToast('Lỗi lưu thay đổi: ' + (error instanceof Error ? error.message : 'Unknown error'), 'error');
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Handle new player creation - add to local state only, not to DB yet
     */
    const handleCreatePlayer = () => {
        // Validate required fields: name, nickname, position, position_tier
        if (!newPlayer.name.trim()) {
            showToast('Vui lòng nhập tên người chơi!', 'warning');
            return;
        }
        
        if (!newPlayer.nickName.trim()) {
            showToast('Vui lòng nhập biệt danh người chơi!', 'warning');
            return;
        }
        
        if (!newPlayer.position) {
            showToast('Vui lòng chọn vị trí cho người chơi!', 'warning');
            return;
        }
        
        if (!newPlayer.position_tier) {
            showToast('Vui lòng chọn cấp độ vị trí cho người chơi!', 'warning');
            return;
        }

        // Check for duplicate name
        const duplicateName = players.find(
            p => p.name.toLowerCase().trim() === newPlayer.name.toLowerCase().trim()
        );
        if (duplicateName) {
            showToast(`Tên "${newPlayer.name}" đã tồn tại trong danh sách!`, 'error');
            return;
        }

        // Check for duplicate nickname
        const duplicateNickname = players.find(
            p => p.nickName.toLowerCase().trim() === newPlayer.nickName.toLowerCase().trim()
        );
        if (duplicateNickname) {
            showToast(`Biệt danh "${newPlayer.nickName}" đã tồn tại trong danh sách!`, 'error');
            return;
        }

        // Create temporary player with negative ID to distinguish from DB players
        const tempId = -(Date.now());
        const tempPlayer: Player = {
            id: tempId,
            name: newPlayer.name,
            nickName: newPlayer.nickName,
            position: newPlayer.position,
            position_tier: newPlayer.position_tier || 'C',
            sub_position: newPlayer.sub_position || '',
            sub_position_tier: newPlayer.sub_position_tier || ''
        };

        // Add to local state and mark as added
        setPlayers(prev => [...prev, tempPlayer]);
        setAddedIds(prev => new Set(prev).add(tempId));
        setNewPlayer(emptyNewPlayer);
        setIsCreating(false);
    };

    return (
        <div className="space-y-6">
            {/* Load and Save Section */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    1️⃣ Quản Lý Dữ Liệu
                </h2>
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleLoadPlayers}
                        disabled={isLoading || isSaving}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                        {isLoading ? '⟳ Đang tải...' : '📥 Tải người chơi'}
                    </button>
                    {(modifiedIds.size > 0 || deletedIds.size > 0 || addedIds.size > 0) && (
                        <button
                            onClick={handleSaveAll}
                            disabled={isSaving}
                            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                        >
                            {isSaving ? '⟳ Đang lưu...' : `💾 Lưu Thay Đổi (${modifiedIds.size + deletedIds.size + addedIds.size})`}
                        </button>
                    )}
                </div>
            </section>

            {/* Edit Table Section */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    2️⃣ Chỉnh Sửa Dữ Liệu
                </h2>
                
                {players.length === 0 ? (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                        <p className="text-gray-600 mb-2">📦 Chưa có dữ liệu để chỉnh sửa</p>
                        <p className="text-sm text-gray-500">Vui lòng nhấn "📥 Tải từ Cơ Sở Dữ Liệu" để bắt đầu</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto custom-scroll max-h-[50vh] rounded-xl border border-gray-200">
                            <table className="w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-linear-to-r from-gray-700 to-gray-800 text-white sticky top-0">
                                    <tr>
                                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase w-32">Tên</th>
                                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase w-32">Biệt Danh</th>
                                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase w-28">Vị Trí</th>
                                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase w-24">Cấp Độ</th>
                                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase w-28">Vị Trí Phụ</th>
                                        <th className="px-2 sm:px-4 py-2 text-left text-xs sm:text-sm font-bold uppercase w-28">Cấp Độ Phụ</th>
                                        <th className="px-2 sm:px-4 py-2 text-center text-xs sm:text-sm font-bold uppercase w-32">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100 text-gray-900">
                                    {players.map((p) => (
                                        <tr
                                            key={p.id}
                                            className={`transition duration-150 ${
                                                deletedIds.has(p.id || 0) 
                                                    ? 'bg-red-100 border-l-4 border-red-600' 
                                                    : addedIds.has(p.id || 0)
                                                    ? 'bg-green-100 border-l-4 border-green-600'
                                                    : modifiedIds.has(p.id || 0)
                                                    ? 'bg-blue-100 border-l-4 border-blue-600'
                                                    : editingRowId === p.id 
                                                    ? 'bg-yellow-50 border-l-4 border-yellow-400' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {editingRowId === p.id ? (
                                                    <input
                                                        type="text"
                                                        value={p.name}
                                                        onChange={(e) => updatePlayerField(p.id!, 'name', e.target.value)}
                                                        className="editable-input"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className={`font-semibold text-xs ${deletedIds.has(p.id || 0) ? 'line-through text-red-700' : ''}`}>
                                                        {p.name}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {editingRowId === p.id ? (
                                                    <input
                                                        type="text"
                                                        value={p.nickName || ''}
                                                        onChange={(e) => updatePlayerField(p.id!, 'nickName', e.target.value)}
                                                        className="editable-input text-xs"
                                                    />
                                                ) : (
                                                    <span className={`text-xs ${deletedIds.has(p.id || 0) ? 'line-through text-red-700' : ''}`}>
                                                        {p.nickName || '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {editingRowId === p.id ? (
                                                    <select
                                                        value={p.position}
                                                        onChange={(e) => updatePlayerField(p.id!, 'position', e.target.value)}
                                                        className="editable-input text-xs"
                                                    >
                                                        {ROLE_OPTIONS.map(role => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`text-xs ${deletedIds.has(p.id || 0) ? 'line-through text-red-700' : ''}`}>
                                                        {p.position}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {editingRowId === p.id ? (
                                                    <select
                                                        value={p.position_tier || ''}
                                                        onChange={(e) => updatePlayerField(p.id!, 'position_tier', e.target.value)}
                                                        className="editable-input text-xs"
                                                    >
                                                        <option value="">—</option>
                                                        {TIER_OPTIONS.map(tier => (
                                                            <option key={tier} value={tier}>{tier}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`text-xs font-semibold text-indigo-600 ${deletedIds.has(p.id || 0) ? 'line-through text-red-700' : ''}`}>
                                                        {p.position_tier || '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {editingRowId === p.id ? (
                                                    <select
                                                        value={p.sub_position || ''}
                                                        onChange={(e) => updatePlayerField(p.id!, 'sub_position', e.target.value)}
                                                        className="editable-input text-xs"
                                                    >
                                                        <option value="">—</option>
                                                        {ROLE_OPTIONS.map(role => (
                                                            <option key={role} value={role}>{role}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`text-xs ${deletedIds.has(p.id || 0) ? 'line-through text-red-700' : ''}`}>
                                                        {p.sub_position || '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 whitespace-nowrap">
                                                {editingRowId === p.id ? (
                                                    <select
                                                        value={p.sub_position_tier || ''}
                                                        onChange={(e) => updatePlayerField(p.id!, 'sub_position_tier', e.target.value)}
                                                        className="editable-input text-xs"
                                                    >
                                                        <option value="">—</option>
                                                        {TIER_OPTIONS.map(tier => (
                                                            <option key={tier} value={tier}>{tier}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`text-xs font-semibold text-indigo-600 ${deletedIds.has(p.id || 0) ? 'line-through text-red-700' : ''}`}>
                                                        {p.sub_position_tier || '—'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <div className="flex justify-center gap-1 flex-wrap">
                                                    {editingRowId === p.id ? (
                                                        <button
                                                            onClick={() => saveRow(p.id!)}
                                                            disabled={isSaving}
                                                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-xs sm:text-sm font-semibold rounded-lg transition duration-150 disabled:cursor-not-allowed shadow-sm"
                                                        >
                                                            Lưu
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => editRow(p.id!)}
                                                            disabled={isSaving || deletedIds.has(p.id || 0)}
                                                            className="px-2 py-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-xs sm:text-sm font-semibold rounded-lg transition duration-150 disabled:cursor-not-allowed shadow-sm"
                                                        >
                                                            Sửa
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => markForDeletion(p.id!)}
                                                        disabled={isSaving}
                                                        className={`px-2 py-1 text-white text-xs sm:text-sm font-semibold rounded-lg transition duration-150 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-sm ${
                                                            deletedIds.has(p.id || 0)
                                                                ? 'bg-amber-500 hover:bg-amber-600'
                                                                : 'bg-red-500 hover:bg-red-600'
                                                        }`}
                                                    >
                                                        {deletedIds.has(p.id || 0) ? 'Hủy' : 'Xóa'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* New Player Row */}
                                    {isCreating ? (
                                        <tr className="bg-green-50 border-l-4 border-green-500">
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={newPlayer.name}
                                                    onChange={(e) => setNewPlayer(prev => ({ ...prev, name: e.target.value }))}
                                                    placeholder="Tên *"
                                                    className="editable-input"
                                                    autoFocus
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={newPlayer.nickName}
                                                    onChange={(e) => setNewPlayer(prev => ({ ...prev, nickName: e.target.value }))}
                                                    placeholder="Biệt danh"
                                                    className="editable-input text-xs"
                                                />
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={newPlayer.position}
                                                    onChange={(e) => setNewPlayer(prev => ({ ...prev, position: e.target.value }))}
                                                    className="editable-input text-xs"
                                                >
                                                    <option value="">Chọn vị trí *</option>
                                                    {ROLE_OPTIONS.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={newPlayer.position_tier}
                                                    onChange={(e) => setNewPlayer(prev => ({ ...prev, position_tier: e.target.value }))}
                                                    className="editable-input text-xs"
                                                >
                                                    <option value="">Chọn cấp độ</option>
                                                    {TIER_OPTIONS.map(tier => (
                                                        <option key={tier} value={tier}>{tier}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={newPlayer.sub_position}
                                                    onChange={(e) => setNewPlayer(prev => ({ ...prev, sub_position: e.target.value }))}
                                                    className="editable-input text-xs"
                                                >
                                                    <option value="">Chọn vị trí phụ</option>
                                                    {ROLE_OPTIONS.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2">
                                                <select
                                                    value={newPlayer.sub_position_tier}
                                                    onChange={(e) => setNewPlayer(prev => ({ ...prev, sub_position_tier: e.target.value }))}
                                                    className="editable-input text-xs"
                                                >
                                                    <option value="">Chọn cấp độ phụ</option>
                                                    {TIER_OPTIONS.map(tier => (
                                                        <option key={tier} value={tier}>{tier}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-2 py-2 text-center">
                                                <div className="flex justify-center gap-1 flex-wrap">
                                                    <button
                                                        onClick={handleCreatePlayer}
                                                        disabled={isSaving}
                                                        className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-xs sm:text-sm font-semibold rounded transition duration-150 disabled:cursor-not-allowed"
                                                    >
                                                        Lưu
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsCreating(false);
                                                            setNewPlayer(emptyNewPlayer);
                                                        }}
                                                        disabled={isSaving}
                                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-xs sm:text-sm font-semibold rounded transition duration-150 disabled:cursor-not-allowed"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr
                                            onClick={() => setIsCreating(true)}
                                            className="bg-gray-50 hover:bg-blue-50 cursor-pointer transition duration-150"
                                        >
                                            <td colSpan={7} className="px-2 py-3 text-center text-gray-500 hover:text-blue-600 font-medium">
                                                ➕ Nhấn để thêm người chơi mới
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                                👥 Tổng số người chơi: <span className="font-bold text-indigo-600">{players.length}</span>
                            </p>
                            {(modifiedIds.size > 0 || deletedIds.size > 0 || addedIds.size > 0) && (
                                <p className="text-sm font-medium text-orange-600 bg-orange-50 p-3 rounded-lg">
                                    ⚠️ Thay đổi chưa lưu: <span className="font-bold">{modifiedIds.size + deletedIds.size + addedIds.size}</span>
                                </p>
                            )}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
}
