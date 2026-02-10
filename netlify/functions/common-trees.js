import express from "express";
import serverless from "serverless-http";

const app = express();

/* ================== CONSTANTS ================== */

const TREFLE_TOKEN = "usr-T5c2j4Ln4fXpHLnAIw2j_prE7KeZasfdSf9nswR9D7s"
const TREE_FAMILIES = [
    "Fagaceae","Pinaceae","Betulaceae","Sapindaceae","Oleaceae",
    "Rosaceae","Salicaceae","Cupressaceae","Ulmaceae",
    "Aquifoliaceae","Tiliaceae","Platanaceae"
];

/* ================== HELPERS ================== */

const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
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
        const searchRes = await fetch(
            `https://trefle.io/api/v1/plants?token=${TREFLE_TOKEN}&filter[scientific_name]=${encodeURIComponent(sciname)}`
        );
        const searchData = await searchRes.json();
        if (!searchData.data?.length) return null;

        const detailRes = await fetch(
            `https://trefle.io/api/v1/plants/${searchData.data[0].id}?token=${TREFLE_TOKEN}`
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
        const res = await fetch(url, { headers: { "User-Agent": "TreeGame/1.0" } });
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

/* ================== ROUTE ================== */
/* ================== ROUTE ================== */

const router = express.Router();

// We define the route as just "/common-trees" inside the router
router.get("/common-trees", async (req, res) => {
    try {
        const offset = Math.floor(Math.random() * 500);
        const gbifUrl = `https://api.gbif.org/v1/occurrence/search?country=GB&country=FR&taxonKey=212&taxonKey=220&facet=speciesKey&limit=0&facetLimit=1000&offset=${offset}`;

        const gbifRes = await fetchWithTimeout(gbifUrl);
        const gbifData = await gbifRes.json();

        if (!gbifData.facets || !gbifData.facets[0]) {
            return res.status(404).json({ error: "GBIF data unavailable" });
        }

        let pool = gbifData.facets[0].counts;
        pool.sort(() => Math.random() - 0.5);

        for (const item of pool) {
            try {
                const infoRes = await fetchWithTimeout(`https://api.gbif.org/v1/species/${item.name}`);
                if (!infoRes.ok) continue;
                const info = await infoRes.json();

                if (!TREE_FAMILIES.includes(info.family)) continue;

                const [fr, trefle] = await Promise.all([
                    getFrenchData(info.canonicalName),
                    getTrefleDetailedData(info.canonicalName)
                ]);

                // Check quality: Need trefle data and at least one alias for the game logic
                if (!trefle || !fr || !fr.aliases || fr.aliases.length === 0) continue;

                return res.json({
                    scientific_name: info.canonicalName,
                    nom_francais: fr.main,
                    aliases_francais: fr.aliases,
                    botanical_details: trefle
                });
            } catch (err) {
                console.error(`Skipping ${item.name} due to fetch error`);
                continue;
            }
        }

        res.status(404).json({ error: "No valid tree found" });
    } catch (e) {
        console.error("Route Error:", e);
        res.status(500).json({ error: "Network error" });
    }
});

app.use("/.netlify/functions", router);
app.use("/api", router);
/* ================== EXPORT ================== */

export const handler = serverless(app);
