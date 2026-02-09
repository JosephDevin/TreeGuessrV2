import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "../public")));

const TREFLE_TOKEN = 'usr-T5c2j4Ln4fXpHLnAIw2j_prE7KeZasfdSf9nswR9D7s';
const TREE_FAMILIES = ['Fagaceae', 'Pinaceae', 'Betulaceae', 'Sapindaceae', 'Oleaceae', 'Rosaceae', 'Salicaceae', 'Cupressaceae', 'Ulmaceae', 'Aquifoliaceae', 'Tiliaceae', 'Platanaceae'];

const fetchWithTimeout = async (url, options = {}, timeout = 5000) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (e) {
        clearTimeout(id);
        throw e;
    }
};

async function getTrefleDetailedData(sciname) {
    try {
        const searchRes = await fetch(`https://trefle.io/api/v1/plants?token=${TREFLE_TOKEN}&filter[scientific_name]=${encodeURIComponent(sciname)}`);
        const searchData = await searchRes.json();
        if (!searchData.data || searchData.data.length === 0) return null;

        const detailRes = await fetch(`https://trefle.io/api/v1/plants/${searchData.data[0].id}?token=${TREFLE_TOKEN}`);
        const full = await detailRes.json();
        const ms = full.data.main_species;

        const getRandomImg = (arr) => {
            if (!arr || arr.length === 0) return null;
            return arr[Math.floor(Math.random() * arr.length)].image_url;
        };

        return {
            image_leaf: getRandomImg(ms.images?.leaf),
            image_habit: getRandomImg(ms.images?.habit),
            image_flower_or_bark: getRandomImg(ms.images?.flower) || getRandomImg(ms.images?.bark),
            common_name: full.data.common_name || null,
            scientific_name: full.data.scientific_name || null,
            year: full.data.year || null,
            family_common_name: full.data.family_common_name || null,
            observations: full.data.observations || null,
            average_height: ms.specifications?.average_height?.cm || null,
            maximum_height: ms.specifications?.maximum_height?.cm || null,
            flower_color: ms.specifications?.flower_color || null,
            leaf_color: ms.specifications?.foliage_color || null,
            fruit_color: ms.specifications?.fruit_or_seed?.color || null,
            fruit_shape: ms.specifications?.fruit_or_seed?.shape || null,
            edible: ms.specifications?.edible || null,
            growth_rate: ms.growth?.growth_rate || null,
            growth_description: ms.growth?.description || null,
            fruit_months: ms.growth?.fruit_months || null,
            bloom_months: ms.growth?.bloom_months || null,
            duration_of_life: ms.specifications?.lifespan || null,
            soil_texture: ms.growth?.soil_texture || null,
            min_temp: ms.growth?.minimum_temperature?.deg_c || null,
            max_temp: ms.growth?.maximum_temperature?.deg_c || null
        };
    } catch (e) { return null; }
}

async function getFrenchData(sciname) {
    try {
        const sparql = `SELECT ?label (GROUP_CONCAT(DISTINCT ?alias; SEPARATOR="|") AS ?aliases) WHERE {
          ?item wdt:P225 "${sciname}".
          OPTIONAL { ?item rdfs:label ?label. FILTER(LANG(?label) = "fr") }
          OPTIONAL { ?item skos:altLabel ?alias. FILTER(LANG(?alias) = "fr") }
        } GROUP BY ?item ?label LIMIT 1`;
        const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
        const res = await fetch(url, { headers: { 'User-Agent': 'TreeGame/1.0' } });
        const data = await res.json();
        const result = data.results.bindings[0];
        if (!result) return null;
        return {
            main: result.label?.value || null,
            aliases: result.aliases?.value ? result.aliases.value.split('|').filter(a => a.trim()) : []
        };
    } catch (e) { return null; }
}

app.get("/api/common-trees", async (req, res) => {
    try {
        const randomOffset = Math.floor(Math.random() * 500);
        const gbifUrl = `https://api.gbif.org/v1/occurrence/search?country=GB&country=FR&taxonKey=212&taxonKey=220&facet=speciesKey&limit=0&facetLimit=1000&offset=${randomOffset}`;

        const gbifRes = await fetchWithTimeout(gbifUrl);
        const gbifData = await gbifRes.json();
        let pool = gbifData.facets[0].counts;

        // Shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }

        let finalResult = null;

        for (const item of pool) {
            try {
                // If the individual species fetch fails, we catch it here and CONTINUE the loop
                const infoRes = await fetchWithTimeout(`https://api.gbif.org/v1/species/${item.name}`);
                if (!infoRes.ok) continue;
                const info = await infoRes.json();

                if (!TREE_FAMILIES.includes(info.family)) continue;

                // Use the timeout fetch for Wikidata and Trefle too
                const [frData, trefleData] = await Promise.allSettled([
                    getFrenchData(info.canonicalName),
                    getTrefleDetailedData(info.canonicalName)
                ]).then(results => results.map(r => r.status === 'fulfilled' ? r.value : null));

                const nomFr = frData?.main || info.canonicalName;
                const aliases = frData?.aliases || [];

                if (aliases.length === 0 && nomFr.toLowerCase() === info.canonicalName.toLowerCase()) continue;
                if (!trefleData) continue;

                finalResult = {
                    scientific_name: info.canonicalName,
                    nom_francais: nomFr,
                    aliases_francais: aliases,
                    botanical_details: trefleData
                };

                console.log(`✅ Tree Loaded: ${nomFr}`);
                break;
            } catch (err) {
                // This catches the EHOSTUNREACH specifically for this loop iteration
                console.log(`⚠️ Network flicker for ${item.name}, skipping to next...`);
                continue;
            }
        }

        if (finalResult) {
            res.json(finalResult);
        } else {
            res.status(404).json({ error: "All species in pool were unreachable or invalid." });
        }

    } catch (err) {
        console.error("🔥 Global Route Error:", err.message);
        res.status(500).json({ error: "Network error occurred. Please try again." });
    }
});
app.listen(PORT, () => console.log(`🌳 Single-Tree Engine Online: http://localhost:${PORT}`));