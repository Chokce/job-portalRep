
// A service for fetching jobs from the JSearch API on RapidAPI.
class ExternalJobService {
    /**
     * Fetches jobs from the JSearch API based on search parameters.
     * 
     * @param {object} searchParams - The search parameters (e.g., keyword, location).
     * @returns {Promise<Array>} A promise that resolves to an array of job objects.
     */
    static async fetchJobs(searchParams) {
        // =====================================================================================
        // TODO: Replace with your actual API key from RapidAPI.
        // =====================================================================================
        const API_ENDPOINT = 'https://jsearch.p.rapidapi.com/search'; // JSearch Request URL
        const API_KEY = 'bd0e2530a8msh4b7b68db897908ap11031ajsnd84134323dea'; // <-- IMPORTANT: Replace with your X-RapidAPI-Key

        // Construct the query parameters from the searchParams object.
        const query = new URLSearchParams({
            query: `${searchParams.keyword || ''} in ${searchParams.location || ''}`,
            num_pages: '1'
        }).toString();

        try {
            const response = await fetch(`${API_ENDPOINT}?${query}`, {
                method: 'GET',
                headers: {
                    'X-RapidAPI-Key': API_KEY,
                    'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
                }
            });

            if (!response.ok) {
                console.error(`Error fetching from JSearch API: ${response.status} ${response.statusText}`);
                return [];
            }

            const result = await response.json();
            const apiJobs = result.data || [];

            // Transform the raw data from the JSearch API into our standard application format.
            return this.transformApiData(apiJobs);

        } catch (error) {
            console.error('Failed to fetch external jobs:', error);
            return []; // Return an empty array on network error.
        }
    }

    /**
     * Transforms the raw data from the JSearch API into the application's standard job format.
     * 
     * @param {Array} apiJobs - An array of job objects from the JSearch API.
     * @returns {Array} An array of job objects in the standard application format.
     */
    static transformApiData(apiJobs) {
        return apiJobs.map(job => ({
            id: `ext-${job.job_id}`,
            title: job.job_title,
            company: job.employer_name,
            location: job.job_city || job.job_country,
            description: job.job_description,
            jobType: this.normalizeJobType(job.job_employment_type),
            salaryMin: null, // JSearch API v1 does not provide salary directly
            salaryMax: null,
            postedBy: 'external',
            createdAt: job.job_posted_at_timestamp ? new Date(job.job_posted_at_timestamp * 1000).toISOString() : new Date().toISOString(),
            external: true,
            applyUrl: job.job_apply_link
        }));
    }

    /**
     * Normalizes job types from the JSearch API to match the application's standard types.
     * 
     * @param {string} apiJobType - The job type from the JSearch API (e.g., 'FULLTIME').
     * @returns {string} The standardized job type (e.g., 'Full Time').
     */
    static normalizeJobType(apiJobType) {
        const type = (apiJobType || '').toUpperCase();
        switch (type) {
            case 'FULLTIME':
                return 'Full Time';
            case 'PARTTIME':
                return 'Part Time';
            case 'CONTRACTOR':
                return 'Contract';
            case 'INTERN':
                return 'Internship';
            default:
                return 'Other';
        }
    }
}

export default ExternalJobService;
