const bcrypt = require('bcrypt');

// Method 1: Using async/await
async function encryptPassword(plainPassword) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
        return {
            success: true,
            hashedPassword
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}

// Method 2: Using Promise
function hashPassword(plainPassword) {
    const saltRounds = 10;
    return new Promise((resolve, reject) => {
        bcrypt.hash(plainPassword, saltRounds)
            .then(hash => {
                resolve({
                    success: true,
                    hashedPassword: hash
                });
            })
            .catch(err => {
                resolve({
                    success: false,
                    error: err.message
                });
            });
    });
}

// Usage examples:

// Example 1: Using async/await function
async function example1() {
    const result = await encryptPassword('myPassword123');
    if (result.success) {
        console.log('Hashed password:', result.hashedPassword);
    } else {
        console.error('Error:', result.error);
    }
}

// Example 2: Using Promise-based function
hashPassword('Tanvir06#')
    .then(result => {
        if (result.success) {
            console.log('Hashed password:', result.hashedPassword);
        } else {
            console.error('Error:', result.error);
        }
    });

// Example 3: Verifying a password
async function verifyPassword(plainPassword, hashedPassword) {
    try {
        const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
        return {
            success: true,
            isMatch
        };
    } catch (error) {
        return {
            success: false,
            error: error.message
        };
    }
}