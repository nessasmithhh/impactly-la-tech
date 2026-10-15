import supabase from '../utils/supabaseClient.js';

const Company = {
    // Get a brand + its ESG score together, by brand name (partial match)
    async findByName(name) {
        const { data, error } = await supabase
            .from('brands')
            .select(`
                *,
                esg_scores (*)
            `)
            .ilike('brand_name', `%${name}%`);
        if (error) throw error;
        return data;
    },

    // Get a single brand + ESG score by exact brand id
    async findById(brandId) {
        const { data, error } = await supabase
            .from('brands')
            .select(`
                *,
                esg_scores (*)
            `)
            .eq('id', brandId)
            .single();
        if (error) throw error;
        return data;
    },

    // Get every brand + their ESG scores
    async findAll() {
        const { data, error } = await supabase
            .from('brands')
            .select(`
                *,
                esg_scores (*)
            `);
        if (error) throw error;
        return data;
    },
};

export default Company;