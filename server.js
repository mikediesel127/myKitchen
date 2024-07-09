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

// In server.js, update the /api/generate-meals endpoint

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

        const prompt = `Given strictly only these ingredients to choose from: ${ingredients.join(', ')}, suggest 5 creative meal ideas SPECIFICALLY and sensibly for the following categories only: ${categories.join(', ')}. For each meal, provide a name, list of ingredients with specific amounts, a brief description, simple recipe instructions, and its category. They MUST NOT contain any other ingredients except for those included in the list to choose from. Pick which ingredients will be appropriate for the selected category (eg. do not put meat, vegetables, pasta etc. in desserts.) Be appropriate.The category MUST be one of the following: ${categories.join(', ')}. Format the response as a JSON array of objects, each with 'name', 'ingredients' (as an array of objects with 'name' and 'amount' properties), 'description', 'instructions', and 'category' properties. [NOTE (IMPORTANT): ONLY CHOOSE INGREDIENTS THAT ARE APPROPRIATE AND ASSOCIATED WITH ITS CATEGORY! (eg. no meat in dessert meals!)]`;

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        let content = completion.choices[0].message.content.trim();
        
        // Remove any markdown formatting
        content = content.replace(/```json\n?|\n?```/g, '');
        
        // Remove trailing commas
        content = content.replace(/,(\s*[\]}])/g, '$1');

        // Ensure the content starts with '[' and ends with ']'
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

        // Filter meals to ensure they match the requested categories
        meals = meals.filter(meal => categories.includes(meal.category));

        // Limit to 5 meals
        meals = meals.slice(0, 5);

        // Ensure all required properties are present
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

// In server.js, add these new endpoints

app.get('/api/top-ingredients', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const data = await readData(`${req.session.user}_pantry.json`);
        const ingredientCounts = {};
        data.pantry.forEach(item => {
            ingredientCounts[item.name] = (ingredientCounts[item.name] || 0) + 1;
        });
        const sortedIngredients = Object.entries(ingredientCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5);
        res.json(sortedIngredients);
    } catch (error) {
        console.error('Error fetching top ingredients:', error);
        res.status(500).json({ error: 'An error occurred while fetching top ingredients' });
    }
});

app.get('/api/favorite-categories', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const data = await readData(`${req.session.user}_data.json`);
        const categoryCounts = {};
        (data.favoriteMeals || []).forEach(meal => {
            categoryCounts[meal.category] = (categoryCounts[meal.category] || 0) + 1;
        });
        const sortedCategories = Object.entries(categoryCounts)
            .sort((a, b) => b[1] - a[1]);
        res.json(sortedCategories);
    } catch (error) {
        console.error('Error fetching favorite categories:', error);
        res.status(500).json({ error: 'An error occurred while fetching favorite categories' });
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
    try {
        const data = await readData(`${req.session.user}_data.json`);
        data.favoriteMeals = req.body;
        await writeData(`${req.session.user}_data.json`, data);
        res.json({ message: 'Favorite meals updated successfully' });
    } catch (error) {
        console.error('Error updating favorite meals:', error);
        res.status(500).json({ error: 'An error occurred while updating favorite meals' });
    }
});

// -------- USER RECIPE SHARING --------
app.post('/api/share-recipe', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const { recipe } = req.body;
        const sharedRecipes = await readData('shared_recipes.json');
        const recipeId = Date.now().toString();
        sharedRecipes[recipeId] = {
            ...recipe,
            sharedBy: req.session.user,
            sharedAt: new Date().toISOString()
        };
        await writeData('shared_recipes.json', sharedRecipes);
        res.json({ message: 'Recipe shared successfully', recipeId });
    } catch (error) {
        console.error('Error sharing recipe:', error);
        res.status(500).json({ error: 'An error occurred while sharing the recipe' });
    }
});

app.get('/api/shared-recipes', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const sharedRecipes = await readData('shared_recipes.json');
        res.json(Object.entries(sharedRecipes).map(([id, recipe]) => ({ id, ...recipe })));
    } catch (error) {
        console.error('Error fetching shared recipes:', error);
        res.status(500).json({ error: 'An error occurred while fetching shared recipes' });
    }
});

app.get('/api/shared-recipe/:id', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const sharedRecipes = await readData('shared_recipes.json');
        const recipe = sharedRecipes[req.params.id];
        if (recipe) {
            res.json(recipe);
        } else {
            res.status(404).json({ error: 'Recipe not found' });
        }
    } catch (error) {
        console.error('Error fetching shared recipe:', error);
        res.status(500).json({ error: 'An error occurred while fetching the shared recipe' });
    }
});
// -------- END USER RECIPE SHARING --------

// -------- PANTRY EXPIRATION TRACKING --------
app.post('/api/update-pantry-item', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const { itemName, expirationDate } = req.body;
        const data = await readData(`${req.session.user}_pantry.json`);
        const itemIndex = data.pantry.findIndex(item => item.name === itemName);
        if (itemIndex !== -1) {
            data.pantry[itemIndex].expirationDate = expirationDate;
            await writeData(`${req.session.user}_pantry.json`, data);
            res.json({ message: 'Pantry item updated successfully' });
        } else {
            res.status(404).json({ error: 'Pantry item not found' });
        }
    } catch (error) {
        console.error('Error updating pantry item:', error);
        res.status(500).json({ error: 'An error occurred while updating the pantry item' });
    }
});

app.get('/api/expiring-items', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const data = await readData(`${req.session.user}_pantry.json`);
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringItems = data.pantry.filter(item => {
            if (!item.expirationDate) return false;
            const expirationDate = new Date(item.expirationDate);
            return expirationDate > now && expirationDate <= sevenDaysFromNow;
        });
        res.json(expiringItems);
    } catch (error) {
        console.error('Error fetching expiring items:', error);
        res.status(500).json({ error: 'An error occurred while fetching expiring items' });
    }
});
// -------- END PANTRY EXPIRATION TRACKING --------
// -------- FRIEND MANAGEMENT --------
// In server.js, add these new endpoints

// -------- FRIEND MANAGEMENT / ME PAGE--------
app.post('/api/add-friend', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const { friendUsername } = req.body;
        if (friendUsername === req.session.user) {
            return res.status(400).json({ error: 'You cannot add yourself as a friend' });
        }
        const users = await readData('users.json');
        if (!users[friendUsername]) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userData = await readData(`${req.session.user}_data.json`);
        const friendData = await readData(`${friendUsername}_data.json`);
        
        if (!userData.friends) userData.friends = [];
        if (!userData.friendRequests) userData.friendRequests = [];
        if (!friendData.friendRequests) friendData.friendRequests = [];

        if (userData.friends.includes(friendUsername)) {
            return res.status(400).json({ error: 'Already friends with this user' });
        }
        if (userData.friendRequests.includes(friendUsername) || friendData.friendRequests.includes(req.session.user)) {
            return res.status(400).json({ error: 'Friend request already sent or received' });
        }

        friendData.friendRequests.push(req.session.user);
        await writeData(`${friendUsername}_data.json`, friendData);
        res.json({ message: 'Friend request sent successfully' });
    } catch (error) {
        console.error('Error adding friend:', error);
        res.status(500).json({ error: 'An error occurred while adding friend' });
    }
});

app.get('/api/friend-requests', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const userData = await readData(`${req.session.user}_data.json`);
        res.json(userData.friendRequests || []);
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ error: 'An error occurred while fetching friend requests' });
    }
});

app.post('/api/accept-friend', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const { friendUsername } = req.body;
        const userData = await readData(`${req.session.user}_data.json`);
        const friendData = await readData(`${friendUsername}_data.json`);

        if (!userData.friendRequests.includes(friendUsername)) {
            return res.status(400).json({ error: 'No friend request from this user' });
        }

        userData.friendRequests = userData.friendRequests.filter(u => u !== friendUsername);
        if (!userData.friends) userData.friends = [];
        userData.friends.push(friendUsername);

        if (!friendData.friends) friendData.friends = [];
        friendData.friends.push(req.session.user);

        await writeData(`${req.session.user}_data.json`, userData);
        await writeData(`${friendUsername}_data.json`, friendData);

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Error accepting friend request:', error);
        res.status(500).json({ error: 'An error occurred while accepting friend request' });
    }
});

app.get('/api/user-profile', async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    try {
        const userData = await readData(`${req.session.user}_data.json`);
        const pantryData = await readData(`${req.session.user}_pantry.json`);
        
        // Initialize default values
        userData.favoriteMeals = userData.favoriteMeals || [];
        pantryData.pantry = pantryData.pantry || [];

        // Calculate most used ingredient
        const ingredientCounts = pantryData.pantry.reduce((acc, item) => {
            acc[item.name] = (acc[item.name] || 0) + 1;
            return acc;
        }, {});
        const mostUsedIngredient = Object.entries(ingredientCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        // Calculate favorite meal category
        const categoryCount = userData.favoriteMeals.reduce((acc, meal) => {
            acc[meal.category] = (acc[meal.category] || 0) + 1;
            return acc;
        }, {});
        const favoriteMealCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

        res.json({
            username: req.session.user,
            favoriteMeals: userData.favoriteMeals,
            pantryItemCount: pantryData.pantry.length,
            mostUsedIngredient,
            favoriteMealCategory,
            totalMealsGenerated: userData.totalMealsGenerated || 0,
            createdAt: userData.createdAt || new Date().toISOString()
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'An error occurred while fetching user profile' });
    }
});

app.get('/api/user-profile/:username', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const { username } = req.params;
        const userData = await readData(`${username}_data.json`);
        const publicProfile = {
            username,
            favoriteMeals: userData.favoriteMeals || [],
            // Add any other public information you want to share
        };
        res.json(publicProfile);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'An error occurred while fetching user profile' });
    }
});

app.get('/api/notifications', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const userData = await readData(`${req.session.user}_data.json`);
        const friendRequests = userData.friendRequests ? userData.friendRequests.length : 0;
        const sharedMeals = userData.sharedMeals ? userData.sharedMeals.length : 0;
        const totalNotifications = friendRequests + sharedMeals;
        res.json({ friendRequests, sharedMeals, totalNotifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'An error occurred while fetching notifications' });
    }
});
// -------- END FRIEND MANAGEMENT --------

app.get('/api/friends', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const userData = await readData(`${req.session.user}_data.json`);
        res.json(userData.friends || []);
    } catch (error) {
        console.error('Error fetching friends:', error);
        res.status(500).json({ error: 'An error occurred while fetching friends' });
    }
});

// -------- MEAL SHARING --------
app.post('/api/share-meal', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const { mealId, friendUsername } = req.body;
        
        // Fetch the current user's data
        const userData = await readData(`${req.session.user}_data.json`);
        
        // Find the meal in the user's favorite meals
        const mealToShare = userData.favoriteMeals.find(meal => meal.id === mealId);
        
        if (!mealToShare) {
            return res.status(404).json({ error: 'Meal not found in your favorites' });
        }

        // Fetch the friend's data
        const friendData = await readData(`${friendUsername}_data.json`);
        
        if (!friendData) {
            return res.status(404).json({ error: 'Friend not found' });
        }

        // Add the shared meal to the friend's shared meals
        if (!friendData.sharedMeals) {
            friendData.sharedMeals = [];
        }
        
        friendData.sharedMeals.push({
            ...mealToShare,
            sharedBy: req.session.user,
            sharedAt: new Date().toISOString()
        });

        // Save the updated friend data
        await writeData(`${friendUsername}_data.json`, friendData);
        
        res.json({ message: 'Meal shared successfully' });
    } catch (error) {
        console.error('Error sharing meal:', error);
        res.status(500).json({ error: 'An error occurred while sharing meal' });
    }
});

app.get('/api/shared-meals', async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: 'Not authenticated' });
    try {
        const userData = await readData(`${req.session.user}_data.json`);
        res.json(userData.sharedMeals || []);
    } catch (error) {
        console.error('Error fetching shared meals:', error);
        res.status(500).json({ error: 'An error occurred while fetching shared meals' });
    }
});
// --------END MEAL SHARING--------


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});