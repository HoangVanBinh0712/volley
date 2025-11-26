/**
 * Volleyball Application Type Definitions
 */

export interface BasicPlayer {
    nickName: string;
    name: string;
    position: string;
    position_tier: string;
    sub_position: string;
    sub_position_tier: string;
    finalPosition?: string;
    id?: number;
}

export type Player = BasicPlayer;

export interface Team {
    id: number;
    players: Array<{
        name: string;
        finalPosition: string;
        subPosition: string;
        // Tier names for basic mode (e.g. 'S', 'A+', 'B')
        positionTier?: string;
        subPositionTier?: string;
    }>;
}

// Type guards
export function isBasicPlayer(player: Player): player is BasicPlayer {
    return 'position_tier' in player && 'sub_position_tier' in player;
}