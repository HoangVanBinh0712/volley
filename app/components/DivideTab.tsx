'use client';

import { useState } from 'react';
import { Player, Team } from '@/app/types/volleyball';
import { generateResults } from '../utils/volleyUtils';
import PlayerTable from './PlayerTable';
import ResultsTable from './ResultsTable';
import PlayerSelection from './PlayerSelection';
import ConstraintManager from './ConstraintManager';

interface DivideTabProps {
    loadedPlayers: Player[];
    loadFileText: string;
    onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
    numTeams: number;
    togetherGroups?: string[][];
    separateGroups?: string[][];
}

export default function DivideTab({ loadedPlayers, loadFileText, onFileSelect, numTeams, togetherGroups = [], separateGroups = [] }: DivideTabProps) {
    const [results, setResults] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [randomize, setRandomize] = useState<boolean>(false);
    const [databasePlayers, setDatabasePlayers] = useState<Player[]>([]);
    const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>([]);
    const [togetherGroupsConstraint, setTogetherGroupsConstraint] = useState<string[][]>(togetherGroups);
    const [separateGroupsConstraint, setSeparateGroupsConstraint] = useState<string[][]>(separateGroups);
    const [teamCount, setTeamCount] = useState<number>(numTeams);

    const handleDatabasePlayersSelected = (players: Player[]) => {
        setDatabasePlayers(players);
        setConfirmedPlayers(players);
    };

    const startDivision = () => {
        // Use confirmed players
        const playersToUse = confirmedPlayers.length > 0 ? confirmedPlayers : loadedPlayers;
        
        setIsLoading(true);
        setTimeout(() => {
            const mockResult = generateResults(teamCount, playersToUse, togetherGroupsConstraint, separateGroupsConstraint, randomize);
            setResults(mockResult);
            setIsLoading(false);
        }, 500);
    };

    return (
        <div className="space-y-8">
            {/* Control Section */}
            <section className="space-y-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    1️⃣ Điều Khiển & Tải Dữ Liệu
                </h2>

                {/* Database Player Selection */}
                <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-xl">
                    <h3 className="text-base font-bold text-blue-900 mb-4">📦 Tải từ Cơ Sở Dữ Liệu</h3>
                    <PlayerSelection onPlayersSelected={handleDatabasePlayersSelected} />
                </div>

                {/* Or Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-300"></div>
                    <span className="text-gray-500 font-semibold text-sm">hoặc</span>
                    <div className="flex-1 h-px bg-gray-300"></div>
                </div>

                {/* File Upload */}
                <div>
                    <label className="grow flex items-center justify-center bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl cursor-pointer transition duration-200 shadow-lg hover:shadow-xl btn-hover">
                        <input
                            type="file"
                            accept=".json"
                            onChange={onFileSelect}
                            className="hidden"
                        />
                        <span className="text-sm sm:text-base">{loadFileText}</span>
                    </label>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 items-stretch sm:items-center">
                    <div className="flex items-center bg-linear-to-r from-gray-100 to-gray-50 p-3 rounded-xl border border-gray-200 space-x-4">
                        <div className="flex items-center gap-2">
                            <label className="text-gray-700 font-semibold text-sm whitespace-nowrap">Số đội:</label>
                            <input
                                type="number"
                                min="2"
                                max="6"
                                value={teamCount}
                                onChange={(e) => setTeamCount(Math.max(2, parseInt(e.target.value) || 2))}
                                className="w-16 px-2 py-2 border border-gray-300 rounded-lg font-bold text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex items-center gap-3">
                            <label className="flex items-center text-sm gap-2">
                                <input
                                    type="checkbox"
                                    checked={randomize}
                                    onChange={(e) => setRandomize(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <span className="text-gray-700 font-medium">Random</span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Constraints Section */}
                <ConstraintManager
                    onTogetherGroupsChange={setTogetherGroupsConstraint}
                    onSeparateGroupsChange={setSeparateGroupsConstraint}
                    initialTogetherGroups={togetherGroupsConstraint}
                    initialSeparateGroups={separateGroupsConstraint}
                />

                <button
                    onClick={startDivision}
                    disabled={(loadedPlayers.length === 0 && databasePlayers.length === 0 && confirmedPlayers.length === 0) || teamCount < 2}
                    className="w-full py-4 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition duration-200 btn-hover disabled:cursor-not-allowed"
                >
                    ▶️ CHIA ĐỘI NGAY!
                </button>
            </section>

            {/* Player List Section */}
            <section className="space-y-4">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    2️⃣ Danh Sách Đã Tải
                </h2>
                {confirmedPlayers.length > 0 ? (
                    <>
                        {/* Player Table with Tier Info */}
                        <div className="overflow-x-auto custom-scroll max-h-96 rounded-xl border border-gray-200">
                            <table className="w-full divide-y divide-gray-200">
                                <thead className="bg-linear-to-r from-indigo-500 to-indigo-600 text-white sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Tên</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Vị Trí Gốc</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Cấp Độ</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Vị Trí Phụ</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Cấp Độ Phụ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {confirmedPlayers.map((p, idx) => (
                                        <tr key={idx} className={`transition duration-150 ${
                                            idx % 2 === 0 ? 'hover:bg-indigo-50' : 'bg-gray-50 hover:bg-indigo-50'
                                        } text-gray-700`}>
                                            <td className="px-4 py-3 whitespace-nowrap font-semibold">{p.name || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{p.position || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">{p.position_tier || '-'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{p.sub_position || '—'}</td>
                                            <td className="px-4 py-3 whitespace-nowrap font-bold text-indigo-600">{p.sub_position_tier || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                            👥 Tổng số người chơi: <span className="font-bold text-indigo-600">{confirmedPlayers.length}</span>
                        </p>
                    </>
                ) : databasePlayers.length > 0 ? (
                    <>
                        <PlayerTable players={databasePlayers} title="Database Players" />
                        <p className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                            👥 Tổng số người chơi từ CSDL: <span className="font-bold text-indigo-600">{databasePlayers.length}</span>
                        </p>
                    </>
                ) : loadedPlayers.length > 0 ? (
                    <>
                        <PlayerTable players={loadedPlayers} title="Players" />
                        <p className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                            👥 Tổng số người chơi từ file: <span className="font-bold text-indigo-600">{loadedPlayers.length}</span>
                        </p>
                    </>
                ) : (
                    <p className="text-sm font-medium text-gray-500 bg-gray-50 p-3 rounded-lg">
                        Chưa tải dữ liệu từ CSDL hoặc file
                    </p>
                )}
            </section>

            {/* Results Section */}
            <section className="space-y-4 pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    3️⃣ Kết Quả Đội Hình
                </h2>
                <div className="space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center space-x-2 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-indigo-200 border-t-indigo-500"></div>
                            <p className="text-lg font-semibold text-indigo-700">Đang xử lý thuật toán chia đội...</p>
                        </div>
                    ) : (
                        <ResultsTable teams={results} />
                    )}
                </div>
            </section>
        </div>
    );
}
