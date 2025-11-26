'use client';

import { useState } from 'react';
import { Player, Team } from '@/app/types/volleyball';
import { generateResults } from '../utils/volleyUtils';
import PlayerTable from './PlayerTable';
import ResultsTable from './ResultsTable';

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
    const [strategy, setStrategy] = useState<string>('v1');

    const startDivision = () => {
        setIsLoading(true);
            setTimeout(() => {
            const mockResult = generateResults(numTeams, loadedPlayers, togetherGroups, separateGroups, randomize, strategy);
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

                <div className="flex flex-col gap-3 sm:flex-row sm:gap-3 items-stretch sm:items-center">
                    <label className="grow flex items-center justify-center bg-linear-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl cursor-pointer transition duration-200 shadow-lg hover:shadow-xl btn-hover">
                        <input
                            type="file"
                            accept=".json"
                            onChange={onFileSelect}
                            className="hidden"
                        />
                        <span className="text-sm sm:text-base">{loadFileText}</span>
                    </label>

                        <div className="flex items-center bg-linear-to-r from-gray-100 to-gray-50 p-3 rounded-xl border border-gray-200 space-x-4">
                            <div className="flex items-center">
                                <label className="text-gray-700 font-semibold text-sm mr-2 whitespace-nowrap">Số đội:</label>
                                <span className="font-bold text-indigo-600">{numTeams >= 2 ? numTeams : '—'}</span>
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

                                <label className="flex items-center text-sm gap-2">
                                    <span className="text-gray-700 font-medium mr-2">Strategy</span>
                                    <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="p-1 rounded border">
                                        <option value="v1">v1 (default)</option>
                                        <option value="v2">v2 (alt)</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                </div>

                <button
                    onClick={startDivision}
                    disabled={loadedPlayers.length === 0 || numTeams < 2}
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
                {loadedPlayers.length > 0 && <PlayerTable players={loadedPlayers} title="Players" />}
                <p className="text-sm font-medium text-gray-600 bg-gray-50 p-3 rounded-lg">
                    👥 Tổng số người chơi: <span className="font-bold text-indigo-600">{loadedPlayers.length}</span>
                </p>
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
