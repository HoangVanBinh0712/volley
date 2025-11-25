/**
 * Volleyball Application Type Definitions
 */

export interface PlayerTier {
    tier: string;
    score: number;
}

export interface AdvancePlayer {
    name: string;
    position: string;
    sub_position: string;
    chuyen: number;
    cong: number;
    thu: number;
    ops?: number;
    finalPosition?: string;
    id?: number;
}

export interface BasicPlayer {
    nickName: string;
    name: string;
    position: string;
    position_tier: PlayerTier;
    sub_position: string;
    sub_position_tier: PlayerTier;
    finalPosition?: string;
    id?: number;
}

export type Player = AdvancePlayer | BasicPlayer;

export interface Team {
    id: number;
    players: Array<{
        name: string;
        finalPosition: string;
        subPosition: string;
        ops: string;
        // Optional tier names for basic mode (e.g. 'S', 'A+', 'B')
        positionTier?: string;
        subPositionTier?: string;
    }>;
    totalOPS: string;
}

// Type guards
export function isAdvancePlayer(player: Player): player is AdvancePlayer {
    return 'chuyen' in player && 'cong' in player && 'thu' in player;
}

export function isBasicPlayer(player: Player): player is BasicPlayer {
    return 'position_tier' in player && 'sub_position_tier' in player;
}