import supabase from '../utils/supabaseClient.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

const ProductCache = {
    // Get cached data by code, but only if it's not expired
    async get(code) {
        const { data, error } = await supabase
            .from('product_cache')
            .select('*')
            .eq('code', code)
            .single();

        if (error) return null; // not found is fine, just return null
        
        const isExpired = Date.now() - new Date(data.updated_at).getTime() > SEVEN_DAYS_MS;
        if (isExpired) {
            await this.delete(code); // clean up expired entry
            return null;
        }
        return data;
    },

    // Save or update a cache entry (upsert = insert or update if it exists)
    async set(code, productData) {
        const { data, error } = await supabase
            .from('product_cache')
            .upsert(
                { code, data: productData, updated_at: new Date().toISOString() },
                { onConflict: 'code' }
            )
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(code) {
        const { error } = await supabase
            .from('product_cache')
            .delete()
            .eq('code', code);
        if (error) throw error;
    },
};

export default ProductCache;