const fs = require('fs');

/**
 * Converts a string value from a given base to a BigInt.
 * @param {string} valueStr The string representation of the number.
 * @param {number} base The base to convert from.
 * @returns {BigInt} The decoded number as a BigInt.
 */
function decodeValue(valueStr, base) {
    let result = 0n; // Use BigInt literal
    const baseBigInt = BigInt(base);

    for (let i = 0; i < valueStr.length; i++) {
        const char = valueStr[i];
        let digit;

        if (char >= '0' && char <= '9') {
            digit = parseInt(char, 10);
        } else {
            // Assumes 'a' is 10, 'b' is 11, etc.
            digit = char.charCodeAt(0) - 'a'.charCodeAt(0) + 10;
        }

        result = result * baseBigInt + BigInt(digit);
    }
    return result;
}

/**
 * Solves for the secret using Lagrange Interpolation at x=0.
 * @param {object} data The parsed JSON input data.
 * @returns {BigInt} The calculated secret C.
 */
function findSecret(data) {
    const k = data.keys.k;
    const points = [];

    // 1. Parse and decode the first k points
    for (const key in data) {
        if (key !== "keys" && points.length < k) {
            const x = BigInt(key);
            const { base, value } = data[key];
            const y = decodeValue(value, parseInt(base));
            points.push({ x, y });
        }
    }

    console.log(`Using ${k} points for interpolation...`);

    let secret = 0n;

    // 2. Apply the Lagrange Interpolation formula for P(0)
    for (let j = 0; j < k; j++) {
        const currentPoint = points[j];
        let numerator = 1n;
        let denominator = 1n;

        for (let i = 0; i < k; i++) {
            if (i === j) continue; // Skip the point itself
            const otherPoint = points[i];

            // L_j(0) = product of (x_i / (x_i - x_j))
            numerator *= otherPoint.x;
            denominator *= (otherPoint.x - currentPoint.x);
        }

        // Add the term y_j * L_j(0) to the total sum
        const term = currentPoint.y * numerator / denominator;
        secret += term;
    }

    return secret;
}

// --- Main Execution ---
function main() {
    // Read the filename from command line arguments
    const filename = process.argv[2];
    if (!filename) {
        console.error("Error: Please provide the JSON file as an argument.");
        console.log("Usage: node solve.js <filename>.json");
        return;
    }

    try {
        const rawData = fs.readFileSync(filename);
        const jsonData = JSON.parse(rawData);

        const secret = findSecret(jsonData);

        console.log("\n✅ The calculated secret is:");
        console.log(secret.toString());

    } catch (error) {
        console.error(`Error processing file: ${error.message}`);
    }
}

main();