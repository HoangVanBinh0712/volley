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
        
        return players;
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

/**
 * Update a player in the database
 */
export async function updatePlayer(id: number, updates: Partial<BasicPlayer>): Promise<BasicPlayer> {
    try {
        const supabase = getSupabase() as any;
        const dbData = {
            nick_name: updates.nickName,
            name: updates.name,
            position: updates.position,
            position_tier: updates.position_tier,
            sub_position: updates.sub_position,
            sub_position_tier: updates.sub_position_tier
        };

        const { data, error } = await supabase
            .from('players')
            .update(dbData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to update player: ${error.message}`);
        }

        const player = data as DatabasePlayer;
        return {
            nickName: player.nick_name,
            name: player.name,
            position: player.position,
            position_tier: player.position_tier,
            sub_position: player.sub_position,
            sub_position_tier: player.sub_position_tier,
            id: player.id
        };
    } catch (error) {
        console.error('Error updating player:', error);
        throw error;
    }
}

/**
 * Delete a player from the database
 */
export async function deletePlayer(id: number): Promise<void> {
    try {
        const supabase = getSupabase() as any;
        const { error } = await supabase
            .from('players')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Failed to delete player: ${error.message}`);
        }
    } catch (error) {
        console.error('Error deleting player:', error);
        throw error;
    }
}

/**
 * Create a new player in the database
 */
export async function createPlayer(player: Omit<BasicPlayer, 'id'>): Promise<BasicPlayer> {
    try {
        const supabase = getSupabase() as any;
        const dbData = {
            nick_name: player.nickName,
            name: player.name,
            position: player.position,
            position_tier: player.position_tier,
            sub_position: player.sub_position,
            sub_position_tier: player.sub_position_tier
        };

        const { data, error } = await supabase
            .from('players')
            .insert([dbData])
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create player: ${error.message}`);
        }

        const newPlayer = data as DatabasePlayer;
        return {
            nickName: newPlayer.nick_name,
            name: newPlayer.name,
            position: newPlayer.position,
            position_tier: newPlayer.position_tier,
            sub_position: newPlayer.sub_position,
            sub_position_tier: newPlayer.sub_position_tier,
            id: newPlayer.id
        };
    } catch (error) {
        console.error('Error creating player:', error);
        throw error;
    }
}
