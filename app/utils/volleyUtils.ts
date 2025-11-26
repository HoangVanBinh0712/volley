/**
 * Volleyball Team Divider Utilities - Basic Mode Only
 * Contains core logic for team calculations and divisions
 */

import { Player, BasicPlayer, Team, isBasicPlayer } from '@/app/types/volleyball';

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
 * Calculate OPS for Basic player (average of position and sub_position tier scores)
 */
export function calculateBasicOPS(p: BasicPlayer): number {
    const positionScore = TIER_SCORES[p.position_tier] || 0;
    const subPositionScore = TIER_SCORES[p.sub_position_tier] || 0;
    return (positionScore + subPositionScore) / 2;
}

/**
 * Generates team division results for Basic mode
 */
export function generateResults(
    nTeams: number,
    players: Player[],
    togetherGroups: string[][] = [],
    separateGroups: string[][] = [],
    randomize: boolean = false,
    strategy: string = 'v1'
): Team[] {
    const basicPlayers = players as BasicPlayer[];
    return divideTeamsBasic(nTeams, basicPlayers, togetherGroups, separateGroups, randomize);
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
 * Normalize role names (handles Vietnamese and English variations)
 */
function normalizeRole(role: string): string {
    if (!role) return "";
    const r = role.trim().toLowerCase();
    if (r === "chuyen" || r === "setter" || r === "chuyền") return "Setter";
    if (r === "cong_chinh" || r === "spiker" || r === "công chính" || r === "cong chinh") return "Spiker";
    if (r === "cong_thu" || r === "flex" || r === "công thủ" || r === "cong thu") return "Flex";
    if (r === "libero") return "Libero";
    return role;
}

/**
 * Auto-balance roles: ensures minimum required players per role
 */
function autoBalanceRoles(players: any[], nTeams: number, mandatoryRoles: string[]): void {
    for (const role of mandatoryRoles) {
        const current = players.filter((p) => p.finalPosition === role).length;
        if (current < nTeams) {
            const missing = nTeams - current;
            const candidates = players
                .filter((p) => normalizeRole(p.sub_position) === role && p.finalPosition !== role)
                .sort((a, b) => b.ops - a.ops);
            for (let i = 0; i < missing && i < candidates.length; i++) {
                candidates[i].finalPosition = role;
            }
        }
    }
}

/**
 * Get total OPS for a team
 */
function getTeamTotalOps(team: Team): number {
    return team.players.reduce((sum, p) => {
        const opsStr = (p as any).ops || '0';
        return sum + parseFloat(opsStr);
    }, 0);
}

/**
 * Get teams that don't have players with a specific role
 */
function getTeamsMissingRole(teams: Team[], role: string): number[] {
    return teams
        .map((_, idx) => idx)
        .filter((idx) =>
            !teams[idx].players.some((p) => normalizeRole(p.finalPosition || "") === role)
        );
}

/**
 * Find team with lowest balance from candidates
 */
function getTeamWithLowestBalance(teams: Team[], candidateIndices: number[]): number {
    if (candidateIndices.length === 0) return 0;
    return candidateIndices.reduce((lowestIdx, idx) =>
        getTeamTotalOps(teams[idx]) < getTeamTotalOps(teams[lowestIdx]) ? idx : lowestIdx
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
        positionTier: player.position_tier,
        subPositionTier: player.sub_position_tier,
        ops: player.ops.toFixed(2)
    };
    teams[teamIdx].players.push(playerData);
    assignedNames.add(player.name);
}

/**
 * Basic mode division algorithm (tier-based)
 * Implements mandatory role balancing for basic players using tier scores
 */
function divideTeamsBasic(
    nTeams: number,
    players: BasicPlayer[],
    togetherGroups: string[][] = [],
    separateGroups: string[][] = [],
    randomize: boolean = false
): Team[] {
    const mandatoryRoles = ["Setter", "Spiker", "Libero"];

    // Normalize positions and add OPS (calculated from tiers) to working copies
    const workingPlayers = players.map(p => ({
        ...p,
        ops: calculateBasicOPS(p),
        finalPosition: normalizeRole(p.position || p.sub_position || "")
    }));

    // Initialize teams
    const teams: Team[] = Array.from({ length: nTeams }, (_, i) => ({
        id: i + 1,
        players: []
    }));

    const assignedNames = new Set<string>();

    // Helper function to get unassigned players
    const getUnassigned = () => workingPlayers.filter(p => !assignedNames.has(p.name));

    // Helper function to check if placing a player on a team violates separateGroups
    const violatesSeparate = (teamIdx: number, playerName: string): boolean => {
        const teamNames = new Set(teams[teamIdx].players.map(p => p.name));
        for (const pair of separateGroups) {
            if (pair.includes(playerName)) {
                for (const member of pair) {
                    if (member !== playerName && teamNames.has(member)) {
                        return true;
                    }
                }
            }
        }
        return false;
    };

    // STEP 1: Assign togetherGroups to empty teams
    for (const group of togetherGroups) {
        // Find first empty team
        const emptyTeamIdx = teams.findIndex(t => t.players.length === 0);
        if (emptyTeamIdx === -1) break; // No more empty teams

        // Assign all group members to this team
        for (const playerName of group) {
            const player = workingPlayers.find(p => p.name === playerName && !assignedNames.has(p.name));
            if (player) {
                assignPlayerToTeam(teams, player, emptyTeamIdx, assignedNames);
            }
        }
    }

    // STEP 2: Assign mandatory roles (Setter, Spiker, Libero) ordered by tier
    // If randomize is enabled, randomly select 1 role out of 3 to shuffle
    const roleToRandomize = randomize ? mandatoryRoles[Math.floor(Math.random() * mandatoryRoles.length)] : null;

    for (const role of mandatoryRoles) {
        // Get teams missing this role
        const teamsMissingRole = Array.from({ length: nTeams }, (_, i) => i).filter(
            teamIdx => !teams[teamIdx].players.some(p => normalizeRole(p.finalPosition || "") === role)
        );

        if (teamsMissingRole.length === 0) continue;

        // Get unassigned candidates for this role, ordered by tier (high to low)
        let candidates = getUnassigned().filter(
            p => p.finalPosition === role || normalizeRole(p.sub_position) === role
        );

        if (candidates.length === 0) continue;

        // Sort by OPS descending (highest tier first)
        candidates.sort((a, b) => (b.ops ?? 0) - (a.ops ?? 0));

        // If this role was randomly selected, shuffle all candidates
        if (role === roleToRandomize) {
            for (let i = candidates.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
            }
        }

        // Assign one candidate to each team missing the role (starting with lowest OPS team)
        for (const teamIdx of teamsMissingRole) {
            if (candidates.length === 0) break;

            // Find best candidate that doesn't violate separateGroups
            let selectedIdx = candidates.findIndex(c => !violatesSeparate(teamIdx, c.name));
            if (selectedIdx === -1) {
                // If no candidate satisfies separate rules, pick the first one anyway
                selectedIdx = 0;
            }

            const candidate = candidates[selectedIdx];
            candidate.finalPosition = role;
            assignPlayerToTeam(teams, candidate, teamIdx, assignedNames);
            candidates.splice(selectedIdx, 1);
        }
    }

    // STEP 3: Fill remaining players - assign higher tier to lower OPS teams while respecting separate rules and size limits
    let remaining = getUnassigned();
    
    // Calculate target size per team
    const totalPlayers = workingPlayers.length;
    const baseSize = Math.floor(totalPlayers / nTeams);
    const extra = totalPlayers % nTeams;
    const targetSizes = Array.from({ length: nTeams }, (_, i) => baseSize + (i < extra ? 1 : 0));
    
    // Sort remaining players by OPS descending (higher tier first)
    remaining.sort((a, b) => (b.ops ?? 0) - (a.ops ?? 0));

    // Calculate current team OPS imbalance
    const getImbalance = () => {
        const opsValues = Array.from({ length: nTeams }, (_, i) => getTeamTotalOps(teams[i]));
        return Math.max(...opsValues) - Math.min(...opsValues);
    };

    // Smart randomization: only randomize if imbalance is low (< 15)
    const shouldRandomize = randomize && getImbalance() < 15;

    if (shouldRandomize) {
        // Randomize within same tier groups to add variety while maintaining balance
        const tierGroups: Record<string, typeof remaining> = {};
        for (const player of remaining) {
            const tier = player.position_tier || player.sub_position_tier || 'unknown';
            if (!tierGroups[tier]) tierGroups[tier] = [];
            tierGroups[tier].push(player);
        }
        remaining = [];
        for (const tier of Object.keys(tierGroups)) {
            remaining = remaining.concat(shuffleArray(tierGroups[tier]));
        }
    }

    // Assign remaining players with greedy OPS balancing
    for (const player of remaining) {
        // Find teams that have capacity
        const teamsWithCapacity = Array.from({ length: nTeams }, (_, i) => i)
            .filter(idx => teams[idx].players.length < targetSizes[idx]);

        if (teamsWithCapacity.length === 0) break;

        let bestTeamIdx = -1;

        // If imbalance is high, use greedy approach: assign to lowest OPS team
        if (getImbalance() >= 15) {
            // Try to assign to lowest OPS team that respects separate rules
            const sortedByOps = teamsWithCapacity.sort((a, b) =>
                getTeamTotalOps(teams[a]) - getTeamTotalOps(teams[b])
            );

            for (const teamIdx of sortedByOps) {
                if (!violatesSeparate(teamIdx, player.name)) {
                    bestTeamIdx = teamIdx;
                    break;
                }
            }

            // Fallback: if all violate, still pick lowest OPS team
            if (bestTeamIdx === -1) {
                bestTeamIdx = sortedByOps[0];
            }
        } else {
            // Imbalance is low: simulate and pick team with best balance result
            let bestImbalance = Infinity;

            for (const teamIdx of teamsWithCapacity) {
                // Check if this assignment violates separate rules
                if (violatesSeparate(teamIdx, player.name)) continue;

                // Simulate assignment and calculate resulting imbalance
                const simulatedTeamOps = getTeamTotalOps(teams[teamIdx]) + player.ops;
                
                // Calculate what the imbalance would be after this assignment
                let maxOps = simulatedTeamOps;
                let minOps = simulatedTeamOps;
                
                for (let i = 0; i < nTeams; i++) {
                    const currentOps = getTeamTotalOps(teams[i]);
                    if (i !== teamIdx) {
                        maxOps = Math.max(maxOps, currentOps);
                        minOps = Math.min(minOps, currentOps);
                    }
                }
                
                const imbalance = maxOps - minOps;
                
                // Prefer the team that results in lowest imbalance
                if (imbalance < bestImbalance) {
                    bestImbalance = imbalance;
                    bestTeamIdx = teamIdx;
                }
            }

            // If no team satisfies separate rules, pick the lowest OPS team with capacity
            if (bestTeamIdx === -1) {
                bestTeamIdx = teamsWithCapacity.reduce((lowestIdx, idx) =>
                    getTeamTotalOps(teams[idx]) < getTeamTotalOps(teams[lowestIdx]) ? idx : lowestIdx
                );
            }
        }

        if (bestTeamIdx !== -1) {
            assignPlayerToTeam(teams, player, bestTeamIdx, assignedNames);
        }
    }

    // STEP 4: Fix separate rule violations by swapping players with same role
    for (let teamIdx = 0; teamIdx < teams.length; teamIdx++) {
        const team = teams[teamIdx];
        const teamNames = new Set(team.players.map(p => p.name));

        // Check each player in this team for violations
        for (let playerIdx = 0; playerIdx < team.players.length; playerIdx++) {
            const player = team.players[playerIdx];

            // Check if this player violates separateGroups
            let violatedPair: string[] | null = null;
            for (const pair of separateGroups) {
                if (pair.includes(player.name)) {
                    const rival = pair.find(name => name !== player.name && teamNames.has(name));
                    if (rival) {
                        violatedPair = pair;
                        break;
                    }
                }
            }

            if (violatedPair) {
                // Try to find a player with same finalPosition in another team to swap with
                let swapped = false;
                for (let otherTeamIdx = 0; otherTeamIdx < teams.length && !swapped; otherTeamIdx++) {
                    if (otherTeamIdx === teamIdx) continue;
                    const otherTeam = teams[otherTeamIdx];

                    // Find a player in other team with same role
                    for (let otherPlayerIdx = 0; otherPlayerIdx < otherTeam.players.length; otherPlayerIdx++) {
                        const otherPlayer = otherTeam.players[otherPlayerIdx];
                        
                        // Check if they have same final position
                        if (otherPlayer.finalPosition === player.finalPosition) {
                            // Verify swap doesn't create new violations
                            const newTeamNames = new Set(teamNames);
                            newTeamNames.delete(player.name);
                            newTeamNames.add(otherPlayer.name);

                            const otherTeamNames = new Set(otherTeam.players.map(p => p.name));
                            otherTeamNames.delete(otherPlayer.name);
                            otherTeamNames.add(player.name);

                            let violatesAfterSwap = false;

                            // Check if player would violate in other team
                            for (const pair of separateGroups) {
                                if (pair.includes(player.name)) {
                                    const rival = pair.find(name => name !== player.name && otherTeamNames.has(name));
                                    if (rival) {
                                        violatesAfterSwap = true;
                                        break;
                                    }
                                }
                            }

                            // Check if otherPlayer would violate in this team
                            if (!violatesAfterSwap) {
                                for (const pair of separateGroups) {
                                    if (pair.includes(otherPlayer.name)) {
                                        const rival = pair.find(name => name !== otherPlayer.name && newTeamNames.has(name));
                                        if (rival) {
                                            violatesAfterSwap = true;
                                            break;
                                        }
                                    }
                                }
                            }

                            // If swap is safe, perform it
                            if (!violatesAfterSwap) {
                                team.players[playerIdx] = otherPlayer;
                                otherTeam.players[otherPlayerIdx] = player;
                                teamNames.delete(player.name);
                                teamNames.add(otherPlayer.name);
                                swapped = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    // STEP 5: Mark remaining violations with violation indicators
    for (let teamIdx = 0; teamIdx < teams.length; teamIdx++) {
        const team = teams[teamIdx];
        const teamNames = new Set(team.players.map(p => p.name));

        // Check each player for violations
        for (const player of team.players) {
            for (const pair of separateGroups) {
                if (pair.includes(player.name)) {
                    // Check if any rival is on the same team
                    for (const rival of pair) {
                        if (rival !== player.name && teamNames.has(rival)) {
                            // Mark both players with violation info
                            (player as any).violation = rival;
                            const rivalPlayer = team.players.find(p => p.name === rival);
                            if (rivalPlayer) {
                                (rivalPlayer as any).violation = player.name;
                            }
                        }
                    }
                }
            }
        }
    }

    // STEP 6: Sort players within each team by position order (SETTER, SPIKER, LIBERO, FLEX)
    const positionOrder: Record<string, number> = {
        "Setter": 1,
        "Spiker": 2,
        "Libero": 3,
        "Flex": 4
    };

    for (const team of teams) {
        team.players.sort((a, b) => {
            const posA = normalizeRole((a as any).finalPosition || "");
            const posB = normalizeRole((b as any).finalPosition || "");
            const orderA = positionOrder[posA] || 5;
            const orderB = positionOrder[posB] || 5;
            return orderA - orderB;
        });
    }

    return teams;
}

/**
 * Alternative division strategy (v2)
 * - Place togetherGroups across empty teams at the beginning
 * - For each mandatory role, assign candidates ordered by tier to the lowest-OPS team first while respecting separateGroups
 * - Fill remaining players by assigning higher-tier players to lower-OPS teams
 */
function divideTeamsBasicV2(
    nTeams: number,
    players: BasicPlayer[],
    togetherGroups: string[][] = [],
    separateGroups: string[][] = [],
    randomize: boolean = false
): Team[] {
    const mandatoryRoles = ["Setter", "Spiker", "Libero"];

    console.log("=== V2 Strategy: Start ===");
    console.log(`nTeams: ${nTeams}, totalPlayers: ${players.length}, randomize: ${randomize}`);

    // Prepare working players with OPS and normalized finalPosition
    const workingPlayers = players.map(p => ({
        ...p,
        ops: calculateBasicOPS(p),
        finalPosition: normalizeRole(p.position || p.sub_position || "")
    }));

    const teams: Team[] = Array.from({ length: nTeams }, (_, i) => ({ id: i + 1, players: [] }));
    const assignedNames = new Set<string>();

    // Determine target sizes
    const totalPlayers = workingPlayers.length;
    const baseSize = Math.floor(totalPlayers / nTeams);
    const extra = totalPlayers % nTeams;
    const targetSizes = Array.from({ length: nTeams }, (_, i) => baseSize + (i < extra ? 1 : 0));
    const teamHasCapacity = (idx: number) => teams[idx].players.length < targetSizes[idx];

    console.log(`Target sizes per team: ${targetSizes.join(", ")}`);

    // Helper to check separateGroups violation for placing a name on a team
    const violatesSeparate = (teamIdx: number, candidateName: string) => {
        const teamNames = new Set(teams[teamIdx].players.map(p => p.name));
        for (const pair of separateGroups) {
            if (pair.includes(candidateName)) {
                for (const member of pair) {
                    if (member !== candidateName && teamNames.has(member)) return true;
                }
            }
        }
        return false;
    };

    // 1) Assign each togetherGroup to a single team at the beginning
    console.log(`\n=== Step 1: Assign togetherGroups to single teams ===`);
    console.log(`togetherGroups count: ${togetherGroups.length}`);
    for (const group of togetherGroups) {
        console.log(`  Group: [${group.join(", ")}]`);

        // Prefer an empty team first
        const emptyIdxs = Array.from({ length: nTeams }, (_, i) => i).filter(i => teams[i].players.length === 0);
        let targetIdx: number | null = null;

        if (emptyIdxs.length > 0) {
            targetIdx = emptyIdxs[0];
            console.log(`    Selected empty team ${targetIdx + 1} for whole group`);
        } else {
            // Find a team that can fit the whole group (remaining capacity >= group size), prefer lowest OPS
            const capacities = Array.from({ length: nTeams }, (_, i) => ({
                idx: i,
                remaining: targetSizes[i] - teams[i].players.length,
                ops: getTeamTotalOps(teams[i])
            }));

            const fitTeams = capacities.filter(c => c.remaining >= group.length).sort((a, b) => a.ops - b.ops);
            if (fitTeams.length > 0) {
                targetIdx = fitTeams[0].idx;
                console.log(`    Selected team ${targetIdx + 1} (fits whole group, remaining ${fitTeams[0].remaining})`);
            } else {
                // No single team can fit whole group; pick team with max remaining capacity (tie-breaker: lowest OPS)
                const best = capacities.sort((a, b) => b.remaining - a.remaining || a.ops - b.ops)[0];
                if (best && best.remaining > 0) {
                    targetIdx = best.idx;
                    console.log(`    No single team fits whole group; selected team ${targetIdx + 1} with remaining ${best.remaining} for partial assignment`);
                } else {
                    // As last resort pick lowest-OPS team
                    const lowestOps = capacities.sort((a, b) => a.ops - b.ops)[0];
                    targetIdx = lowestOps.idx;
                    console.log(`    No capacity available; selected lowest-OPS team ${targetIdx + 1} for best-effort assignment`);
                }
            }
        }

        // Assign all members of the group to targetIdx (as many as capacity allows)
        let assigned = 0;
        for (const name of group) {
            const player = workingPlayers.find(p => p.name === name && !assignedNames.has(p.name));
            if (!player) continue;
            if (targetIdx === null) break;
            if (!teamHasCapacity(targetIdx)) {
                console.log(`    Team ${targetIdx + 1} full; cannot assign ${name}`);
                continue;
            }
            assignPlayerToTeam(teams, player, targetIdx, assignedNames);
            assigned++;
            console.log(`    Assigned ${name} to team ${targetIdx + 1}`);
        }
        if (assigned < group.length) {
            console.log(`    Note: Assigned ${assigned}/${group.length} members of group to team ${targetIdx !== null ? targetIdx + 1 : 'N/A'}`);
        }
    }

    // Helper to get unassigned players
    const unassigned = () => workingPlayers.filter(p => !assignedNames.has(p.name));

    // 2) For each mandatory role, assign candidates to teams missing that role
    console.log(`\n=== Step 2: Assign mandatory roles (Setter, Spiker, Libero) ===`);
    for (const role of mandatoryRoles) {
        // Get teams missing this role, sorted by lowest OPS (ascending)
        const teamsMissingRole = getTeamsMissingRole(teams, role)
            .filter(idx => teamHasCapacity(idx))
            .sort((a, b) => getTeamTotalOps(teams[a]) - getTeamTotalOps(teams[b]));
        
        console.log(`  Role: ${role}, teams missing this role: ${teamsMissingRole.length}/${nTeams}`);
        
        if (teamsMissingRole.length === 0) {
            console.log(`    → All teams already have ${role}, skipping.`);
            continue;
        }

        // Get candidates for this role, sorted by OPS descending (highest first)
        let candidates = unassigned().filter(p => p.finalPosition === role || p.sub_position === role);
        candidates.sort((a, b) => b.ops - a.ops);
        if (randomize) candidates = shuffleArray(candidates);
        
        console.log(`    Available candidates: ${candidates.length}`);

        // Assign candidates to teams (highest OPS candidate to lowest OPS team first)
        let assignedCount = 0;
        const usedCandidates = new Set<string>();

        for (const tIdx of teamsMissingRole) {
            // Find the candidate with highest OPS that hasn't been used yet
            const candidate = candidates.find(c => !usedCandidates.has(c.name) && !assignedNames.has(c.name));
            
            if (candidate) {
                candidate.finalPosition = role;
                assignPlayerToTeam(teams, candidate, tIdx, assignedNames);
                usedCandidates.add(candidate.name);
                assignedCount++;
                console.log(`    Assigned ${candidate.name} (OPS: ${candidate.ops.toFixed(2)}) to team ${tIdx + 1}`);
            }
        }
        console.log(`    → Assigned ${assignedCount} ${role}s to fill missing teams`);
    }

    // 3) Fill remaining players: assign higher-tier players to lower-OPS teams
    console.log(`\n=== Step 3: Fill remaining players (by tier) ===`);
    let remaining = unassigned();
    console.log(`  Remaining players: ${remaining.length}`);
    
    // sort by OPS desc
    remaining.sort((a, b) => b.ops - a.ops);

    let assignedCount = 0;
    for (const player of remaining) {
        // teams sorted by lowest OPS
        const teamOrder = Array.from({ length: nTeams }, (_, i) => i).sort((a, b) => getTeamTotalOps(teams[a]) - getTeamTotalOps(teams[b]));
        let placed = false;
        for (const tIdx of teamOrder) {
            if (!teamHasCapacity(tIdx)) continue;
            if (violatesSeparate(tIdx, player.name)) continue;
            assignPlayerToTeam(teams, player, tIdx, assignedNames);
            assignedCount++;
            placed = true;
            break;
        }
        if (!placed) {
            // fallback ignore separateGroups
            for (const tIdx of teamOrder) {
                if (!teamHasCapacity(tIdx)) continue;
                assignPlayerToTeam(teams, player, tIdx, assignedNames);
                assignedCount++;
                console.log(`  Assigned ${player.name} to team ${tIdx + 1} [violates separate, fallback]`);
                placed = true;
                break;
            }
        }
    }
    console.log(`  → Assigned ${assignedCount} remaining players`);

    // 4) Post-processing: Fix separateGroups violations by swapping players between teams
    console.log(`\n=== Step 4: Fix separateGroups violations via swaps ===`);
    let swapCount = 0;
    
    for (let teamIdx = 0; teamIdx < teams.length; teamIdx++) {
        const team = teams[teamIdx];
        const teamNames = new Set(team.players.map(p => p.name));
        
        // Check each player in this team for violations
        for (let playerIdx = 0; playerIdx < team.players.length; playerIdx++) {
            const player = team.players[playerIdx];
            
            // Find if this player violates separateGroups (has a rival on same team)
            let violatedPair: string[] | null = null;
            for (const pair of separateGroups) {
                if (pair.includes(player.name)) {
                    const rival = pair.find(name => name !== player.name && teamNames.has(name));
                    if (rival) {
                        violatedPair = pair;
                        break;
                    }
                }
            }
            
            if (violatedPair) {
                console.log(`    Found violation: ${player.name} on team ${teamIdx + 1} with rival from separateGroups`);
                
                // Try to swap this player with someone from another team
                let swapped = false;
                for (let otherTeamIdx = 0; otherTeamIdx < teams.length; otherTeamIdx++) {
                    if (otherTeamIdx === teamIdx) continue;
                    
                    const otherTeam = teams[otherTeamIdx];
                    for (let otherPlayerIdx = 0; otherPlayerIdx < otherTeam.players.length; otherPlayerIdx++) {
                        const otherPlayer = otherTeam.players[otherPlayerIdx];
                        
                        // Check if swapping would create new violations
                        // Check: player -> otherTeam
                        const otherTeamNames = new Set(otherTeam.players.map(p => p.name));
                        otherTeamNames.delete(otherPlayer.name);
                        otherTeamNames.add(player.name);
                        let playerViolatesOtherTeam = false;
                        for (const pair of separateGroups) {
                            if (pair.includes(player.name)) {
                                const rival = pair.find(name => name !== player.name && otherTeamNames.has(name));
                                if (rival) {
                                    playerViolatesOtherTeam = true;
                                    break;
                                }
                            }
                        }
                        
                        // Check: otherPlayer -> team
                        const newTeamNames = new Set(teamNames);
                        newTeamNames.delete(player.name);
                        newTeamNames.add(otherPlayer.name);
                        let otherPlayerViolatesTeam = false;
                        for (const pair of separateGroups) {
                            if (pair.includes(otherPlayer.name)) {
                                const rival = pair.find(name => name !== otherPlayer.name && newTeamNames.has(name));
                                if (rival) {
                                    otherPlayerViolatesTeam = true;
                                    break;
                                }
                            }
                        }
                        
                        // If both moves are safe, perform the swap
                        if (!playerViolatesOtherTeam && !otherPlayerViolatesTeam) {
                            // Swap players
                            team.players[playerIdx] = otherPlayer;
                            otherTeam.players[otherPlayerIdx] = player;
                            teamNames.delete(player.name);
                            teamNames.add(otherPlayer.name);
                            swapCount++;
                            console.log(`    Swapped ${player.name} (team ${teamIdx + 1}) ↔ ${otherPlayer.name} (team ${otherTeamIdx + 1})`);
                            swapped = true;
                            break;
                        }
                    }
                    if (swapped) break;
                }
                
                if (!swapped) {
                    console.log(`    Could not find valid swap for ${player.name} on team ${teamIdx + 1}`);
                }
            }
        }
    }
    console.log(`  → Performed ${swapCount} swaps to fix violations`);

    console.log(`\n=== V2 Strategy: Complete ===`);
    console.log(`Total assigned: ${assignedNames.size}/${workingPlayers.length}`);
    teams.forEach((t, idx) => {
        const roleCount: Record<string, number> = {};
        t.players.forEach(p => {
            roleCount[p.finalPosition] = (roleCount[p.finalPosition] || 0) + 1;
        });
        const teamOps = getTeamTotalOps(t);
        console.log(`Team ${t.id}: ${t.players.length} players, OPS: ${teamOps.toFixed(2)}, roles: ${JSON.stringify(roleCount)}`);
    });

    return teams;
}

/**
 * Validates and normalizes positions in player data
 * Converts old Vietnamese position names to standard ones
 */
export function normalizePlayerPositions(players: any[]): Player[] {
    return players.map(p => ({
        ...p,
        position: normalizeRole(p.position),
        sub_position: normalizeRole(p.sub_position || '')
    }));
}

/**
 * Calculates balance metric for team division
 * Returns the difference between strongest and weakest team
 */
export function calculateTeamBalance(teams: Team[]): number {
    if (teams.length === 0) return 0;
    
    const opsValues = teams.map(t => getTeamTotalOps(t));
    return Math.max(...opsValues) - Math.min(...opsValues);
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
            typeof p.position_tier === 'string' &&
            typeof p.sub_position === 'string' &&
            typeof p.sub_position_tier === 'string'
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
 * Exports player data to JSON format
 */
export function exportPlayersToJSON(players: Player[], constraints: any, filename: string = 'players.json'): void {
    const cleanedPlayers = players.map(p => {
        return {
            nickName: (p as BasicPlayer).nickName || '',
            name: p.name,
            position: p.position,
            position_tier: (p as BasicPlayer).position_tier,
            sub_position: p.sub_position,
            sub_position_tier: (p as BasicPlayer).sub_position_tier
        };
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
