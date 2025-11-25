'use client';

import { useState } from 'react';
import { Player, isAdvancePlayer } from '@/app/types/volleyball';
import { exportPlayersToJSON } from '@/app/utils/volleyUtils';
import { ROLE_OPTIONS } from '@/app/constants/volleyConstants';

interface EditTabProps {
    editablePlayers: Player[];
    loadedConstraints: { chung: string[][]; rieng: string[][] };
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onUpdatePlayers: (players: Player[]) => void;
}

export default function EditTab({
    editablePlayers,
    loadedConstraints,
    onFileSelect,
    onUpdatePlayers
}: EditTabProps) {
    const [editingRowId, setEditingRowId] = useState<number | null>(null);

    const updatePlayerField = (id: number, field: string, value: any) => {
        onUpdatePlayers(editablePlayers.map(p =>
            p.id === id ? { ...p, [field]: value } : p
        ));
    };

    const editRow = (id: number) => {
        setEditingRowId(id);
    };

    const saveRow = (id: number) => {
        setEditingRowId(null);
    };

    const deleteRow = (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa người chơi này?")) {
            onUpdatePlayers(editablePlayers.filter(p => p.id !== id));
        }
    };

    const handleExport = () => {
        exportPlayersToJSON(editablePlayers, loadedConstraints, 'modified_players_data.json');
        alert("Đã xuất file modified_players_data.json thành công!");
    };

    return (
        <div className="space-y-6">
            {/* Load Section */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    1️⃣ Tải & Xem Dữ Liệu
                </h2>
                <label className="grow flex items-center justify-center bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl cursor-pointer transition duration-200 shadow-lg hover:shadow-xl btn-hover">
                    <input
                        type="file"
                        accept=".json"
                        onChange={onFileSelect}
                        className="hidden"
                    />
                    <span className="text-sm sm:text-base">📂 Tải File JSON Để Chỉnh Sửa</span>
                </label>
            </section>

            {/* Edit Table Section */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    2️⃣ Bảng Chỉnh Sửa
                </h2>
                {editablePlayers.length > 0 && (
                    <div className="overflow-x-auto custom-scroll max-h-[50vh] rounded-xl border border-gray-200">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-linear-to-r from-gray-700 to-gray-800 text-white sticky top-0">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-bold uppercase">Tên</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold uppercase">Vị trí</th>
                                    <th className="px-3 py-3 text-left text-xs font-bold uppercase">Vị trí phụ</th>
                                    {editablePlayers.length > 0 && isAdvancePlayer(editablePlayers[0]) && (
                                        <>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase">Chuyền</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase">Công</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase">Thủ</th>
                                        </>
                                    )}
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {editablePlayers.map((p) => (
                                    <tr
                                        key={p.id}
                                        className={`transition duration-150 ${editingRowId === p.id ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'hover:bg-gray-50'}`}
                                    >
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {editingRowId === p.id ? (
                                                <input
                                                    type="text"
                                                    value={p.name}
                                                    onChange={(e) => updatePlayerField(p.id!, 'name', e.target.value)}
                                                    className="editable-input"
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className="font-semibold">{p.name}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {editingRowId === p.id ? (
                                                <select
                                                    value={p.position}
                                                    onChange={(e) => updatePlayerField(p.id!, 'position', e.target.value)}
                                                    className="editable-input"
                                                >
                                                    {ROLE_OPTIONS.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-sm">{p.position}</span>
                                            )}
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            {editingRowId === p.id ? (
                                                <select
                                                    value={p.sub_position}
                                                    onChange={(e) => updatePlayerField(p.id!, 'sub_position', e.target.value)}
                                                    className="editable-input"
                                                >
                                                    <option value="">—</option>
                                                    {ROLE_OPTIONS.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="text-sm">{p.sub_position || '—'}</span>
                                            )}
                                        </td>
                                        {isAdvancePlayer(p) && (
                                            <>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {editingRowId === p.id ? (
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="10"
                                                            value={p.chuyen}
                                                            onChange={(e) => updatePlayerField(p.id!, 'chuyen', parseFloat(e.target.value) || 0)}
                                                            className="editable-input"
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-indigo-600">{p.chuyen}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {editingRowId === p.id ? (
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="10"
                                                            value={p.cong}
                                                            onChange={(e) => updatePlayerField(p.id!, 'cong', parseFloat(e.target.value) || 0)}
                                                            className="editable-input"
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-indigo-600">{p.cong}</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    {editingRowId === p.id ? (
                                                        <input
                                                            type="number"
                                                            step="0.5"
                                                            min="0"
                                                            max="10"
                                                            value={p.thu}
                                                            onChange={(e) => updatePlayerField(p.id!, 'thu', parseFloat(e.target.value) || 0)}
                                                            className="editable-input"
                                                        />
                                                    ) : (
                                                        <span className="font-medium text-indigo-600">{p.thu}</span>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        <td className="px-3 py-3 text-center">
                                            <div className="flex justify-center space-x-2">
                                                {editingRowId === p.id ? (
                                                    <button
                                                        onClick={() => saveRow(p.id!)}
                                                        className="text-green-600 hover:text-green-800 font-bold transition duration-150 btn-hover"
                                                        title="Lưu"
                                                    >
                                                        ✓
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => editRow(p.id!)}
                                                        className="text-blue-600 hover:text-blue-800 font-bold transition duration-150 btn-hover"
                                                        title="Sửa"
                                                    >
                                                        ✎
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteRow(p.id!)}
                                                    className="text-red-600 hover:text-red-800 font-bold transition duration-150 btn-hover"
                                                    title="Xóa"
                                                >
                                                    🗑️
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <p className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                    👥 Tổng số người chơi: <span className="font-bold text-indigo-600">{editablePlayers.length}</span>
                </p>

                {editablePlayers.length > 0 && (
                    <div className="text-center pt-4">
                        <button
                            onClick={handleExport}
                            className="py-3 px-8 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition duration-200 btn-hover"
                        >
                            ⬇️ Xuất File JSON Đã Sửa
                        </button>
                    </div>
                )}
            </section>
        </div>
    );
}
