import express from "express";
import serverless from "serverless-http";

const app = express();

/* ================== CONSTANTS ================== */

const TREFLE_TOKEN = "usr-T5c2j4Ln4fXpHLnAIw2j_prE7KeZasfdSf9nswR9D7s"

/* ================== HELPERS ================== */

const fetchWithTimeout = async (url, options = {}, timeout = 15000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return res;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

async function getTrefleDetailedData(sciname) {
    try {
        const searchRes = await fetchWithTimeout(
            `https://trefle.io/api/v1/plants?token=${TREFLE_TOKEN}&filter[scientific_name]=${encodeURIComponent(sciname)}`,
            {},
            12000
        );
        const searchData = await searchRes.json();
        if (!searchData.data?.length) return null;

        const detailRes = await fetchWithTimeout(
            `https://trefle.io/api/v1/plants/${searchData.data[0].id}?token=${TREFLE_TOKEN}`,
            {},
            12000
        );
        const full = await detailRes.json();
        const ms = full.data.main_species;

        const rand = arr => arr?.length ? arr[Math.floor(Math.random() * arr.length)].image_url : null;

        return {
            image_leaf: rand(ms.images?.leaf),
            image_habit: rand(ms.images?.habit),
            image_flower_or_bark: rand(ms.images?.flower) || rand(ms.images?.bark),
            common_name: full.data.common_name,
            scientific_name: full.data.scientific_name,
            family_common_name: full.data.family_common_name,
            average_height: ms.specifications?.average_height?.cm,
            maximum_height: ms.specifications?.maximum_height?.cm,
            flower_color: ms.specifications?.flower_color,
            leaf_color: ms.specifications?.foliage_color,
            fruit_color: ms.specifications?.fruit_or_seed?.color,
            growth_rate: ms.growth?.growth_rate,
            bloom_months: ms.growth?.bloom_months,
            min_temp: ms.growth?.minimum_temperature?.deg_c,
            max_temp: ms.growth?.maximum_temperature?.deg_c
        };
    } catch {
        return null;
    }
}

async function getFrenchData(sciname) {
    try {
        const sparql = `
      SELECT ?label (GROUP_CONCAT(DISTINCT ?alias; SEPARATOR="|") AS ?aliases) WHERE {
        ?item wdt:P225 "${sciname}".
        OPTIONAL { ?item rdfs:label ?label. FILTER(LANG(?label)="fr") }
        OPTIONAL { ?item skos:altLabel ?alias. FILTER(LANG(?alias)="fr") }
      } GROUP BY ?item ?label LIMIT 1
    `;
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
        const res = await fetchWithTimeout(
            url,
            { headers: { "User-Agent": "TreeGame/1.0" } },
            12000
        );
        const json = await res.json();
        const r = json.results.bindings[0];
        if (!r) return null;
        return {
            main: r.label?.value,
            aliases: r.aliases?.value?.split("|") ?? []
        };
    } catch {
        return null;
    }
}

// Load trees JSON from public URL
async function loadTreesData(baseUrl) {
    try {
        const treesUrl = `${baseUrl}/data/trees/trees.json`;
        console.log("Loading trees from:", treesUrl);

        const response = await fetchWithTimeout(treesUrl, {}, 10000);
        if (!response.ok) {
            throw new Error(`Failed to fetch trees.json: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (e) {
        console.error("Error loading trees.json:", e);
        return null;
    }
}

/* ================== ROUTE ================== */
const router = express.Router();

router.get("/common-trees", async (req, res) => {
    try {
        const selectedArea = req.query.area || 'western-europe';
        console.log("Requested area:", selectedArea);

        // Get base URL from the request
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        // Load trees database
        const treesDatabase = await loadTreesData(baseUrl);
        if (!treesDatabase) {
            return res.status(500).json({ error: "Failed to load trees database" });
        }

        // Get trees for the selected area
        const treesForArea = treesDatabase[selectedArea];
        if (!treesForArea || treesForArea.length === 0) {
            console.error(`No trees found for area: ${selectedArea}`);
            return res.status(404).json({ error: `No trees available for area: ${selectedArea}` });
        }

        console.log(`Found ${treesForArea.length} trees for ${selectedArea}`);

        // Pick a random tree
        const randomTree = treesForArea[Math.floor(Math.random() * treesForArea.length)];

        console.log(`Selected: ${randomTree.scientificName}`);

        // Get aliases from Wikidata
        const fr = await getFrenchData(randomTree.scientificName);

        // Get Trefle data for botanical details
        const trefle = await getTrefleDetailedData(randomTree.scientificName);

        // Use aliases from Wikidata if available, otherwise use empty array
        const aliases = (fr && fr.aliases && fr.aliases.length > 0) ? fr.aliases : [];

        // Use French name from JSON, fallback to Wikidata if needed
        const frenchName = randomTree.frenchName || fr?.main || randomTree.scientificName;

        // Create botanical details object with occurrences
        const botanicalDetails = trefle || {};
        botanicalDetails.occurrences = randomTree.occurrences;

        console.log("✓ Returning tree:", randomTree.scientificName);
        return res.json({
            scientific_name: randomTree.scientificName,
            nom_francais: frenchName,
            aliases_francais: aliases,
            botanical_details: botanicalDetails,
            family_name: randomTree.family
        });

    } catch (e) {
        console.error("FATAL Route Error:", e.message, e.stack);
        res.status(500).json({ error: e.message });
    }
});

app.use("/.netlify/functions", router);
app.use("/api", router);

export const handler = serverless(app);