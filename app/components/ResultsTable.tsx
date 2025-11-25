'use client';

import { Team } from '@/app/types/volleyball';
import { calculateTeamBalance } from '@/app/utils/volleyUtils';

interface ResultsTableProps {
    teams: Team[];
    mode?: 'advance' | 'basic';
}

export default function ResultsTable({ teams, mode = 'advance' }: ResultsTableProps) {
    if (teams.length === 0) {
        return (
            <p className="text-gray-500 text-center p-6 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                📊 Kết quả chia đội sẽ hiển thị ở đây.
            </p>
        );
    }

    const balance = calculateTeamBalance(teams);

    return (
        <>
            <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl shadow-sm">
                <p className="text-lg font-bold text-green-800">✅ Chia đội thành công!</p>
                {mode !== 'basic' ? <>
                    <p className="text-sm text-gray-700 mt-2">
                        Độ lệch Chiến lực (OPS): <span className="font-extrabold text-red-600 text-base">
                            {balance.toFixed(2)}
                        </span>
                    </p>
                </> : <></>}
            </div>

            {teams.map((team) => (
                <div key={team.id} className="border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition duration-200 overflow-hidden">
                    <div className="p-4 bg-linear-to-r from-indigo-100 to-purple-100 flex justify-between items-center border-b-2 border-indigo-200">
                        <h3 className="text-xl sm:text-2xl font-bold text-indigo-800">🏆 ĐỘI {team.id}</h3>
                        <span className="text-sm sm:text-base font-bold text-indigo-700 bg-white px-4 py-2 rounded-lg">
                            {mode === 'basic' ? 'Cấp Độ' : 'OPS'}: {team.totalOPS}
                        </span>
                    </div>
                    <div className="overflow-x-auto custom-scroll">
                        <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100 border-b-2 border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">STT</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tên</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">Vị trí</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">OPS</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {team.players.map((p, idx) => (
                                    <tr key={idx} className={`transition duration-150 ${
                                        idx % 2 === 0 ? 'hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-50'
                                    } text-gray-700`}>
                                        <td className="px-4 py-3 whitespace-nowrap font-semibold text-indigo-600">{idx + 1}</td>
                                        <td className="px-4 py-3 whitespace-nowrap font-bold">{p.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className="font-semibold text-green-700">{p.finalPosition}</span>
                                            {p.finalPosition !== p.subPosition && p.subPosition && (
                                                <span className="text-red-500 text-xs block mt-1">({p.subPosition})</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">{p.ops}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </>
    );
}
