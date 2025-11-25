/**
 * Constants for Volleyball Team Divider
 */

export const ROLE_OPTIONS = ["Cong_chinh", "Chuyen", "Libero", "Cong_thu"];

export const MOCK_DATA = {
    "players": [
        { "name": "Mạnh", "position": "Cong_chinh", "sub_position": "Chuyen", "chuyen": 7.5, "cong": 9, "thu": 7.5 },
        { "name": "Vũ", "position": "Cong_thu", "sub_position": "Cong_chinh", "chuyen": 5, "cong": 7.5, "thu": 6 },
        { "name": "Bình", "position": "Cong_thu", "sub_position": "Cong_chinh", "chuyen": 6, "cong": 7.5, "thu": 7.5 },
        { "name": "Thiện", "position": "Chuyen", "sub_position": "Cong_chinh", "chuyen": 8, "cong": 7.5, "thu": 7.5 },
        { "name": "Tân", "position": "Cong_thu", "sub_position": "Cong_chinh", "chuyen": 6, "cong": 7.5, "thu": 7 },
        { "name": "Đạt", "position": "Cong_chinh", "sub_position": "Libero", "chuyen": 6.5, "cong": 8, "thu": 7.5 },
        { "name": "Long Zu Bu", "position": "Cong_chinh", "sub_position": "Cong_thu", "chuyen": 5, "cong": 9, "thu": 6 },
        { "name": "Ý", "position": "Cong_thu", "sub_position": "", "chuyen": 6.5, "cong": 7, "thu": 6 },
        { "name": "My", "position": "Cong_thu", "sub_position": "", "chuyen": 5, "cong": 5, "thu": 6 },
        { "name": "Tuyền", "position": "Libero", "sub_position": "", "chuyen": 5, "cong": 5, "thu": 8 },
        { "name": "Thức", "position": "Chuyen", "sub_position": "Libero", "chuyen": 9, "cong": 7.5, "thu": 7.5 },
        { "name": "Ngọc", "position": "Cong_thu", "sub_position": "", "chuyen": 5, "cong": 5, "thu": 7 }
    ],
    "chung": [["Thức", "Thiện"]], 
    "rieng": [["Mạnh", "Đạt"]]
};

export const TAILWIND_STYLES = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .custom-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scroll::-webkit-scrollbar-thumb { background: #a78bfa; border-radius: 3px; }
    .custom-scroll::-webkit-scrollbar-track { background: #f3f4f6; }
    .tab-button {
        color: #6b7280;
        background-color: transparent;
        border-bottom: 3px solid transparent;
        transition: all 0.3s ease;
        position: relative;
    }
    .tab-button:hover {
        color: #4f46e5;
        border-bottom-color: #dbeafe;
    }
    .active-tab { 
        color: #4f46e5;
        background-color: #eef2ff;
        border-radius: 0.5rem 0.5rem 0 0;
        border-bottom-color: #4f46e5;
        box-shadow: 0 1px 3px rgba(79, 70, 229, 0.1);
    }
    .editable-input { 
        width: 100%; 
        padding: 6px 8px; 
        border: 2px solid #e5e7eb; 
        border-radius: 6px;
        font-size: 14px;
        transition: all 0.2s ease;
    }
    .editable-input:focus {
        border-color: #4f46e5;
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
        outline: none;
    }
    .btn-hover {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .btn-hover:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    }
    .btn-hover:active {
        transform: translateY(0);
    }
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    .animate-slide-in {
        animation: slideIn 0.3s ease-out;
    }
`;
