'use client';

import { useState } from 'react';
import { Player, Team } from '@/app/types/volleyball';
import { generateResults } from '../utils/volleyUtils';
import PlayerTable from './PlayerTable';
import ResultsTable from './ResultsTable';
import PlayerSelection from './PlayerSelection';
import ConstraintManager from './ConstraintManager';
import { useToast } from './ToastProvider';

interface DivideTabProps {
    togetherGroups?: string[][];
    separateGroups?: string[][];
    onPlayersLoaded?: (players: Player[]) => void;
    loadedPlayers?: Player[];
}

export default function DivideTab({ 
    togetherGroups = [], 
    separateGroups = [],
    onPlayersLoaded,
    loadedPlayers = []
}: DivideTabProps) {
    const [results, setResults] = useState<Team[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [randomize, setRandomize] = useState<boolean>(false);
    const [confirmedPlayers, setConfirmedPlayers] = useState<Player[]>(loadedPlayers);
    const [togetherGroupsConstraint, setTogetherGroupsConstraint] = useState<string[][]>(togetherGroups);
    const [separateGroupsConstraint, setSeparateGroupsConstraint] = useState<string[][]>(separateGroups);
    const [teamCount, setTeamCount] = useState<number>(2);
    const { showToast } = useToast();

    const handleDatabasePlayersSelected = (players: Player[]) => {
        setConfirmedPlayers(players);
        // Notify parent component to persist the players
        onPlayersLoaded?.(players);
    };

    /**
     * Shuffle array using Fisher-Yates algorithm
     */
    const shuffleArray = <T,>(array: T[]): T[] => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    };

    const startDivision = () => {
        // Use only confirmed players from database
        if (confirmedPlayers.length === 0) {
            showToast('Vui lòng tải người chơi từ cơ sở dữ liệu trước!', 'warning');
            return;
        }
        
        setIsLoading(true);
        showToast('Đang chia đội...', 'info');
        setTimeout(() => {
            // Create a shuffled copy of selected players
            const randomizedPlayers = shuffleArray(confirmedPlayers);
            const mockResult = generateResults(teamCount, randomizedPlayers, togetherGroupsConstraint, separateGroupsConstraint, randomize);
            setResults(mockResult);
            setIsLoading(false);
            showToast(`Đã chia thành ${mockResult.length} đội thành công!`, 'success');
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Team Count Selector */}
                    <div className="bg-linear-to-br from-indigo-50 to-blue-50 p-5 rounded-xl border-2 border-indigo-200 shadow-sm">
                        <label className="block text-sm font-bold text-indigo-900 mb-3">
                            👥 Số Đội
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setTeamCount(Math.max(2, teamCount - 1))}
                                disabled={teamCount <= 2}
                                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-indigo-100 disabled:bg-gray-200 disabled:cursor-not-allowed text-indigo-600 font-bold rounded-lg border-2 border-indigo-300 transition duration-200 shadow-sm"
                            >
                                −
                            </button>
                            <div className="flex-1 text-center">
                                <span className="text-3xl font-extrabold text-indigo-600">{teamCount}</span>
                                <p className="text-xs text-gray-600 mt-1">đội</p>
                            </div>
                            <button
                                onClick={() => setTeamCount(Math.min(6, teamCount + 1))}
                                disabled={teamCount >= 6}
                                className="w-10 h-10 flex items-center justify-center bg-white hover:bg-indigo-100 disabled:bg-gray-200 disabled:cursor-not-allowed text-indigo-600 font-bold rounded-lg border-2 border-indigo-300 transition duration-200 shadow-sm"
                            >
                                +
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">Min: 2 | Max: 6</p>
                    </div>

                    {/* Random Toggle */}
                    <div className="bg-linear-to-br from-purple-50 to-pink-50 p-5 rounded-xl border-2 border-purple-200 shadow-sm">
                        <label className="block text-sm font-bold text-purple-900 mb-3">
                            🎲 Chế Độ Random
                        </label>
                        <div className="flex items-center justify-center h-[60px]">
                            <button
                                onClick={() => setRandomize(!randomize)}
                                className={`relative inline-flex items-center h-8 rounded-full w-16 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                                    randomize ? 'bg-linear-to-r from-purple-500 to-pink-500' : 'bg-gray-300'
                                }`}
                            >
                                <span
                                    className={`inline-block w-6 h-6 transform transition-transform duration-300 bg-white rounded-full shadow-md ${
                                        randomize ? 'translate-x-9' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className={`ml-3 text-lg font-bold ${randomize ? 'text-purple-600' : 'text-gray-500'}`}>
                                {randomize ? 'BẬT' : 'TẮT'}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2 text-center">
                            {randomize ? 'Vị trí ngẫu nhiên' : 'Vị trí tối ưu'}
                        </p>
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
                    disabled={confirmedPlayers.length === 0 || teamCount < 2}
                    className="w-full py-4 bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-extrabold text-lg rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition duration-200 btn-hover disabled:cursor-not-allowed"
                >
                    ▶️ CHIA ĐỘI NGAY!
                </button>
            </section>

            {/* Results Section */}
            <section className="space-y-4 pt-6 border-t-2 border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-l-4 border-red-500 pl-4">
                    2️⃣ Kết Quả Đội Hình
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
