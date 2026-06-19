import express from "express";
import serverless from "serverless-http";

const app = express();

/* ================== CONSTANTS ================== */

const TREFLE_TOKEN = process.env.TREFLE_TOKEN;

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

        const allImages = Object.values(ms.images || {}).flat();
        const anyImage = rand(allImages);


        return {
            image_leaf: rand(ms.images?.leaf) || anyImage,
            image_habit: rand(ms.images?.habit) || anyImage,
            image_flower_or_bark: rand(ms.images?.flower) || rand(ms.images?.bark) || anyImage,

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
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers['x-forwarded-host'] || req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        const treesDatabase = await loadTreesData(baseUrl);
        if (!treesDatabase) {
            return res.status(500).json({ error: "Failed to load trees database" });
        }

        // Single dataset now — grab the only (or first) key present
        const treesForArea = Object.values(treesDatabase)[0];

        if (!treesForArea || !treesForArea.length) {
            return res.status(500).json({ error: "No trees found in database" });
        }

        const randomTree = treesForArea[Math.floor(Math.random() * treesForArea.length)];

        console.log(`Selected: ${randomTree.scientificName}`);

        const trefle = await getTrefleDetailedData(randomTree.scientificName);

        const aliases = Array.isArray(randomTree.aliases) ? randomTree.aliases : [];
        const frenchName = randomTree.frenchName || aliases[0] || randomTree.scientificName;

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