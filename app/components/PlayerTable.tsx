'use client';

import { Player, isAdvancePlayer, isBasicPlayer } from '@/app/types/volleyball';
import { calculateOPS, calculateBasicOPS } from '@/app/utils/volleyUtils';

interface PlayerTableProps {
    players: Player[];
    title: string;
    showOPS?: boolean;
    mode?: 'advance' | 'basic';
}

export default function PlayerTable({ players, title, showOPS = true, mode = 'advance' }: PlayerTableProps) {
    if (players.length === 0) {
        return null;
    }

    return (
        <div className="overflow-x-auto custom-scroll max-h-96 rounded-xl border border-gray-200">
            <table className="w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-indigo-500 to-indigo-600 text-white sticky top-0">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tên</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Vị trí Gốc</th>
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Vị trí Phụ</th>
                        {showOPS && (
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">
                                {mode === 'basic' ? 'Cấp Độ' : 'OPS'}
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {players.map((p, idx) => (
                        <tr key={idx} className={`transition duration-150 ${
                            idx % 2 === 0 ? 'hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-50'
                        } text-gray-700`}>
                            <td className="px-4 py-3 whitespace-nowrap font-semibold">{p.name || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{p.position || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{p.sub_position || '—'}</td>
                            {showOPS && (
                                <td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">
                                    {mode === 'basic' && isBasicPlayer(p) 
                                        ? `${p.position_tier.tier}` 
                                        : isAdvancePlayer(p) ? calculateOPS(p).toFixed(2) : calculateBasicOPS(p).toFixed(2)
                                    }
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
