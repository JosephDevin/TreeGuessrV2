export function createTree(scientificName, frenchName, aliases, trefleData, familyName) {
    return { scientificName, frenchName, aliases, trefleData, familyName };
}

export async function getData() {
    const res = await fetch("/api/common-trees");

    if (!res.ok) {
        console.error("API error", res.status);
        return null;
    }

    const data = await res.json();

    if (!data) return null;

    return createTree(
        data.scientific_name,
        data.nom_francais,
        data.aliases_francais || [],
        data.botanical_details || null,
        data.family_name || null
    );
}




/*console.log("%c--- 🌿 EXPLORATEUR BOTANIQUE AVANCÉ 🌿 ---", "color: #1b5e20; font-weight: bold; font-size: 18px; background: #e8f5e9; padding: 5px 10px; border-radius: 5px;");

fetch("/api/common-trees")
    .then(res => res.json())
    .then(data => {
        console.log(`%cAnalyse terminée : ${data.length} espèces chargées.`, "color: #455a64; font-style: italic;");

        data.forEach((tree, index) => {
            const b = tree.botanical_details;

            // 1. HEADER SECTION
            console.group(`%c${index + 1}. ${tree.nom_francais.toUpperCase()}`, "color: #2e7d32; font-weight: bold; font-size: 14px;");

            console.log(`%cScientific Name: %c${tree.scientific_name} (${b?.year || 'N/A'})`, "font-weight: bold;", "font-style: italic; color: #d32f2f;");

            if (tree.aliases_francais.length > 0) {
                console.log(`%cSynonymes: %c${tree.aliases_francais.join(', ')}`, "font-weight: bold;", "color: #f57c00;");
            }

            // 2. IMAGE GALLERY (AS URLS)
            console.groupCollapsed("%c📸 Galerie d'images (URLs)", "color: #0288d1; font-weight: bold;");
            console.log("Feuille (Leaf):", b?.image_leaf || "❌ Non disponible");
            console.log("Silhouette (Habit):", b?.image_habit || "❌ Non disponible");
            console.log("Fleur/Écorce (Flower/Bark):", b?.image_flower_or_bark || "❌ Non disponible");
            console.groupEnd();

            // 3. PHYSICAL SPECIFICATIONS (TABLE)
            if (b) {
                console.log("%c📏 Spécifications Physiques:", "font-weight: bold; color: #4e342e;");
                console.table({
                    "Hauteur Moyenne": b.average_height ? `${b.average_height} cm` : "N/A",
                    "Hauteur Max": b.maximum_height ? `${b.maximum_height} cm` : "N/A",
                    "Vitesse de croissance": b.growth_rate || "N/A",
                    "Espérance de vie": b.duration_of_life || "N/A",
                    "Temp Min (°C)": b.min_temp || "N/A",
                    "Temp Max (°C)": b.max_temp || "N/A"
                });

                // 4. BOTANICAL TRAITS
                console.log("%c🌱 Caractéristiques Biologiques:", "font-weight: bold; color: #4e342e;");
                console.log(`  • Texture du sol: ${b.soil_texture || 'Inconnue'}`);
                console.log(`  • Couleur Fleur: ${b.flower_color || 'N/A'} | Feuille: ${b.leaf_color || 'N/A'}`);
                console.log(`  • Fruit: ${b.fruit_color || 'N/A'} (${b.fruit_shape || 'forme inconnue'})`);
                console.log(`  • Comestible: ${b.edible ? '✅ Oui' : '❌ Non/Inconnu'}`);
                console.log(`  • Floraison: ${b.bloom_months || 'N/A'} | Fructification: ${b.fruit_months || 'N/A'}`);

                if (b.observations) {
                    console.log(`%cObservations: %c${b.observations}`, "font-weight: bold;", "font-style: italic; color: #616161;");
                }
            } else {
                console.log("%c⚠️ Aucune donnée Trefle trouvée pour cette espèce.", "color: #d32f2f;");
            }

            console.groupEnd();
        });
    })
    .catch(err => console.error("%cERREUR CRITIQUE:", "background: red; color: white;", err));*/