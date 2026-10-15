import supabase from '../utils/supabaseClient.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const ProductSummary = {
    // Get a summary by productId, but only if it's not expired
    async get(productId) {
        const { data, error } = await supabase
            .from('product_summaries')
            .select('*')
            .eq('product_id', productId)
            .single();

        if (error) return null; // not found is fine

        const isExpired = Date.now() - new Date(data.updated_at).getTime() > THIRTY_DAYS_MS;
        if (isExpired) {
            await this.delete(productId);
            return null;
        }
        return data;
    },

    // Save or update a summary (upsert = insert or update if it exists)
    async set(productId, summaryData) {
        const {
            productName,
            brand,
            shortSummary,
            longSummary,
            sections,
            generationMeta,
            dataSources,
        } = summaryData;

        const { data, error } = await supabase
            .from('product_summaries')
            .upsert(
                {
                    product_id: productId,
                    product_name: productName,
                    brand,
                    short_summary: shortSummary,
                    long_summary: longSummary,
                    sections: sections || {},
                    generation_meta: generationMeta || { version: '1.0.0', generatedAt: new Date().toISOString(), generatedBy: 'system' },
                    data_sources: dataSources || { productData: false, esgData: false, externalSources: [] },
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'product_id' }
            )
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(productId) {
        const { error } = await supabase
            .from('product_summaries')
            .delete()
            .eq('product_id', productId);
        if (error) throw error;
    },
};

export default ProductSummary;