'use client';

import { Team } from '@/app/types/volleyball';
import { calculateTeamBalance } from '../utils/volleyUtils';
import ExcelJS from 'exceljs';

interface ResultsTableProps {
    teams: Team[];
}

export default function ResultsTable({ teams }: ResultsTableProps) {
    const exportToExcel = async () => {
        try {
            // Create workbook and worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Đội Hình');
            
            // Define background colors for each team
            const teamColors = ['92D050', 'FFD966', 'FF6B6B', 'A78BFA', 'FCA5A5', 'FCD34D'];
            
            // Set column widths
            worksheet.columns = [
                { width: 10 }, // Column A
                ...teams.map(() => ({ width: 20 })) // Team columns
            ];
            
            // Row 4: Team headers (starting from column B)
            const headerRow = worksheet.getRow(4);
            teams.forEach((team, idx) => {
                const colIndex = idx + 2; // Column B = 2, C = 3, etc.
                const cell = headerRow.getCell(colIndex);
                cell.value = `Đội ${team.id}`;
                cell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF' + teamColors[idx % teamColors.length] }
                };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
            headerRow.commit();
            
            // Rows 5-17: Team members (13 rows)
            for (let i = 0; i < 13; i++) {
                const row = worksheet.getRow(5 + i);
                teams.forEach((team, teamIdx) => {
                    const colIndex = teamIdx + 2;
                    const cell = row.getCell(colIndex);
                    if (i < team.players.length) {
                        cell.value = team.players[i].name;
                    }
                });
                row.commit();
            }
            
            // Generate file and download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chia-doi-bong-chuyen-${new Date().getTime()}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
            alert('Có lỗi khi xuất file Excel. Vui lòng thử lại!');
        }
    };

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
            <div className="p-4 bg-linear-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 rounded-xl shadow-sm mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex-1">
                        <p className="text-lg font-bold text-green-800">✅ Chia đội thành công!</p>
                        <p className="text-sm text-gray-700 mt-2">
                            Độ lệch cân bằng: <span className="font-extrabold text-red-600 text-base">
                                {balance.toFixed(2)}
                            </span>
                        </p>
                    </div>
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition duration-200 flex items-center gap-2 whitespace-nowrap text-sm"
                    >
                        <span className="text-base">📊</span>
                        <span>Xuất Excel</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
            {teams.map((team) => (
                <div key={team.id} className="border-2 border-gray-200 rounded-lg shadow-md hover:shadow-lg transition duration-200 overflow-hidden">
                    <div className="p-1.5 bg-linear-to-r from-indigo-100 to-purple-100 border-b-2 border-indigo-200">
                        <h3 className="text-xs sm:text-sm font-bold text-indigo-800 text-center">🏆 ĐỘI {team.id}</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                            <tbody className="bg-white divide-y divide-gray-100">
                                {team.players.map((p, idx) => {
                                    return (
                                        <tr key={idx} className={`transition duration-150 ${
                                            idx % 2 === 0 
                                                ? 'hover:bg-indigo-50' 
                                                : 'bg-gray-50 hover:bg-indigo-50'
                                        } text-gray-700`}>
                                            <td className="px-1.5 py-1 whitespace-nowrap font-bold text-[10px] sm:text-xs">
                                                {p.name}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
            </div>
        </>
    );
}
