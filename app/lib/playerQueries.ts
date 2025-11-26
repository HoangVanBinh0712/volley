import { getSupabase } from './supabaseClient';
import { BasicPlayer } from '@/app/types/volleyball';

export interface DatabasePlayer {
    id: number;
    nick_name: string;
    name: string;
    position: string;
    position_tier: string;
    sub_position: string;
    sub_position_tier: string;
    created_at?: string;
}

/**
 * Shuffle array using Fisher-Yates algorithm
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
 * Fetch all players from the database
 */
export async function fetchAllPlayers(): Promise<BasicPlayer[]> {
    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            throw new Error(`Failed to fetch players: ${error.message}`);
        }
        // Transform database players to BasicPlayer format
        const players = (data || []).map((p: DatabasePlayer) => ({
            nickName: p.nick_name,
            name: p.name,
            position: p.position,
            position_tier: p.position_tier,
            sub_position: p.sub_position,
            sub_position_tier: p.sub_position_tier,
            id: p.id
        }));
        
        // Shuffle the results before returning
        return shuffleArray(players);
    } catch (error) {
        console.error('Error fetching players:', error);
        throw error;
    }
}

/**
 * Fetch players by IDs
 */
export async function fetchPlayersByIds(ids: number[]): Promise<BasicPlayer[]> {
    if (ids.length === 0) return [];

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('players')
            .select('*')
            .in('id', ids);

        if (error) {
            throw new Error(`Failed to fetch players: ${error.message}`);
        }

        return (data || []).map((p: DatabasePlayer) => ({
            nickName: p.nick_name,
            name: p.name,
            position: p.position,
            position_tier: p.position_tier,
            sub_position: p.sub_position,
            sub_position_tier: p.sub_position_tier,
            id: p.id
        }));
    } catch (error) {
        console.error('Error fetching players by IDs:', error);
        throw error;
    }
}
