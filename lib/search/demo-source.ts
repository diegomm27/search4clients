import type { SearchConfig } from "./schemas";

export type CandidateCompany = {
  company_name: string;
  country: string;
  region?: string | null;
  city?: string | null;
  industry: string;
  business_category: string;
  website?: string | null;
  contact_page?: string | null;
  public_email?: string | null;
  public_phone?: string | null;
  linkedin_company_page?: string | null;
  social_profiles: string[];
  company_description: string;
  observed_signals: string[];
  sources: string[];
};

const demoCompanies: CandidateCompany[] = [
  {
    company_name: "Clinica Dental Norte",
    country: "Spain",
    region: "Community of Madrid",
    city: "Madrid",
    industry: "Dental clinic",
    business_category: "Healthcare",
    website: "https://example.org/clinica-dental-norte",
    contact_page: "https://example.org/clinica-dental-norte/contacto",
    public_email: "info@example.org",
    public_phone: "+34 910 000 001",
    linkedin_company_page: null,
    social_profiles: ["https://instagram.com/example-dental-norte"],
    company_description: "Independent dental clinic offering general dentistry and cosmetic treatments.",
    observed_signals: ["outdated website", "no online booking", "weak local SEO", "public phone", "public email"],
    sources: ["https://example.org/clinica-dental-norte", "https://example.org/directory/dental-madrid"]
  },
  {
    company_name: "Restaurante Mar Azul",
    country: "Spain",
    region: "Valencian Community",
    city: "Valencia",
    industry: "Restaurant",
    business_category: "Hospitality",
    website: "https://example.org/mar-azul",
    contact_page: "https://example.org/mar-azul/contact",
    public_email: null,
    public_phone: "+34 960 000 002",
    linkedin_company_page: null,
    social_profiles: ["https://facebook.com/example-mar-azul"],
    company_description: "Local seafood restaurant with event dining and online menu pages.",
    observed_signals: ["poor mobile layout", "no clear CTA", "public phone", "active social profile"],
    sources: ["https://example.org/mar-azul", "https://example.org/directory/restaurants-valencia"]
  },
  {
    company_name: "Studio Fit Barrio",
    country: "Spain",
    region: "Catalonia",
    city: "Barcelona",
    industry: "Gym",
    business_category: "Fitness",
    website: "https://example.org/studio-fit-barrio",
    contact_page: null,
    public_email: "hello@example.org",
    public_phone: null,
    linkedin_company_page: null,
    social_profiles: ["https://instagram.com/example-studio-fit"],
    company_description: "Neighborhood fitness studio with classes, memberships, and personal training.",
    observed_signals: ["missing contact page", "no online booking", "unclear offer", "public email"],
    sources: ["https://example.org/studio-fit-barrio"]
  },
  {
    company_name: "Inmobiliaria Centro Sur",
    country: "Spain",
    region: "Andalusia",
    city: "Seville",
    industry: "Real estate agency",
    business_category: "Professional services",
    website: "https://example.org/centro-sur",
    contact_page: "https://example.org/centro-sur/contacto",
    public_email: "contacto@example.org",
    public_phone: "+34 955 000 003",
    linkedin_company_page: "https://linkedin.com/company/example-centro-sur",
    social_profiles: [],
    company_description: "Local real estate agency focused on residential property sales and rentals.",
    observed_signals: ["weak local SEO", "no clear CTA", "public email", "public phone", "linkedin company page"],
    sources: ["https://example.org/centro-sur", "https://linkedin.com/company/example-centro-sur"]
  },
  {
    company_name: "DentalCare Global",
    country: "Spain",
    region: "Community of Madrid",
    city: "Madrid",
    industry: "Dental clinic",
    business_category: "Healthcare",
    website: "https://example.org/dentalcare-global",
    contact_page: "https://example.org/dentalcare-global/contact",
    public_email: null,
    public_phone: "+34 900 000 999",
    linkedin_company_page: "https://linkedin.com/company/example-dentalcare-global",
    social_profiles: [],
    company_description: "National dental chain with many locations.",
    observed_signals: ["franchise", "enterprise brand", "recently redesigned website", "public phone"],
    sources: ["https://example.org/dentalcare-global"]
  }
];

export async function discoverDemoCandidates(config: SearchConfig): Promise<CandidateCompany[]> {
  const industryTerms = config.industry.toLowerCase().split(/\s+/).filter((term) => term.length > 3);
  const exclusions = config.exclude_signals.map((item) => item.toLowerCase());
  return demoCompanies
    .filter((company) => company.country.toLowerCase() === config.country.toLowerCase())
    .filter((company) => !config.city || company.city?.toLowerCase().includes(config.city.toLowerCase()))
    .filter((company) => {
      const haystack = `${company.industry} ${company.business_category} ${company.company_description}`.toLowerCase();
      return industryTerms.length === 0 || industryTerms.some((term) => haystack.includes(term));
    })
    .filter((company) => {
      const signals = company.observed_signals.join(" ").toLowerCase();
      return !exclusions.some((excluded) => signals.includes(excluded));
    })
    .slice(0, config.number_of_results);
}
