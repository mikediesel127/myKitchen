let pantry = [];
let favoriteMeals = [];
let categories = ['Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Other'];
let currentMeals = [];
let isLoggedIn = false;

const commonIngredients = [
    'Salt', 'Pepper', 'Olive Oil', 'Garlic', 'Onion', 'Tomato', 'Chicken', 'Beef', 'Pasta', 'Rice',
    'Potato', 'Carrot', 'Broccoli', 'Cheese', 'Milk', 'Egg', 'Bread', 'Butter', 'Lemon', 'Flour'
];

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-lg mb-3 ${type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'} text-white fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function getCategoryIcon(category) {
    const icons = {
        'produce': 'fas fa-carrot',
        'dairy': 'fas fa-cheese',
        'meat': 'fas fa-drumstick-bite',
        'grains': 'fas fa-bread-slice',
        'spices': 'fas fa-mortar-pestle'
    };
    return icons[category.toLowerCase()] || 'fas fa-utensils';
}

function setupAutoSuggestions() {
    const datalist = document.createElement('datalist');
    datalist.id = 'ingredient-suggestions';
    commonIngredients.forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient;
        datalist.appendChild(option);
    });
    document.body.appendChild(datalist);
    document.getElementById('ingredientInput').setAttribute('list', 'ingredient-suggestions');
}

// Add these functions to improve mobile UX
function setupMobileOptimizations() {
    const addIngredientBtn = document.getElementById('addIngredient');
    const ingredientInput = document.getElementById('ingredientInput');

    addIngredientBtn.addEventListener('touchstart', function(e) {
        e.preventDefault();
        this.classList.add('active');
    });

    addIngredientBtn.addEventListener('touchend', function(e) {
        e.preventDefault();
        this.classList.remove('active');
        addIngredient();
    });

    ingredientInput.addEventListener('focus', function() {
        setTimeout(() => {
            this.scrollIntoView({behavior: 'smooth', block: 'center'});
        }, 300);
    });
}

function addIngredient() {
    const ingredientInput = document.getElementById('ingredientInput');
    const ingredient = ingredientInput.value.trim();
    if (ingredient) {
        const formattedIngredient = ingredient.charAt(0).toUpperCase() + ingredient.slice(1).toLowerCase();
        if (pantry.some(item => item.name.toLowerCase() === formattedIngredient.toLowerCase())) {
            showNotification(`${formattedIngredient} is already in your pantry`, 'warning');
            return;
        }
        const category = categorizeIngredient(formattedIngredient);
        const newItem = { 
            name: formattedIngredient, 
            quantity: '1', 
            category: category
        };
        pantry.push(newItem);
        renderPantryItem(newItem);
        ingredientInput.value = '';
        savePantry();
        showNotification(`${formattedIngredient} added to pantry`, 'success');
    }
}

// In script.js, replace the renderPantryItem function with:

function renderPantryItem(item) {
    if (!item || !item.name || !item.category) {
        console.error('Invalid item:', item);
        return;
    }
    const pantryList = document.getElementById('pantryList');
    let categorySection = document.querySelector(`#pantryList .category-${item.category}`);
    if (!categorySection) {
        categorySection = document.createElement('div');
        categorySection.className = `category-${item.category} category-section mb-4`;
        const icon = getCategoryIcon(item.category);
        categorySection.innerHTML = `
            <h3 class="category-header font-semibold text-lg mb-2 text-indigo-700 cursor-move">
                <i class="${icon} mr-2"></i>${item.category}
            </h3>
        `;
        pantryList.appendChild(categorySection);
    }
    const li = document.createElement('div');
    li.className = 'flex justify-between items-center bg-white p-3 rounded-lg shadow-sm mb-2 transition-all hover:bg-indigo-50 ingredient-card fade-in';
    li.dataset.name = item.name;
    li.innerHTML = `
        <div class="flex items-center">
            <input type="checkbox" id="ingredient-${item.name}" class="ingredient-checkbox mr-3" checked>
            <label for="ingredient-${item.name}" class="text-gray-800 font-medium">${item.name}</label>
            <span class="ml-2 text-sm text-gray-500">(${item.quantity || '1'})</span>
        </div>
        <div class="flex items-center">
            <button class="text-indigo-500 hover:text-indigo-700 transition-colors mr-2" onclick="editIngredient('${item.name}')">
                <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-500 hover:text-red-700 transition-colors" onclick="removeIngredient('${item.name}')">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    categorySection.appendChild(li);
}

function editIngredient(ingredientName) {
    const item = pantry.find(i => i.name === ingredientName);
    if (item) {
        const newQuantity = prompt(`Enter new quantity for ${item.name}:`, item.quantity);
        if (newQuantity !== null) {
            item.quantity = newQuantity;
            updatePantryList();
            savePantry();
        }
    }
}

// Add this function to get category icons
function getCategoryIcon(category) {
    const icons = {
        'Produce': 'fas fa-carrot',
        'Dairy': 'fas fa-cheese',
        'Meat': 'fas fa-drumstick-bite',
        'Grains': 'fas fa-bread-slice',
        'Spices': 'fas fa-mortar-pestle',
        'Other': 'fas fa-utensils'
    };
    return icons[category] || 'fas fa-utensils';
}

function categorizeIngredient(ingredient) {
    const lowerIngredient = ingredient.toLowerCase();
    const categories = {
        'Produce': [
            'apple', 'banana', 'orange', 'lemon', 'lime', 'strawberry', 'blueberry', 'raspberry',
            'blackberry', 'grape', 'melon', 'watermelon', 'pineapple', 'mango', 'peach', 'pear',
            'plum', 'cherry', 'kiwi', 'avocado', 'tomato', 'potato', 'carrot', 'onion', 'garlic',
            'ginger', 'lettuce', 'spinach', 'kale', 'cabbage', 'broccoli', 'cauliflower', 'pepper',
            'cucumber', 'zucchini', 'eggplant', 'squash', 'pumpkin', 'mushroom', 'corn', 'pea',
            'green bean', 'asparagus', 'celery', 'radish', 'beet', 'turnip', 'sweet potato', 'yam',
            'okra', 'leek', 'shallot', 'scallion', 'cilantro', 'parsley', 'basil', 'mint', 'thyme',
            'rosemary', 'sage', 'oregano', 'chive'
        ],
        'Dairy': [
            'milk', 'cream', 'yogurt', 'cheese', 'butter', 'margarine', 'sour cream', 'cream cheese',
            'cottage cheese', 'ricotta', 'mozzarella', 'parmesan', 'cheddar', 'gouda', 'feta', 'brie',
            'goat cheese', 'whipped cream', 'condensed milk', 'evaporated milk', 'buttermilk', 'kefir',
            'ghee', 'ice cream', 'gelato', 'custard'
        ],
        'Meat': [
            'chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'goose', 'veal', 'ham', 'bacon',
            'sausage', 'salami', 'pepperoni', 'prosciutto', 'ground beef', 'ground turkey',
            'ground pork', 'steak', 'roast', 'chop', 'rib', 'liver', 'heart', 'kidney', 'tripe'
        ],
        'Grains': [
            'rice', 'pasta', 'noodle', 'bread', 'flour', 'oat', 'barley', 'quinoa', 'couscous',
            'cornmeal', 'cereal', 'wheat', 'rye', 'millet', 'buckwheat', 'semolina', 'bulgur',
            'farro', 'amaranth', 'sorghum', 'spelt', 'teff'
        ],
        'Spices': [
            'salt', 'pepper', 'cinnamon', 'cumin', 'paprika', 'turmeric', 'ginger', 'garlic powder',
            'onion powder', 'chili powder', 'cayenne', 'nutmeg', 'allspice', 'cardamom', 'clove',
            'coriander', 'fennel', 'mustard seed', 'saffron', 'vanilla', 'bay leaf'
        ]
    };
    
    for (const [category, items] of Object.entries(categories)) {
        if (items.some(item => lowerIngredient.includes(item))) {
            return category;
        }
    }
    return 'Other';
}

function updatePantryList() {
    const pantryList = document.getElementById('pantryList');
    pantryList.innerHTML = '';
    pantry.forEach(item => renderPantryItem(item));
}

async function savePantry() {
    try {
        await fetch('/api/pantry', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(pantry)
        });
    } catch (error) {
        console.error('Error saving pantry:', error);
        showNotification('Failed to save pantry changes', 'error');
    }
}

function removeIngredient(ingredientName) {
    // Remove the ingredient from the pantry array
    pantry = pantry.filter(item => item.name !== ingredientName);

    // Remove the ingredient from the DOM
    const itemElement = document.querySelector(`#pantryList [data-name="${ingredientName}"]`);
    if (itemElement) {
        itemElement.classList.add('fade-out');
        setTimeout(() => {
            itemElement.remove();
            // Check if the category is now empty
            const categorySection = itemElement.closest('.category-section');
            if (categorySection && categorySection.querySelectorAll('.ingredient-card').length === 0) {
                categorySection.remove();
            }
        }, 300); // Match this with your CSS transition time
    }

    // Save the updated pantry
    savePantry();

    // Show a notification
    showNotification(`${ingredientName} removed from pantry`, 'info');
}
function toggleCategory(event) {
    const button = event.target;
    const category = button.dataset.category;
    const allButtons = document.querySelectorAll('.category-toggle');
    const allButton = document.querySelector('.category-toggle[data-category="All"]');

    const toggleClasses = (btn, active) => {
        btn.classList.toggle('active', active);
        btn.classList.toggle('bg-blue-500', active);
        btn.classList.toggle('text-white', active);
        btn.classList.toggle('bg-gray-200', !active);
        btn.classList.toggle('text-gray-700', !active);
    };

    if (category === 'All') {
        const shouldActivateAll = !button.classList.contains('active');
        allButtons.forEach(btn => toggleClasses(btn, shouldActivateAll));
    } else {
        toggleClasses(button, !button.classList.contains('active'));
        
        const activeCategories = document.querySelectorAll('.category-toggle.active:not([data-category="All"])');
        toggleClasses(allButton, activeCategories.length === allButtons.length - 1);
    }
}

function showLoading() {
    document.getElementById('loadingIndicator').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingIndicator').classList.add('hidden');
}

async function loadPantry() {
    try {
        const response = await fetch('/api/pantry');
        if (response.ok) {
            let loadedPantry = await response.json();
            pantry = loadedPantry.filter(item => item && item.name && item.category);
            updatePantryList();
        } else if (response.status === 401) {
            showLoginForm();
        } else {
            throw new Error('Failed to load pantry');
        }
    } catch (error) {
        console.error('Error loading pantry:', error);
        pantry = [];
    }
}

async function loadFavoriteMeals() {
    try {
        const response = await fetch('/api/favorite-meals');
        if (response.ok) {
            favoriteMeals = await response.json();
            displayFavoriteMeals();
        } else if (response.status === 401) {
            showLoginForm();
        } else {
            throw new Error('Failed to load favorite meals');
        }
    } catch (error) {
        console.error('Error loading favorite meals:', error);
        favoriteMeals = [];
    }
}

async function loadCategories() {
    try {
        const response = await fetch('/api/categories');
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
                categories = data;
                createCategoryFilters();
            } else {
                console.error('Invalid categories data:', data);
            }
        } else if (response.status === 401) {
            showLoginForm();
        } else {
            throw new Error('Failed to load categories');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function displayFavoriteMeals() {
    const favoriteMealsList = document.getElementById('favoriteMealsList');
    if (!favoriteMealsList) return;

    if (favoriteMeals.length === 0) {
        favoriteMealsList.innerHTML = '<p class="text-gray-500">No favorite meals yet.</p>';
        return;
    }

    const mealsByCategory = favoriteMeals.reduce((acc, meal) => {
        if (!acc[meal.category]) {
            acc[meal.category] = [];
        }
        acc[meal.category].push(meal);
        return acc;
    }, {});

    const categoryOrder = ['Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
    const sortedCategories = Object.keys(mealsByCategory).sort((a, b) => 
        categoryOrder.indexOf(a) - categoryOrder.indexOf(b)
    );

    const categoryIcons = {
        'Breakfast': '🍳',
        'Lunch': '🥪',
        'Dinner': '🍽️',
        'Dessert': '🍰',
        'Snack': '🥨'
    };

    let html = '';
    sortedCategories.forEach(category => {
        const meals = mealsByCategory[category];
        html += `
            <div class="mb-6">
                <h3 class="text-xl font-semibold mb-3 text-gray-700">
                    ${categoryIcons[category] || '🍴'} ${category}
                </h3>
                <ul class="space-y-2">
        `;

        meals.forEach(meal => {
            const mealId = `favorite-meal-${meal.name.replace(/\s+/g, '-').toLowerCase()}`;
            html += `
                <li id="${mealId}" class="flex justify-between items-center bg-gray-100 p-3 rounded-lg transition-all hover:bg-gray-200">
                    <span class="font-medium">${meal.name}</span>
                    <div>
                        <button class="text-blue-500 hover:text-blue-700 transition-colors mr-2" onclick="viewMeal('${meal.name}')">View</button>
                        <button class="text-red-500 hover:text-red-700 transition-colors" onclick="removeFavoriteMeal('${meal.name}')">Remove</button>
                    </div>
                </li>
            `;
        });

        html += `
                </ul>
            </div>
        `;
    });

    favoriteMealsList.innerHTML = html;
}

function viewMeal(mealName) {
    const meal = favoriteMeals.find(m => m.name === mealName);
    if (meal) {
        const modalContent = document.getElementById('mealModalContent');
        const ingredientsHtml = meal.ingredients.map(ing => {
            if (typeof ing === 'string') {
                const parts = ing.split(' ');
                if (parts.length > 1 && !isNaN(parts[0])) {
                    const [amount, ...ingName] = parts;
                    return `<li><span class="font-semibold">${amount}</span> ${ingName.join(' ')}</li>`;
                }
                return `<li>${ing}</li>`;
            } else if (typeof ing === 'object' && ing.name && ing.amount) {
                return `<li><span class="font-semibold">${ing.amount}</span> ${ing.name}</li>`;
            }
            return `<li>${JSON.stringify(ing)}</li>`;
        }).join('');

        modalContent.innerHTML = `
            <h2 class="text-2xl font-bold mb-4">${meal.name}</h2>
            <p class="mb-2"><strong>Category:</strong> ${meal.category}</p>
            <p class="mb-4">${meal.description}</p>
            <h3 class="text-xl font-semibold mb-2">Ingredients:</h3>
            <ul class="list-disc pl-5 mb-4">
                ${ingredientsHtml}
            </ul>
            <h3 class="text-xl font-semibold mb-2">Instructions:</h3>
            <p>${meal.instructions}</p>
        `;
        
        const mealModal = document.getElementById('mealModal');
        mealModal.classList.remove('hidden');

        // Add event listener for the close button
        const closeButton = document.getElementById('closeMealModal');
        closeButton.onclick = () => {
            mealModal.classList.add('hidden');
        };

        // Add event listener to close the modal when clicking outside
        mealModal.onclick = (event) => {
            if (event.target === mealModal) {
                mealModal.classList.add('hidden');
            }
        };
    }
}

function toggleIngredientAmounts(button) {
    const mealDiv = button.closest('.bg-white');
    const withAmounts = mealDiv.querySelector('.ingredients-with-amounts');
    const withoutAmounts = mealDiv.querySelector('.ingredients-without-amounts');
    
    withAmounts.classList.toggle('hidden');
    withoutAmounts.classList.toggle('hidden');
    
    button.classList.toggle('text-blue-500');
}

function removeFavoriteMeal(mealName) {
    const confirmDelete = confirm(`Are you sure you want to remove "${mealName}" from your favorites?`);
    if (confirmDelete) {
        favoriteMeals = favoriteMeals.filter(meal => meal.name !== mealName);
        saveFavoriteMeals();
        displayFavoriteMeals();
        showNotification(`"${mealName}" has been removed from your favorites.`, 'info');
    }
}

// In script.js, update the displayMealSuggestions function:

function displayMealSuggestions(meals) {
    const mealSuggestions = document.getElementById('mealSuggestions');
    mealSuggestions.innerHTML = '';

    if (!Array.isArray(meals) || meals.length === 0) {
        mealSuggestions.innerHTML = '<p class="text-gray-500 text-center py-4">No meal suggestions available with current ingredients and selected categories.</p>';
        return;
    }

    meals.forEach(meal => {
        const div = document.createElement('div');
        div.className = 'bg-white p-6 rounded-lg shadow-md mb-6 transition-all hover:shadow-lg';
        const isFavorite = favoriteMeals.some(favMeal => favMeal.name === meal.name);
        
        const ingredientsHtml = meal.ingredients.map(ing => 
            `<li class="mb-1"><span class="font-semibold">${ing.name}</span> <span class="text-gray-500">(${ing.amount})</span></li>`
        ).join('');

        div.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-2xl font-semibold text-indigo-600">${meal.name || 'Unnamed Meal'}</h3>
                <button class="favorite-btn ${isFavorite ? 'text-yellow-500' : 'text-gray-400'} text-xl" onclick="toggleFavorite(${JSON.stringify(meal).replace(/"/g, '&quot;')})">
                    <i class="fas fa-star"></i>
                </button>
            </div>
            <p class="text-sm text-gray-500 mb-2">${meal.category}</p>
            <p class="mb-3 text-gray-700">${meal.description || 'No description provided'}</p>
            <div class="mb-4">
                <h4 class="font-semibold mb-2 text-gray-700">Ingredients:</h4>
                <ul class="list-disc pl-5">
                    ${ingredientsHtml}
                </ul>
            </div>
            <button class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors" onclick="toggleInstructions(this)">Show Instructions</button>
            <div class="instructions hidden mt-4 p-4 bg-gray-50 rounded">
                <h4 class="font-semibold mb-2 text-gray-700">Instructions:</h4>
                <p class="text-gray-600">${meal.instructions || 'No instructions provided'}</p>
            </div>
        `;
        mealSuggestions.appendChild(div);
    });
}

function toggleFavorite(meal) {
    const index = favoriteMeals.findIndex(m => m.name === meal.name);
    if (index === -1) {
        favoriteMeals.push(meal);
        showNotification(`${meal.name} added to favorites`);
    } else {
        favoriteMeals.splice(index, 1);
        showNotification(`${meal.name} removed from favorites`);
    }
    saveFavoriteMeals();
    displayMealSuggestions(currentMeals);
    displayFavoriteMeals();
}

async function saveFavoriteMeals() {
    try {
        const response = await fetch('/api/favorite-meals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(favoriteMeals)
        });
        if (!response.ok) {
            throw new Error('Failed to save favorite meals');
        }
    } catch (error) {
        console.error('Error saving favorite meals:', error);
    }
}

function setupSearch() {
    const searchContainer = document.createElement('div');
    searchContainer.className = 'mb-4';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'searchInput';
    searchInput.placeholder = 'Search ingredients or meals...';
    searchInput.className = 'w-full p-2 border rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-300';
    
    const searchResults = document.createElement('div');
    searchResults.id = 'searchResults';
    searchResults.className = 'mb-4';

    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchResults);

    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.insertBefore(searchContainer, mainContent.firstChild);
    } else {
        console.error('Main content container not found');
    }

    searchInput.addEventListener('input', performSearch);
}

function performSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '';

    if (searchTerm.length < 2) return;

    const ingredientResults = pantry.filter(item => item.name.toLowerCase().includes(searchTerm));
    const mealResults = favoriteMeals.filter(meal => meal.name.toLowerCase().includes(searchTerm));

    if (ingredientResults.length === 0 && mealResults.length === 0) {
        searchResults.innerHTML = '<p class="text-gray-500">No results found.</p>';
        return;
    }

    if (ingredientResults.length > 0) {
        const ingredientList = document.createElement('ul');
        ingredientList.innerHTML = '<h3 class="font-semibold mb-2">Ingredients:</h3>';
        ingredientResults.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" class="text-indigo-600 hover:text-indigo-800" onclick="scrollToPantryItem('${item.name}')">${item.name} (${item.quantity})</a>`;
            ingredientList.appendChild(li);
        });
        searchResults.appendChild(ingredientList);
    }

    if (mealResults.length > 0) {
        const mealList = document.createElement('ul');
        mealList.innerHTML = '<h3 class="font-semibold mb-2 mt-4">Favorite Meals:</h3>';
        mealResults.forEach(meal => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="#" class="text-indigo-600 hover:text-indigo-800" onclick="scrollToFavoriteMeal('${meal.name}')">${meal.name}</a>`;
            mealList.appendChild(li);
        });
        searchResults.appendChild(mealList);
    }
}

function scrollToPantryItem(itemName) {
    const pantryItem = document.querySelector(`#pantryList [data-name="${itemName}"]`);
    if (pantryItem) {
        pantryItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        pantryItem.classList.add('highlight');
        setTimeout(() => pantryItem.classList.remove('highlight'), 2000);
    }
}

function scrollToFavoriteMeal(mealName) {
    const mealId = `favorite-meal-${mealName.replace(/\s+/g, '-').toLowerCase()}`;
    const favoriteMeal = document.getElementById(mealId);
    if (favoriteMeal) {
        favoriteMeal.scrollIntoView({ behavior: 'smooth', block: 'center' });
        favoriteMeal.classList.add('highlight');
        setTimeout(() => favoriteMeal.classList.remove('highlight'), 2000);
    }
}

function toggleInstructions(button) {
    const instructionsDiv = button.nextElementSibling;
    instructionsDiv.classList.toggle('hidden');
    button.textContent = instructionsDiv.classList.contains('hidden') ? 'Show Instructions' : 'Hide Instructions';
}

async function generateMealsWithOpenAI() {
    console.log('generateMealsWithOpenAI function called');

    const activeButtons = document.querySelectorAll('.category-toggle.active:not([data-category="All"])');
    const selectedCategories = Array.from(activeButtons).map(btn => btn.dataset.category);

    console.log('Selected categories:', selectedCategories);

    if (selectedCategories.length === 0) {
        showNotification('Please select at least one meal type', 'error');
        return;
    }

    const selectedIngredients = pantry.filter(item => {
        const checkbox = document.querySelector(`#ingredient-${item.name}`);
        return checkbox && checkbox.checked;
    }).map(item => item.name);

    console.log('Selected ingredients:', selectedIngredients);

    if (selectedIngredients.length === 0) {
        showNotification('Please select at least one ingredient', 'error');
        return;
    }

    showLoading();
    const mealSuggestions = document.getElementById('mealSuggestions');
    if (mealSuggestions) {
        mealSuggestions.innerHTML = `
            <div class="skeleton h-20 mb-4 rounded"></div>
            <div class="skeleton h-20 mb-4 rounded"></div>
            <div class="skeleton h-20 mb-4 rounded"></div>
        `;
    }

    try {
        console.log('Sending request to generate meals');
        const response = await fetch('/api/generate-meals', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                ingredients: selectedIngredients,
                categories: selectedCategories
            })
        });

        console.log('Response received:', response);

        if (response.ok) {
            currentMeals = await response.json();
            console.log('Meals generated:', currentMeals);
            displayMealSuggestions(currentMeals);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate meals');
        }
    } catch (error) {
        console.error('Error generating meals:', error);
        if (mealSuggestions) {
            mealSuggestions.innerHTML = `
                <p class="text-red-500 mb-4">${error.message}</p>
                <button onclick="generateMealsWithOpenAI()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                    Try Again
                </button>
            `;
        }
    } finally {
        hideLoading();
    }
}

function setupAutocomplete() {
    const datalist = document.createElement('datalist');
    datalist.id = 'ingredientSuggestions';
    commonIngredients.forEach(ingredient => {
        const option = document.createElement('option');
        option.value = ingredient;
        datalist.appendChild(option);
    });
    document.body.appendChild(datalist);
    document.getElementById('ingredientInput').setAttribute('list', 'ingredientSuggestions');
}

function updateCategoryOrder(categoryName, newIndex) {
    // Implement the logic to update the order of categories in your data structure
    // This might involve updating an array of category names or a similar data structure
    // After updating, you may need to re-render the pantry list
    console.log(`Category ${categoryName} moved to index ${newIndex}`);
    // Implement the actual reordering logic here
    // Then call updatePantryList() or a similar function to re-render the pantry
}

function setupDragAndDrop() {
    const pantryList = document.getElementById('pantryList');
    const sortables = pantryList.querySelectorAll('.category-section');
    
    sortables.forEach(sortable => {
        new Sortable(sortable, {
            group: 'category',
            animation: 150,
            handle: '.category-header', // This ensures only the header is draggable
            ghostClass: 'bg-blue-100',
            onEnd: function (evt) {
                const categoryName = evt.item.querySelector('.category-header').textContent;
                const newIndex = Array.from(pantryList.children).indexOf(evt.item);
                updateCategoryOrder(categoryName, newIndex);
            },
        });
    });
}

function createCategoryFilters() {
    const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
    const container = document.getElementById('categoryToggleButtons');
    container.innerHTML = '';

    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-toggle px-4 py-2 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-300';
        button.textContent = category;
        button.dataset.category = category;
        button.onclick = toggleCategory;
        
        if (category === 'All') {
            button.classList.add('active');
        }
        
        container.appendChild(button);
    });
}

function setupAuthForms() {
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    function showLoginForm() {
    document.getElementById('authForms').classList.remove('hidden');
    document.getElementById('mainContent').classList.add('hidden');
    document.getElementById('userActions').classList.add('hidden');
    
    const loginTab = document.getElementById('loginTab');
    const registerTab = document.getElementById('registerTab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    loginTab.classList.add('text-blue-500', 'border-b-2', 'border-blue-500');
    loginTab.classList.remove('text-gray-500');
    registerTab.classList.add('text-gray-500');
    registerTab.classList.remove('text-blue-500', 'border-b-2', 'border-blue-500');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');

    // Clear input fields
    document.getElementById('loginUsername').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('registerUsername').value = '';
    document.getElementById('registerPassword').value = '';
}

    function showRegisterForm() {
        registerTab.classList.add('text-blue-500', 'border-b-2', 'border-blue-500');
        registerTab.classList.remove('text-gray-500');
        loginTab.classList.add('text-gray-500');
        loginTab.classList.remove('text-blue-500', 'border-b-2', 'border-blue-500');
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }

    loginTab.addEventListener('click', showLoginForm);
    registerTab.addEventListener('click', showRegisterForm);

    // Set up event listeners for login and register buttons
    document.getElementById('loginButton').addEventListener('click', login);
    document.getElementById('registerButton').addEventListener('click', register);
}

function hideLoginForm() {
    document.getElementById('authForms').classList.add('hidden');
    document.getElementById('mainContent').classList.remove('hidden');
    document.getElementById('userActions').classList.remove('hidden');
}

async function login(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    if (!username || !password) {
        showNotification('Username and password are required', 'error');
        return;
    }
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            showNotification('Logged in successfully');
            isLoggedIn = true;
            hideLoginForm();
            loadUserData();
            document.getElementById('welcomeMessage').textContent = `Welcome, ${username}!`;
        } else {
            showNotification(data.error || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login', 'error');
    }
}

async function register(event) {
    event.preventDefault();
    const username = document.getElementById('registerUsername').value;
    const password = document.getElementById('registerPassword').value;
    if (!username || !password) {
        showNotification('Username and password are required', 'error');
        return;
    }
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            showNotification('Registered successfully. Please log in.');
            document.getElementById('loginUsername').value = username;
            document.getElementById('loginPassword').value = '';
        } else {
            showNotification(data.error || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration', 'error');
    }
}

function logout() {
    fetch('/api/logout')
        .then(() => {
            showNotification('Logged out successfully');
            isLoggedIn = false;
            clearUserData();
            showLoginForm();
        })
        .catch(error => {
            console.error('Logout error:', error);
            showNotification('An error occurred during logout', 'error');
        });
}

function clearUserData() {
    pantry = [];
    favoriteMeals = [];
    updatePantryList();
    displayFavoriteMeals();
}

function setupLogoutButton() {
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
}

function bindLoggedInEvents() {
    const generateMealsButton = document.getElementById('generateMeals');
    if (generateMealsButton) {
        generateMealsButton.addEventListener('click', generateMealsWithOpenAI);
    } else {
        console.error('Generate Meals button not found');
    }

    document.getElementById('addIngredient').addEventListener('click', addIngredient);
    document.getElementById('ingredientInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addIngredient();
    });
    document.getElementById('selectAllIngredients').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.ingredient-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
        });
    });
}

function loadUserData() {
    loadPantry();
    loadFavoriteMeals();
    loadCategories();
    setupAutoSuggestions();
    createCategoryFilters(); // Add this line
    bindLoggedInEvents();
    setupMobileOptimizations(); // Add this line
}

document.addEventListener('DOMContentLoaded', () => {
    setupAuthForms();
    document.getElementById('logoutButton').addEventListener('click', logout);

    const currentPage = window.location.pathname.split('/').pop();
    const dashboardLink = document.getElementById('dashboardLink');
    const myKitchenLink = document.getElementById('myKitchenLink');
    const kitchenNav = document.getElementById('kitchenNav');

    // Set active state for main navigation
    if (currentPage === 'dashboard.html') {
        dashboardLink.classList.add('active');
        if (kitchenNav) kitchenNav.style.display = 'none';
    } else {
        myKitchenLink.classList.add('active');
    }

    fetch('/api/check-auth')
        .then(response => response.ok ? response.json() : Promise.reject('Not authenticated'))
        .then(data => {
            if (data.authenticated) {
                isLoggedIn = true;
                hideLoginForm();
                setupSearch();
                setupAutoSuggestions();
                setupDragAndDrop();
                createCategoryFilters();
                loadUserData();
                document.getElementById('welcomeMessage').textContent = `Welcome, ${data.username}!`;

                // Setup section navigation active states
                if (kitchenNav) {
                    const sectionLinks = document.querySelectorAll('.section-nav-link');
                    const sections = document.querySelectorAll('main > div[id]');

                    function setActiveSection() {
                        let currentSection = '';
                        sections.forEach(section => {
                            const sectionTop = section.offsetTop - 100;
                            const sectionHeight = section.clientHeight;
                            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                                currentSection = section.id;
                            }
                        });

                        sectionLinks.forEach(link => {
                            link.classList.toggle('active', link.getAttribute('href') === `#${currentSection}`);
                        });
                    }

                    window.addEventListener('scroll', setActiveSection);
                    setActiveSection();
                }
            } else {
                showLoginForm();
            }
        })
        .catch(error => {
            console.error('Error checking authentication:', error);
            showLoginForm();
        });

    // Setup mobile menu toggle if it exists
    const mobileMenuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
});