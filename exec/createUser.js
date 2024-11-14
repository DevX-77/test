const readline = require('readline');
const { db } = require('../handlers/db.js');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');
const CatLoggr = require('cat-loggr');
const log = new CatLoggr();
const saltRounds = 10;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to create a new user
async function createUser(username, password, isAdmin) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const userId = uuidv4();
    return db.set(username, { userId, username, password: hashedPassword, admin: isAdmin });
}

// Function to ask questions to the user (for interactive input)
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

// Function to parse command-line arguments
function parseArgs() {
    const args = process.argv.slice(2);  // Get arguments after the script name
    const options = {};
    
    args.forEach((arg, index) => {
        if (arg === '--admin' && args[index + 1]) {
            options.admin = args[index + 1].toLowerCase() === 'true';
        }
        if (arg === '--username' && args[index + 1]) {
            options.username = args[index + 1];
        }
        if (arg === '--password' && args[index + 1]) {
            options.password = args[index + 1];
        }
    });

    return options;
}

// Main function to control the flow
async function main() {
    const options = parseArgs();

    if (!options.username || !options.password) {
        log.error('Username and password are required.');
        rl.close();
        return;
    }

    log.init('Creating a new user:');
    
    const { username, password, admin = false } = options;

    const userExists = await db.get(username);
    if (userExists) {
        log.error("User already exists!");
        rl.close();
        return;
    }

    await createUser(username, password, admin);
    log.info(`User ${username} created with ${admin ? 'admin' : 'regular'} privileges.`);
    rl.close();
}

// Execute the main function
main();
