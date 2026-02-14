export function createTree(scientificName, frenchName, aliases, trefleData, familyName) {
    return { scientificName, frenchName, aliases, trefleData, familyName };
}

// FETCHES THE RESULT OF SERVER SIDE
export async function getData() {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedArea = urlParams.get('area') || localStorage.getItem('selectedArea') || 'whole-world';

    const response = await fetch(`/.netlify/functions/common-trees?area=${selectedArea}`);
    const data = await response.json();


    if (!data) return null;

    return createTree(
        data.scientific_name,
        data.nom_francais,
        data.aliases_francais || [],
        data.botanical_details || null,
        data.family_name || "Inconnu"
    );
}