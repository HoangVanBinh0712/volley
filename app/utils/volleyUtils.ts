/**
 * Volleyball Team Divider Utilities - Basic Mode Only
 * Contains core logic for team calculations and divisions
 */

import { Player, BasicPlayer, Team, PlayerTier, isBasicPlayer } from '@/app/types/volleyball';

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
    const positionScore = TIER_SCORES[p.position_tier.tier] || 0;
    const subPositionScore = TIER_SCORES[p.sub_position_tier.tier] || 0;
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
    if (strategy === 'v2') {
        return divideTeamsBasicV2(nTeams, basicPlayers, togetherGroups, separateGroups, randomize);
    }
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

    // Auto-balance roles
    autoBalanceRoles(workingPlayers, nTeams, mandatoryRoles);

    // Initialize teams
    const teams: Team[] = Array.from({ length: nTeams }, (_, i) => ({
        id: i + 1,
        players: []
    }));

    const assignedNames = new Set<string>();

    // Determine target sizes for each team to ensure even distribution
    const totalPlayers = workingPlayers.length;
    const baseSize = Math.floor(totalPlayers / nTeams);
    const extra = totalPlayers % nTeams;
    const targetSizes = Array.from({ length: nTeams }, (_, i) => baseSize + (i < extra ? 1 : 0));

    const teamHasCapacity = (idx: number) => teams[idx].players.length < targetSizes[idx];

    // 1. Assign mandatory roles first (ensures each team has key positions)
    for (const role of mandatoryRoles) {
        // Teams lacking the role (prefer those with capacity)
        let missingWithCap = getTeamsMissingRole(teams, role).filter(teamHasCapacity);
        const missingWithoutCap = getTeamsMissingRole(teams, role).filter((idx) => !teamHasCapacity(idx));

        if (missingWithCap.length === 0 && missingWithoutCap.length === 0) continue;

        // Build candidate pools in preferred order:
        // 1) players whose finalPosition already matches the role
        // 2) players whose sub_position matches the role
        // 3) any other available players (fallback)
        let poolExact = workingPlayers.filter((p) => p.finalPosition === role && !assignedNames.has(p.name));
        let poolSub = workingPlayers.filter((p) => normalizeRole(p.sub_position) === role && !assignedNames.has(p.name) && p.finalPosition !== role);
        let poolOthers = workingPlayers.filter((p) => !assignedNames.has(p.name) && p.finalPosition !== role && normalizeRole(p.sub_position) !== role);

        const sortByOpsDesc = (arr: any[]) => arr.sort((a, b) => b.ops - a.ops);
        poolExact = sortByOpsDesc(poolExact);
        poolSub = sortByOpsDesc(poolSub);
        poolOthers = sortByOpsDesc(poolOthers);

        // If randomization requested, shuffle within preference groups to introduce variability
        if (randomize) {
            poolExact = shuffleArray(poolExact);
            poolSub = shuffleArray(poolSub);
            poolOthers = shuffleArray(poolOthers);
        }

        // Merge pools preserving preference ordering
        const candidates = [...poolExact, ...poolSub, ...poolOthers];

        // Assign candidates to teams missing the role, preferring teams with capacity first
        let candidateIdx = 0;
        while (candidateIdx < candidates.length && missingWithCap.length > 0) {
            const targetTeamIdx = getTeamWithLowestBalance(teams, missingWithCap);
            const player = candidates[candidateIdx];
            // Ensure the player's finalPosition reflects the role being assigned
            player.finalPosition = role;
            assignPlayerToTeam(teams, player, targetTeamIdx, assignedNames);
            candidateIdx++;
            // recompute missing teams with capacity
            missingWithCap = getTeamsMissingRole(teams, role).filter(teamHasCapacity);
        }

        // If still missing teams (because of capacity limits), try to assign into teams without capacity as a last resort
        let idxFallback = candidateIdx;
        let missingFallback = missingWithoutCap.slice();
        while (idxFallback < candidates.length && missingFallback.length > 0) {
            const targetTeamIdx = getTeamWithLowestBalance(teams, missingFallback);
            const player = candidates[idxFallback];
            player.finalPosition = role;
            assignPlayerToTeam(teams, player, targetTeamIdx, assignedNames);
            idxFallback++;
            missingFallback = getTeamsMissingRole(teams, role).filter((i) => !teamHasCapacity(i));
        }
    }

    // 2. Handle remaining together groups (players who must be together)
    for (const group of togetherGroups) {
        // assume togetherGroups are valid and will not violate team sizes
        if (!group.some((name) => assignedNames.has(name))) {
            const targetIdx = getTeamWithLowestBalance(
                teams,
                Array.from({ length: nTeams }, (_, i) => i)
            );
            for (const role of mandatoryRoles) {
                // Skip role if all teams already have it
                let teamsMissingRole = getTeamsMissingRole(teams, role);
                console.log(`  Role: ${role}, teams missing this role: ${teamsMissingRole.length}/${nTeams}`);
                if (teamsMissingRole.length === 0) {
                    console.log(`    → All teams already have ${role}, skipping.`);
                    continue;
                }

                // Build candidate list once; we'll remove assigned candidates as we go
                let candidates = unassigned().filter(p => p.finalPosition === role || p.sub_position === role);
                // sort by OPS desc
                candidates.sort((a, b) => b.ops - a.ops);
                if (randomize) candidates = shuffleArray(candidates);

                console.log(`    Available candidates: ${candidates.length}`);

                let assignedCount = 0;

                // For each team missing the role, pick a single best candidate and assign them
                // Order teams by lowest OPS so we fill weaker teams first
                teamsMissingRole = teamsMissingRole.slice().sort((a, b) => getTeamTotalOps(teams[a]) - getTeamTotalOps(teams[b]));
                for (const tIdx of teamsMissingRole) {
                    if (!teamHasCapacity(tIdx)) continue;
                    // find best candidate that doesn't violate separateGroups
                    let foundIdx = candidates.findIndex(c => !violatesSeparate(tIdx, c.name));
                    // if none found, relax separation constraint
                    if (foundIdx === -1) {
                        foundIdx = candidates.findIndex(() => true);
                    }
                    if (foundIdx === -1) continue; // no candidates left

                    const candidate = candidates[foundIdx];
                    candidate.finalPosition = role;
                    assignPlayerToTeam(teams, candidate, tIdx, assignedNames);
                    assignedCount++;
                    console.log(`    Assigned ${candidate.name} (OPS: ${candidate.ops.toFixed(2)}) to team ${tIdx + 1} for role ${role}`);

                    // remove candidate from list
                    candidates.splice(foundIdx, 1);
                }

                console.log(`    → Assigned ${assignedCount} ${role}s (one per missing team)`);
            }
    // Build groups keyed by primary tier (fallback to sub_position tier or ops string)
    const groups: Record<string, any[]> = {};
    for (const p of remaining) {
        const primaryTier = (p.position_tier && p.position_tier.tier) || (p.sub_position_tier && p.sub_position_tier.tier) || p.ops.toFixed(2);
        groups[primaryTier] = groups[primaryTier] || [];
        groups[primaryTier].push(p);
    }

    // Sort group keys by tier strength descending using TIER_SCORES; numeric keys fall back to numeric sort
    const groupKeys = Object.keys(groups).sort((a, b) => {
        const scoreA = TIER_SCORES[a] ?? (isNaN(Number(a)) ? 0 : Number(a));
        const scoreB = TIER_SCORES[b] ?? (isNaN(Number(b)) ? 0 : Number(b));
        return scoreB - scoreA;
    });

    // For each group, optionally shuffle within the group (randomize true), otherwise sort by OPS desc
    let orderedRemaining: any[] = [];
    for (const key of groupKeys) {
        let groupArr = groups[key];
        if (!Array.isArray(groupArr) || groupArr.length === 0) continue;
        if (randomize) {
            groupArr = shuffleArray(groupArr);
        } else {
            groupArr = groupArr.sort((a, b) => b.ops - a.ops);
        }
        orderedRemaining = orderedRemaining.concat(groupArr);
    }

    // Now distribute orderedRemaining in round-robin rounds to spread top-tier players
    const anyTeamHasCapacity = () => Array.from({ length: nTeams }, (_, i) => i).some(teamHasCapacity);

    while (orderedRemaining.length > 0 && anyTeamHasCapacity()) {
        // team order per round (shuffled when randomize to add variability)
        let teamOrder = Array.from({ length: nTeams }, (_, i) => i);
        if (randomize) teamOrder = shuffleArray(teamOrder);

        for (const tIdx of teamOrder) {
            if (orderedRemaining.length === 0) break;
            if (!teamHasCapacity(tIdx)) continue;
            const player = orderedRemaining.shift() as any;
            assignPlayerToTeam(teams, player, tIdx, assignedNames);
        }
    }

    // Fallback: assign any leftover players to the smallest team
    while (orderedRemaining.length > 0) {
        const bySize = Array.from({ length: nTeams }, (_, i) => i).sort((a, b) => teams[a].players.length - teams[b].players.length || getTeamTotalOps(teams[a]) - getTeamTotalOps(teams[b]));
        const targetIdx = bySize[0];
        const player = orderedRemaining.shift() as any;
        assignPlayerToTeam(teams, player, targetIdx, assignedNames);
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
 * Get total OPS for a team
 */
function getTeamTotalOps(team: Team): number {
    return team.players.reduce((sum, p) => {
        const opsStr = (p as any).ops || '0';
        return sum + parseFloat(opsStr);
    }, 0);
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
 * Find team with lowest total OPS from candidates (deprecated - use getTeamWithLowestBalance)
 */
function getTeamWithLowestOPS(teams: Team[], candidateIndices: number[]): number {
    return getTeamWithLowestBalance(teams, candidateIndices);
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
        positionTier: player.position_tier?.tier,
        subPositionTier: player.sub_position_tier?.tier,
        ops: player.ops.toFixed(2)
    };

    teams[teamIdx].players.push(playerData);
    assignedNames.add(player.name);
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
