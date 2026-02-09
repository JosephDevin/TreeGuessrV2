function normalizeStr(s) {
    return String(s ?? "")
        .toLowerCase()
        .normalize("NFD").replace(/\p{Diacritic}/gu, "")
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
        .replace(/\s+/g, " ")
        .trim();
}
function levenshtein(a, b) {
    a = normalizeStr(a); b = normalizeStr(b);
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    if (a.length > b.length) [a, b] = [b, a];
    const dp = new Array(a.length + 1);
    for (let i = 0; i <= a.length; i++) dp[i] = i;
    for (let j = 1; j <= b.length; j++) {
        let prevDiag = j - 1, cur = j;
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const ins = cur + 1, del = dp[i] + 1, sub = prevDiag + cost;
            prevDiag = dp[i]; cur = Math.min(ins, del, sub); dp[i] = cur;
        }
    }
    return dp[a.length];
}
function similarity(a, b) {
    const maxLen = Math.max(normalizeStr(a).length, normalizeStr(b).length) || 1;
    return 1 - (levenshtein(a, b) / maxLen); // 0..1
}