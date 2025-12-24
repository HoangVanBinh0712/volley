/**
 * Constants for Volleyball Team Divider
 */

export const ROLE_OPTIONS = ["Setter", "Spiker", "Flex", "Libero"];

// Tier to score mapping for player ratings
export const TIER_SCORES: Record<string, number> = {
    'S': 95,
    'A+': 85,
    'A': 75,
    'B+': 65,
    'B': 55,
    'C+': 45,
    'C': 35,
    'D+': 25,
    'D': 15
};

// Extract tier keys for dropdown options
export const TIER_OPTIONS = Object.keys(TIER_SCORES);

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
