import Company from "../models/Company.js";

// Get company by ID (brand id)
const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: { code: 'INVALID_ARGUMENT', message: 'Company ID is required' }
      });
    }

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Company not found with ID: ${id}` }
      });
    }

    res.json(formatCompany(company));
  } catch (error) {
    console.error('Company lookup error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get company details' }
    });
  }
};

// Search by name (query param q), or get by id
const getCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { q } = req.query;

    if (id) {
      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({
          error: { code: 'NOT_FOUND', message: `Company not found with ID: ${id}` }
        });
      }
      return res.json(formatCompany(company));
    }

    if (q) {
      const companies = await Company.findByName(q);
      return res.json({
        matches: companies.map(formatCompany),
        totalResults: companies.length
      });
    }

    return res.status(400).json({
      error: { code: 'INVALID_ARGUMENT', message: 'Missing required parameter. Provide either id or q' }
    });
  } catch (error) {
    console.error('Company lookup error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to lookup company' }
    });
  }
};

// Get ESG score for a company
const getCompanyScore = async (req, res) => {
  try {
    const { companyId } = req.params;

    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `Company not found with ID: ${companyId}` }
      });
    }

    const esg = company.esg_scores?.[0]; // esg_scores comes back as an array from the join
    if (!esg) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: `No ESG data found for company: ${company.brand_name}` }
      });
    }

    const E = esg.Environmental ?? null;
    const S = esg.Social ?? null;
    const G = esg.Governance ?? null;

    let weights = { wE: 0.4, wS: 0.4, wG: 0.2 };
    const availableFactors = [E, S, G].filter(score => score !== null);
    if (availableFactors.length < 3 && availableFactors.length > 0) {
      const equalWeight = 1.0 / availableFactors.length;
      weights = {
        wE: E !== null ? equalWeight : 0,
        wS: S !== null ? equalWeight : 0,
        wG: G !== null ? equalWeight : 0
      };
    }

    const overall = esg.final_score ?? Math.round((E || 0) * weights.wE + (S || 0) * weights.wS + (G || 0) * weights.wG);

    let confidence = 0.80;
    if (esg.last_updated) {
      const esgDate = new Date(esg.last_updated);
      const monthsDiff = (new Date() - esgDate) / (1000 * 60 * 60 * 24 * 30);
      if (monthsDiff <= 24) confidence += 0.05;
    }
    if (E !== null && S !== null && G !== null) confidence += 0.05;
    confidence = Math.min(confidence, 0.95);

    res.json({
      companyId,
      companyName: company.brand_name,
      overall,
      breakdown: { environment: E, labor: S, governance: G },
      methodology: {
        version: "1.0.0",
        weights: { environment: weights.wE, labor: weights.wS, governance: weights.wG }
      },
      confidence,
      asOf: esg.last_updated,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Score lookup error:', error);
    res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Failed to get ESG score' }
    });
  }
};

// Format company data for API responses
function formatCompany(company) {
  return {
    id: company.id,
    name: company.brand_name,
    websiteUrl: company.website_url,
    parentCompany: company.parent_company,
    esgScore: company.esg_scores?.[0] || null,
    meta: {
      createdAt: company.created_at,
      updatedAt: company.updated_at
    }
  };
}

export {
  getCompany,
  getCompanyById,
  getCompanyScore
};