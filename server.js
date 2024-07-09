require('dotenv').config();
const express = require('express');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const session = require('express-session');

const app = express();
const port = process.env.PORT || 3000;

let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
} catch (error) {
    console.error('Error initializing OpenAI:', error);
    process.exit(1);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
if (!process.env.SESSION_SECRET) {
    console.error('SESSION_SECRET is not set');
    process.exit(1);
}

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }
}));

const DATA_DIR = process.env.WEBSITE_CONTENTSHARE ? path.join('/home', 'data') : path.join(__dirname, 'data');

async function readData(filename) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return {};
        }
        throw error;
    }
}

async function writeData(filename, data) {
    const filePath = path.join(DATA_DIR, filename);
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing to file ${filename}:`, error);
        throw error;
    }
}

// --------RECENT USERS DASHBOARD--------------
// --------RECENT USERS DASHBOARD--------------


app.get('/api/recent-users', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const allUsers = await readData('users.json');
        const recentUsers = Object.entries(allUsers)
            .map(([username, userData]) => ({
                username,
                createdAt: userData.createdAt || new Date(0).toISOString() // Fallback for older users
            }))
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 10); // Get top 10 recent users

        res.json(recentUsers);
    } catch (error) {
        console.error('Error fetching recent users:', error);
        res.status(500).json({ error: 'An error occurred while fetching recent users' });
    }
});

// New route to get a user's favorite meals
app.get('/api/user-favorite-meals/:username', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const { username } = req.params;
        const userData = await readData(`${username}_data.json`);
        res.json(userData.favoriteMeals || []);
    } catch (error) {
        console.error('Error fetching user favorite meals:', error);
        res.status(500).json({ error: 'An error occurred while fetching user favorite meals' });
    }
});

// --------END OF RECENT USERS DASHBOARD--------------
// --------END OF RECENT USERS DASHBOARD--------------

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    try {
        let users = await readData('users.json');
        if (users[username]) {
            return res.status(400).json({ error: 'Username already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        users[username] = { 
            password: hashedPassword,
            createdAt: new Date().toISOString()
        };
        await writeData('users.json', users);
        res.json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'An error occurred while registering the user' });
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }
    const users = await readData('users.json');
    const user = users[username];
    if (user && await bcrypt.compare(password, user.password)) {
        req.session.user = username;
        res.json({ message: 'Logged in successfully' });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/check-auth', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, username: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logged out successfully' });
});

app.get('/api/pantry', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const data = await readData(`${req.session.user}_pantry.json`);
    res.json(data.pantry || []);
});

app.post('/api/pantry', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const data = await readData(`${req.session.user}_pantry.json`);
    data.pantry = req.body;
    await writeData(`${req.session.user}_pantry.json`, data);
    res.json(data.pantry);
});

app.get('/api/categories', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const data = await readData(`${req.session.user}_data.json`);
    res.json(data.categories || ['Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Other']);
});

app.post('/api/generate-meals', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const { ingredients, categories } = req.body;
        if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
            return res.status(400).json({ error: 'Invalid ingredients provided' });
        }
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            return res.status(400).json({ error: 'Invalid categories provided' });
        }

        const prompt = `Given these ingredients: ${ingredients.join(', ')}, suggest 5 creative meal ideas for the following categories: ${categories.join(', ')}. For each meal, provide a name, list of ingredients with specific amounts, a brief description, simple recipe instructions, and its category. The category MUST be one of the following: ${categories.join(', ')}. Format the response as a JSON array of objects, each with 'name', 'ingredients' (as an array of objects with 'name' and 'amount' properties), 'description', 'instructions', and 'category' properties.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        let content = completion.choices[0].message.content.trim();
        content = content.replace(/```json\n?|\n?```/g, '');
        content = content.replace(/^\s*\[/, '[').replace(/\]\s*$/, ']');

        let meals;
        try {
            meals = JSON.parse(content);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.log('Raw content:', content);
            return res.status(500).json({ error: 'Failed to parse meal suggestions. Please try again.' });
        }

        if (!Array.isArray(meals)) {
            return res.status(500).json({ error: 'Invalid meal suggestions format. Please try again.' });
        }

        meals = meals.filter(meal => categories.includes(meal.category));
        meals = meals.slice(0, 5); // Limit to 5 meals

        meals = meals.map(meal => ({
            name: meal.name || 'Unnamed Meal',
            ingredients: Array.isArray(meal.ingredients) ? meal.ingredients : [],
            description: meal.description || 'No description provided',
            instructions: meal.instructions || 'No instructions provided',
            category: meal.category || 'Uncategorized'
        }));

        res.json(meals);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'An error occurred while generating meal suggestions. Please try again.' });
    }
});

app.get('/api/favorite-meals', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const data = await readData(`${req.session.user}_data.json`);
    res.json(data.favoriteMeals || []);
});

app.post('/api/favorite-meals', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    const data = await readData(`${req.session.user}_data.json`);
    data.favoriteMeals = req.body;
    await writeData(`${req.session.user}_data.json`, data);
    res.json(data.favoriteMeals);
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});