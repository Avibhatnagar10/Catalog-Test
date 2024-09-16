const fs = require('fs');
const readline = require('readline');

// Function to decode a number from a given base
function decodeValue(base, value) {
    if (isNaN(base) || base < 2 || base > 36) {
        throw new Error(`Invalid base: ${base}. Base should be between 2 and 36.`);
    }
    return parseInt(value, base);  // Decode the value from the given base
}

// Function to validate JSON input
function validateJSON(inputData) {
    if (!inputData.keys || !inputData.keys.n || !inputData.keys.k) {
        throw new Error("Missing required 'keys' fields (n or k).");
    }
    if (typeof inputData.keys.n !== 'number' || typeof inputData.keys.k !== 'number') {
        throw new Error("'n' and 'k' should be numbers.");
    }
    if (inputData.keys.k > inputData.keys.n) {
        throw new Error("k should not be greater than n.");
    }

    Object.keys(inputData).forEach(key => {
        if (key !== 'keys') {
            const point = inputData[key];
            const base = parseInt(point.base);
            const value = point.value;
            
            if (!point.base || !point.value) {
                throw new Error(`Missing 'base' or 'value' in point ${key}.`);
            }
            if (isNaN(base) || base < 2 || base > 36) {
                throw new Error(`Invalid 'base' in point ${key}: ${base}. Base should be between 2 and 36.`);
            }
            if (isNaN(parseInt(value, base))) {
                throw new Error(`Invalid 'value' in point ${key}: ${value}. Value is not valid for base ${base}.`);
            }
        }
    });
}

// Function to calculate the constant term using Lagrange interpolation
function lagrangeInterpolation(points) {
    let constantTerm = 0.0;
    const k = points.length;

    for (let i = 0; i < k; i++) {
        const xi = points[i][0];
        const yi = points[i][1];

        // Calculate the Lagrange basis polynomial L_i(0)
        let term = yi;

        for (let j = 0; j < k; j++) {
            if (i !== j) {
                const xj = points[j][0];
                term *= (0 - xj) / (xi - xj);  // Evaluate L_i at x = 0
            }
        }

        constantTerm += term;
    }

    return constantTerm;
}

// Function to process a JSON file and calculate the secret
function processFile(filePath) {
    try {
        // Read the input JSON from the file
        const jsonInput = fs.readFileSync(filePath, 'utf8');
        const inputData = JSON.parse(jsonInput);
        
        // Validate JSON input
        validateJSON(inputData);

        const keys = inputData.keys;
        const n = keys.n;
        const k = keys.k;

        console.log(`Processing file: ${filePath}`);
        console.log(`Number of points provided: ${n}`);
        console.log(`Minimum number of points required (k): ${k}`);

        // Collect the points (x, y)
        const points = [];

        // Loop through the inputData object to extract points
        Object.keys(inputData).forEach(key => {
            if (key !== 'keys') {
                const x = parseInt(key);  // The key is the x value
                const point = inputData[key];
                const base = parseInt(point.base);  // The base
                const encodedY = point.value;  // The encoded y value
                const y = decodeValue(base, encodedY);  // Decode the y value

                // Add the point (x, y) to the points array
                points.push([x, y]);

                console.log(`Point (x, y): (${x}, ${y})`);
            }
        });

        // Ensure we have enough points to solve the polynomial
        if (points.length < k) {
            throw new Error("Not enough points to solve the polynomial");
        }

        // Calculate the constant term (secret) using Lagrange interpolation
        const secret = lagrangeInterpolation(points.slice(0, k));  // Use the first k points
        console.log("The secret (constant term) is:", secret);
    } catch (error) {
        console.error(`Error processing file ${filePath}: ${error.message}`);
    }
}

// Function to prompt user for file choice
function promptUser() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Which input file would you like to process? (input1 or input2): ', (answer) => {
        const filePath = answer.trim() === 'input1' ? 'input1.json' : 'input2.json';
        if (filePath !== 'input1.json' && filePath !== 'input2.json') {
            console.error('Invalid choice. Please enter "input1" or "input2".');
            rl.close();
            process.exit(1);
        }

        // Process the chosen file
        processFile(filePath);
        rl.close();
    });
}

// Execute the prompt function
promptUser();
