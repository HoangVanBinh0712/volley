/**
 * Volleyball Team Divider Utilities
 * Contains core logic for team calculations and divisions
 */

import { Player, AdvancePlayer, BasicPlayer, Team, PlayerTier, isAdvancePlayer, isBasicPlayer } from '@/app/types/volleyball';

// OPS calculation weights for Advance mode
const OPS_WEIGHTS = {
    CHUYEN: 6,
    CONG: 20,
    THU: 4
};

// Tier to score mapping for Basic mode
const TIER_SCORES: Record<string, number> = {
    'S': 95,
    'A+': 85,
    'A': 75,
    'B+': 65,
    'B': 55,
    'C+': 45,
    'C': 35
};

/**
 * Calculate OPS for Advance player (weighted sum of skills)
 */
export function calculateOPS(p: AdvancePlayer): number {
    return (
        (p.chuyen * OPS_WEIGHTS.CHUYEN) +
        (p.cong * OPS_WEIGHTS.CONG) +
        (p.thu * OPS_WEIGHTS.THU)
    );
}

/**
 * Calculate OPS for Basic player (average of position and sub_position tier scores)
 */
export function calculateBasicOPS(p: BasicPlayer): number {
    const positionScore = TIER_SCORES[p.position_tier.tier] || 0;
    const subPositionScore = TIER_SCORES[p.sub_position_tier.tier] || 0;
    return (positionScore + subPositionScore) / 2;
}

/**
 * Generates team division results with mode selection
 * Supports both Advance (skill-based) and Basic (tier-based) modes
 */
export function generateMockResults(
    nTeams: number,
    players: Player[],
    mode: 'advance' | 'basic' = 'advance',
    togetherGroups: string[][] = [],
    separateGroups: string[][] = []
): Team[] {
    if (mode === 'basic') {
        const basicPlayers = players as BasicPlayer[];
        return divideTeamsBasic(nTeams, basicPlayers, togetherGroups, separateGroups);
    } else {
        const advancePlayers = players as AdvancePlayer[];
        return divideTeamsWithConstraints(nTeams, advancePlayers, togetherGroups, separateGroups);
    }
}

/**
 * Shuffles an array in place using Fisher-Yates algorithm
 */
function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * Core division algorithm with constraint support
 * Implements mandatory role balancing and group handling with randomization
 */
function divideTeamsWithConstraints(
    nTeams: number,
    players: Player[],
    togetherGroups: string[][] = [],
    separateGroups: string[][] = []
): Team[] {
    const mandatoryRoles = ["Setter", "Spiker", "Libero"];

    // Normalize positions and add OPS to working copies
    const workingPlayers = (players as AdvancePlayer[]).map(p => ({
        ...p,
        ops: calculateOPS(p),
        finalPosition: normalizeRole(p.position || p.sub_position || "")
    }));

    // Auto-balance roles
    autoBalanceRoles(workingPlayers, nTeams, mandatoryRoles);

    // Initialize teams
    const teams: Team[] = Array.from({ length: nTeams }, (_, i) => ({
        id: i + 1,
        players: [],
        totalOPS: '0'
    }));

    const assignedNames = new Set<string>();

    // 1. Assign mandatory roles first (ensures each team has key positions)
    for (const role of mandatoryRoles) {
        let candidates = workingPlayers
            .filter((p) => p.finalPosition === role && !assignedNames.has(p.name))
            .sort((a, b) => b.ops - a.ops);
        
        // Randomize candidates while keeping top performers more likely
        candidates = shuffleArray(candidates).sort(() => Math.random() - 0.3);

        while (true) {
            const missingTeams = getTeamsMissingRole(teams, role);
            if (missingTeams.length === 0 || candidates.length === 0) break;

            const targetTeamIdx = getTeamWithLowestOPS(teams, missingTeams);
            assignPlayerToTeam(teams, candidates[0], targetTeamIdx, assignedNames);
            candidates.shift();
        }
    }

    // 2. Handle remaining together groups (players who must be together)
    for (const group of togetherGroups) {
        if (!group.some((name) => assignedNames.has(name))) {
            const targetIdx = getTeamWithLowestOPS(
                teams,
                Array.from({ length: nTeams }, (_, i) => i)
            );
            for (const name of group) {
                const player = workingPlayers.find((p) => p.name === name);
                if (player) {
                    assignPlayerToTeam(teams, player, targetIdx, assignedNames);
                }
            }
        }
    }

    // 3. Handle separate groups (players who should be separated)
    for (const pair of separateGroups) {
        if (pair.length < 2) continue;
        const p1 = workingPlayers.find((p) => p.name === pair[0]);
        const p2 = workingPlayers.find((p) => p.name === pair[1]);

        if (p1 && p2 && !assignedNames.has(p1.name) && !assignedNames.has(p2.name)) {
            const availableTeams = Array.from({ length: nTeams }, (_, i) => i)
                .sort((a, b) => parseFloat(teams[a].totalOPS) - parseFloat(teams[b].totalOPS));

            assignPlayerToTeam(teams, p1, availableTeams[0], assignedNames);

            if (availableTeams.length > 1) {
                assignPlayerToTeam(teams, p2, availableTeams[1], assignedNames);
            }
        }
    }

    // 4. Fill remaining players (balancing by OPS with randomization)
    let remaining = workingPlayers
        .filter((p) => !assignedNames.has(p.name))
        .sort((a, b) => b.ops - a.ops);
    
    // Randomize remaining players while keeping better players weighted higher
    remaining = shuffleArray(remaining).sort(() => Math.random() - 0.35);

    for (const player of remaining) {
        const targetIdx = getTeamWithLowestOPS(
            teams,
            Array.from({ length: nTeams }, (_, i) => i)
        );
        assignPlayerToTeam(teams, player, targetIdx, assignedNames);
    }

    return teams;
}

/**
 * Basic mode division algorithm (tier-based)
 * Implements mandatory role balancing for basic players using tier scores
 */
function divideTeamsBasic(
    nTeams: number,
    players: BasicPlayer[],
    togetherGroups: string[][] = [],
    separateGroups: string[][] = []
): Team[] {
    const mandatoryRoles = ["Setter", "Spiker", "Libero"];

    // Normalize positions and add OPS (calculated from tiers) to working copies
    const workingPlayers = players.map(p => ({
        ...p,
        ops: calculateBasicOPS(p),
        finalPosition: normalizeRole(p.position || p.sub_position || "")
    }));

    // Auto-balance roles
    autoBalanceRoles(workingPlayers, nTeams, mandatoryRoles);

    // Initialize teams
    const teams: Team[] = Array.from({ length: nTeams }, (_, i) => ({
        id: i + 1,
        players: [],
        totalOPS: '0'
    }));

    const assignedNames = new Set<string>();

    // 1. Assign mandatory roles first (ensures each team has key positions)
    for (const role of mandatoryRoles) {
        let candidates = workingPlayers
            .filter((p) => p.finalPosition === role && !assignedNames.has(p.name))
            .sort((a, b) => b.ops - a.ops);
        
        // Randomize candidates while keeping top performers more likely
        candidates = shuffleArray(candidates).sort(() => Math.random() - 0.3);

        while (true) {
            const missingTeams = getTeamsMissingRole(teams, role);
            if (missingTeams.length === 0 || candidates.length === 0) break;

            const targetTeamIdx = getTeamWithLowestOPS(teams, missingTeams);
            assignPlayerToTeam(teams, candidates[0], targetTeamIdx, assignedNames);
            candidates.shift();
        }
    }

    // 2. Handle remaining together groups (players who must be together)
    for (const group of togetherGroups) {
        if (!group.some((name) => assignedNames.has(name))) {
            const targetIdx = getTeamWithLowestOPS(
                teams,
                Array.from({ length: nTeams }, (_, i) => i)
            );
            for (const name of group) {
                const player = workingPlayers.find((p) => p.name === name);
                if (player) {
                    assignPlayerToTeam(teams, player, targetIdx, assignedNames);
                }
            }
        }
    }

    // 3. Handle separate groups (players who should be separated)
    for (const pair of separateGroups) {
        if (pair.length < 2) continue;
        const p1 = workingPlayers.find((p) => p.name === pair[0]);
        const p2 = workingPlayers.find((p) => p.name === pair[1]);

        if (p1 && p2 && !assignedNames.has(p1.name) && !assignedNames.has(p2.name)) {
            const availableTeams = Array.from({ length: nTeams }, (_, i) => i)
                .sort((a, b) => parseFloat(teams[a].totalOPS) - parseFloat(teams[b].totalOPS));

            assignPlayerToTeam(teams, p1, availableTeams[0], assignedNames);

            if (availableTeams.length > 1) {
                assignPlayerToTeam(teams, p2, availableTeams[1], assignedNames);
            }
        }
    }

    // 4. Fill remaining players (balancing by OPS with randomization)
    let remaining = workingPlayers
        .filter((p) => !assignedNames.has(p.name))
        .sort((a, b) => b.ops - a.ops);
    
    // Randomize remaining players while keeping better players weighted higher
    remaining = shuffleArray(remaining).sort(() => Math.random() - 0.35);

    for (const player of remaining) {
        const targetIdx = getTeamWithLowestOPS(
            teams,
            Array.from({ length: nTeams }, (_, i) => i)
        );
        assignPlayerToTeam(teams, player, targetIdx, assignedNames);
    }

    return teams;
}

/**
 * Normalize role names (handles Vietnamese and English variations)
 * New roles: Setter, Spiker, Flex, Libero
 */
function normalizeRole(role: string): string {
    if (!role) return "";
    const r = role.trim().toLowerCase();
    
    // Setter mappings
    if (r === "chuyen" || r === "setter" || r === "chuyền") return "Setter";
    
    // Spiker mappings (replaces Cong_chinh, công chính)
    if (r === "cong_chinh" || r === "spiker" || r === "công chính" || r === "cong chinh") return "Spiker";
    
    // Flex mappings (replaces Cong_thu, công thủ)
    if (r === "cong_thu" || r === "flex" || r === "công thủ" || r === "cong thu") return "Flex";
    
    // Libero mappings
    if (r === "libero") return "Libero";
    
    return role;
}

/**
 * Auto-balance roles: ensures minimum required players per role
 */
function autoBalanceRoles(
    players: any[],
    nTeams: number,
    mandatoryRoles: string[]
): void {
    for (const role of mandatoryRoles) {
        const current = players.filter((p) => p.finalPosition === role).length;

        if (current < nTeams) {
            const missing = nTeams - current;
            const candidates = players
                .filter(
                    (p) =>
                        normalizeRole(p.sub_position) === role && p.finalPosition !== role
                )
                .sort((a, b) => b.ops - a.ops);

            for (let i = 0; i < missing && i < candidates.length; i++) {
                candidates[i].finalPosition = role;
            }
        }
    }
}

/**
 * Get teams that don't have players with a specific role
 */
function getTeamsMissingRole(teams: Team[], role: string): number[] {
    return teams
        .map((_, idx) => idx)
        .filter((idx) =>
            !teams[idx].players.some((p) =>
                normalizeRole(p.finalPosition || "") === role
            )
        );
}

/**
 * Find team with lowest total OPS from candidates
 */
function getTeamWithLowestOPS(teams: Team[], candidateIndices: number[]): number {
    if (candidateIndices.length === 0) return 0;
    return candidateIndices.reduce((lowestIdx, idx) =>
        parseFloat(teams[idx].totalOPS) < parseFloat(teams[lowestIdx].totalOPS) ? idx : lowestIdx
    );
}

/**
 * Assign player to team and handle group constraints
 */
function assignPlayerToTeam(
    teams: Team[],
    player: any,
    teamIdx: number,
    assignedNames: Set<string>
): void {
    if (assignedNames.has(player.name)) return;

    const playerData = {
        name: player.name,
        finalPosition: player.finalPosition,
        subPosition: player.sub_position,
        ops: player.ops.toFixed(2),
        // attach tier names for basic-mode players when available
        positionTier: player.position_tier?.tier,
        subPositionTier: player.sub_position_tier?.tier
    };

    teams[teamIdx].players.push(playerData);
    teams[teamIdx].totalOPS = (parseFloat(teams[teamIdx].totalOPS) + player.ops).toFixed(2);
    assignedNames.add(player.name);
}

/**
 * Calculates balance metric for team division
 * Returns the difference between strongest and weakest team
 */
export function calculateTeamBalance(teams: Team[]): number {
    if (teams.length === 0) return 0;
    
    const opsValues = teams.map(t => parseFloat(t.totalOPS));
    return Math.max(...opsValues) - Math.min(...opsValues);
}

/**
 * Validates player data structure
 */
/**
 * Validates if data is valid AdvancePlayer format
 */
export function isValidAdvancePlayerData(data: any): boolean {
    return (
        data &&
        Array.isArray(data.players) &&
        data.players.length > 0 &&
        data.players.every((p: any) =>
            typeof p.name === 'string' &&
            typeof p.position === 'string' &&
            typeof p.chuyen === 'number' &&
            typeof p.cong === 'number' &&
            typeof p.thu === 'number'
        )
    );
}

/**
 * Validates if data is valid BasicPlayer format
 */
export function isValidBasicPlayerData(data: any): boolean {
    return (
        data &&
        Array.isArray(data.players) &&
        data.players.length > 0 &&
        data.players.every((p: any) =>
            typeof p.name === 'string' &&
            typeof p.position === 'string' &&
            p.position_tier &&
            typeof p.position_tier.tier === 'string' &&
            typeof p.position_tier.score === 'number' &&
            p.sub_position_tier &&
            typeof p.sub_position_tier.tier === 'string' &&
            typeof p.sub_position_tier.score === 'number'
        )
    );
}

/**
 * Validates if data is valid PlayerData (either Advance or Basic format)
 * @deprecated Use isValidAdvancePlayerData or isValidBasicPlayerData instead
 */
export function isValidPlayerData(data: any): boolean {
    return (
        data &&
        Array.isArray(data.players) &&
        data.players.every((p: any) =>
            typeof p.name === 'string' &&
            typeof p.position === 'string' &&
            typeof p.chuyen === 'number' &&
            typeof p.cong === 'number' &&
            typeof p.thu === 'number'
        )
    );
}

/**
 * Exports team data to JSON format
 */
export function exportTeamsToJSON(teams: Team[], filename: string = 'teams.json'): void {
    const data = JSON.stringify(teams, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Exports player data to JSON format (supports both Advance and Basic players)
 */
export function exportPlayersToJSON(players: Player[], constraints: any, filename: string = 'players.json'): void {
    const cleanedPlayers = players.map(p => {
        if (isAdvancePlayer(p)) {
            return {
                name: p.name,
                position: p.position,
                sub_position: p.sub_position,
                chuyen: parseFloat(p.chuyen.toString()),
                cong: parseFloat(p.cong.toString()),
                thu: parseFloat(p.thu.toString())
            };
        } else {
            return {
                nickName: p.nickName,
                name: p.name,
                position: p.position,
                position_tier: p.position_tier,
                sub_position: p.sub_position,
                sub_position_tier: p.sub_position_tier
            };
        }
    });

    const exportData = {
        players: cleanedPlayers,
        togetherGroups: constraints.togetherGroups || [],
        separateGroups: constraints.separateGroups || []
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
