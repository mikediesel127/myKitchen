const ingredientInput = document.getElementById('ingredientInput');
const addIngredientBtn = document.getElementById('addIngredient');
const pantryList = document.getElementById('pantryList');
const generateMealsBtn = document.getElementById('generateMeals');
const mealSuggestions = document.getElementById('mealSuggestions');

let pantry = [];
let favoriteMeals = [];
let categories = ['Produce', 'Dairy', 'Meat', 'Grains', 'Spices', 'Other'];
let currentMeals = [];

const commonIngredients = [
    'Salt', 'Pepper', 'Olive Oil', 'Garlic', 'Onion', 'Tomato', 'Chicken', 'Beef', 'Pasta', 'Rice',
    'Potato', 'Carrot', 'Broccoli', 'Cheese', 'Milk', 'Egg', 'Bread', 'Butter', 'Lemon', 'Flour'
];

function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-lg shadow-lg mb-3 ${type === 'error' ? 'bg-red-500' : 'bg-green-500'} text-white`;
    toast.textContent = message;
    
    const toastContainer = document.getElementById('toastContainer');
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

function getCategoryIcon(category) {
    switch (category.toLowerCase()) {
        case 'produce': return 'fas fa-carrot';
        case 'dairy': return 'fas fa-cheese';
        case 'meat': return 'fas fa-drumstick-bite';
        case 'grains': return 'fas fa-bread-slice';
        case 'spices': return 'fas fa-mortar-pestle';
        default: return 'fas fa-utensils';
    }
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
    ingredientInput.setAttribute('list', 'ingredient-suggestions');
}

addIngredientBtn.addEventListener('click', addIngredient);
generateMealsBtn.addEventListener('click', generateMealsWithOpenAI);
ingredientInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addIngredient();
});

function addIngredient() {
    const ingredient = ingredientInput.value.trim();
    if (ingredient) {
        if (pantry.some(item => item.name.toLowerCase() === ingredient.toLowerCase())) {
            showNotification(`${ingredient} is already added`);
            return;
        }
        const category = categorizeIngredient(ingredient);
        const newItem = { 
            name: ingredient, 
            quantity: '1', 
            category: category || 'Other'
        };
        pantry.push(newItem);
        renderPantryItem(newItem);
        ingredientInput.value = '';
        savePantry();
        showNotification(`${ingredient} added to pantry`);
    }
}

function renderPantryItem(item) {
    if (!item || !item.name || !item.category) {
        console.error('Invalid item:', item);
        return;
    }
    let categorySection = document.querySelector(`#pantryList .category-${item.category}`);
    if (!categorySection) {
        categorySection = document.createElement('div');
        categorySection.className = `category-${item.category}`;
        const icon = getCategoryIcon(item.category);
        categorySection.innerHTML = `<h3 class="font-semibold mt-4 mb-2"><i class="${icon} mr-2"></i>${item.category}</h3>`;
        pantryList.appendChild(categorySection);
    }
    const li = document.createElement('li');
    li.className = 'flex justify-between items-center bg-gray-100 p-2 rounded mb-2 transition-all hover:bg-gray-200 fade-in ingredient-card';
    li.dataset.name = item.name;
    li.innerHTML = `
        <div class="flex items-center">
            <input type="checkbox" id="ingredient-${item.name}" class="ingredient-checkbox mr-2" checked>
            <label for="ingredient-${item.name}">${item.name} (${item.quantity || '1'})</label>
        </div>
        <div>
            <button class="text-red-500 hover:text-red-700 transition-colors" onclick="removeIngredient('${item.name}')">Remove</button>
        </div>
    `;
    li.classList.add('fade-in');
    categorySection.appendChild(li);
}

function categorizeIngredient(ingredient) {
    const lowerIngredient = ingredient.toLowerCase();
    if (['apple', 'banana', 'carrot', 'lettuce', 'tomato'].some(item => lowerIngredient.includes(item))) {
        return 'Produce';
    } else if (['milk', 'cheese', 'yogurt', 'butter'].some(item => lowerIngredient.includes(item))) {
        return 'Dairy';
    } else if (['chicken', 'beef', 'pork', 'fish'].some(item => lowerIngredient.includes(item))) {
        return 'Meat';
    } else if (['rice', 'pasta', 'bread', 'oats'].some(item => lowerIngredient.includes(item))) {
        return 'Grains';
    } else if (['salt', 'pepper', 'cumin', 'cinnamon'].some(item => lowerIngredient.includes(item))) {
        return 'Spices';
    } else {
        return 'Other';
    }
}

function updatePantryList() {
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
    }
}

function removeIngredient(ingredientName) {
    const itemElement = document.querySelector(`#pantryList li[data-name="${ingredientName}"]`);
    if (itemElement) {
        itemElement.classList.add('fade-out');
        setTimeout(() => {
            itemElement.remove();
            const categorySection = itemElement.closest(`[class^="category-"]`);
            if (categorySection && categorySection.querySelectorAll('li').length === 0) {
                categorySection.remove();
            }
        }, 300);
    }
    pantry = pantry.filter(item => item.name !== ingredientName);
    savePantry();
    showNotification(`${ingredientName} removed from pantry`);
}

function toggleCategory(event) {
    const button = event.target;
    const category = button.dataset.category;
    const allButtons = document.querySelectorAll('.category-toggle');
    const allButton = document.querySelector('.category-toggle[data-category="All"]');

    if (category === 'All') {
        const shouldActivateAll = !button.classList.contains('active');
        allButtons.forEach(btn => {
            if (shouldActivateAll) {
                btn.classList.add('active', 'bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            } else {
                btn.classList.remove('active', 'bg-blue-500', 'text-white');
                btn.classList.add('bg-gray-200', 'text-gray-700');
            }
        });
    } else {
        button.classList.toggle('active');
        button.classList.toggle('bg-blue-500');
        button.classList.toggle('text-white');
        button.classList.toggle('bg-gray-200');
        button.classList.toggle('text-gray-700');

        const activeCategories = document.querySelectorAll('.category-toggle.active:not([data-category="All"])');
        if (activeCategories.length === allButtons.length - 1) {
            allButton.classList.add('active', 'bg-blue-500', 'text-white');
            allButton.classList.remove('bg-gray-200', 'text-gray-700');
        } else {
            allButton.classList.remove('active', 'bg-blue-500', 'text-white');
            allButton.classList.add('bg-gray-200', 'text-gray-700');
        }
    }
}

function quickAddOne(ingredientName) {
    const item = pantry.find(i => i.name === ingredientName);
    if (item) {
        item.quantity = (parseInt(item.quantity) || 1) + 1;
        updatePantryList();
        savePantry();
        showNotification(`Added one ${ingredientName}`);
    }
}

function quickRemoveOne(ingredientName) {
    const item = pantry.find(i => i.name === ingredientName);
    if (item) {
        const newQuantity = Math.max((parseInt(item.quantity) || 1) - 1, 0);
        if (newQuantity === 0) {
            removeIngredient(ingredientName);
        } else {
            item.quantity = newQuantity;
            updatePantryList();
            savePantry();
        }
        showNotification(`Removed one ${ingredientName}`);
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
            } else {
                console.error('Invalid categories data:', data);
            }
        } else {
            throw new Error('Failed to load categories');
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

function displayFavoriteMeals() {
    let favoriteMealsContainer = document.getElementById('favoriteMealsContainer');
    if (!favoriteMealsContainer) {
        favoriteMealsContainer = document.createElement('div');
        favoriteMealsContainer.id = 'favoriteMealsContainer';
        favoriteMealsContainer.className = 'bg-white rounded-lg shadow-md p-6 mt-8';
        document.querySelector('.container').appendChild(favoriteMealsContainer);
    }

    favoriteMealsContainer.innerHTML = '<h2 class="text-2xl font-semibold mb-4 text-purple-500">Favorite Meals</h2>';

    if (favoriteMeals.length === 0) {
        favoriteMealsContainer.innerHTML += '<p class="text-gray-500">No favorite meals yet.</p>';
    } else {
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

        sortedCategories.forEach(category => {
            const meals = mealsByCategory[category];
            const categorySection = document.createElement('div');
            categorySection.className = 'mb-6';
            categorySection.innerHTML = `
                <h3 class="text-xl font-semibold mb-3 text-gray-700">
                    ${categoryIcons[category] || '🍴'} ${category}
                </h3>
            `;

            const mealList = document.createElement('ul');
            mealList.className = 'space-y-2';

            meals.forEach(meal => {
                const li = document.createElement('li');
                li.className = 'flex justify-between items-center bg-gray-100 p-3 rounded-lg transition-all hover:bg-gray-200';
                li.innerHTML = `
                    <span class="font-medium">${meal.name}</span>
                    <div>
                        <button class="text-blue-500 hover:text-blue-700 transition-colors mr-2" onclick="viewMeal('${meal.name}')">View</button>
                        <button class="text-red-500 hover:text-red-700 transition-colors" onclick="removeFavoriteMeal('${meal.name}')">Remove</button>
                    </div>
                `;
                mealList.appendChild(li);
            });

            categorySection.appendChild(mealList);
            favoriteMealsContainer.appendChild(categorySection);
        });
    }
}

function viewMeal(mealName) {
    const meal = favoriteMeals.find(m => m.name === mealName);
    if (meal) {
        const modalContent = document.getElementById('mealModalContent');
        const ingredientsHtml = meal.ingredients.map(ing => {
            const parts = ing.split(' ');
            if (parts.length > 1 && !isNaN(parts[0])) {
                const [amount, ...ingName] = parts;
                return `<li><span class="font-semibold">${amount}</span> ${ingName.join(' ')}</li>`;
            }
            return `<li>${ing}</li>`;
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
        document.getElementById('mealModal').classList.remove('hidden');
        
        document.getElementById('closeMealModal').addEventListener('click', () => {
            document.getElementById('mealModal').classList.add('hidden');
        });
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
    favoriteMeals = favoriteMeals.filter(meal => meal.name !== mealName);
    saveFavoriteMeals();
    displayFavoriteMeals();
}

function displayMealSuggestions(meals) {
    const mealSuggestions = document.getElementById('mealSuggestions');
    mealSuggestions.innerHTML = '';

    if (!Array.isArray(meals) || meals.length === 0) {
        mealSuggestions.innerHTML = '<p class="text-gray-500">No meal suggestions available with current ingredients and selected categories.</p>';
        return;
    }

    meals.forEach(meal => {
        const div = document.createElement('div');
        div.className = 'bg-white p-6 rounded-lg shadow-md mb-6 transition-all hover:shadow-lg';
        const isFavorite = favoriteMeals.some(favMeal => favMeal.name === meal.name);
        
        const ingredientsWithoutAmounts = meal.ingredients.map(ing => ing.name).join(', ');
        const ingredientsWithAmounts = meal.ingredients.map(ing => 
            `<li><span class="font-semibold">${ing.name}</span> <span class="text-gray-500">(${ing.amount})</span></li>`
        ).join('');

        div.innerHTML = `
            <div class="flex justify-between items-center mb-3">
                <h3 class="text-2xl font-semibold">${meal.name || 'Unnamed Meal'}</h3>
                <div>
                    <button class="toggle-amounts-btn mr-2 text-gray-500 hover:text-gray-700" onclick="toggleIngredientAmounts(this)">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                    <button class="favorite-btn ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}" onclick="toggleFavorite(${JSON.stringify(meal).replace(/"/g, '&quot;')})">
                        <i class="fas fa-star"></i>
                    </button>
                </div>
            </div>
            <p class="text-sm text-gray-500 mb-2">${meal.category}</p>
            <div class="text-gray-600 mb-3">
                <strong>Ingredients:</strong> 
                <span class="ingredients-without-amounts">${ingredientsWithoutAmounts}</span>
                <ul class="ingredients-with-amounts hidden list-disc pl-5 mt-2">
                    ${ingredientsWithAmounts}
                </ul>
            </div>
            <p class="mb-3"><strong>Description:</strong> ${meal.description || 'No description provided'}</p>
            <button class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors" onclick="toggleInstructions(this)">Show Instructions</button>
            <div class="instructions hidden mt-4 p-4 bg-gray-100 rounded">
                <h4 class="font-semibold mb-2">Instructions:</h4>
                <p>${meal.instructions || 'No instructions provided'}</p>
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
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.id = 'searchInput';
    searchInput.placeholder = 'Search ingredients or meals...';
    searchInput.className = 'w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-300';
    
    const searchResults = document.createElement('div');
    searchResults.id = 'searchResults';
    searchResults.className = 'mb-4';

    document.querySelector('.container').insertBefore(searchResults, document.querySelector('.grid'));
    document.querySelector('.container').insertBefore(searchInput, searchResults);

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
            li.textContent = `${item.name} (${item.quantity})`;
            ingredientList.appendChild(li);
        });
        searchResults.appendChild(ingredientList);
    }

    if (mealResults.length > 0) {
        const mealList = document.createElement('ul');
        mealList.innerHTML = '<h3 class="font-semibold mb-2 mt-4">Favorite Meals:</h3>';
        mealResults.forEach(meal => {
            const li = document.createElement('li');
            li.textContent = meal.name;
            mealList.appendChild(li);
        });
        searchResults.appendChild(mealList);
    }
}

function toggleInstructions(button) {
    const instructionsDiv = button.nextElementSibling;
    instructionsDiv.classList.toggle('hidden');
    button.textContent = instructionsDiv.classList.contains('hidden') ? 'Show Instructions' : 'Hide Instructions';
}

async function generateMealsWithOpenAI() {
    const activeButtons = document.querySelectorAll('.category-toggle.active:not([data-category="All"])');
    const selectedCategories = Array.from(activeButtons).map(btn => btn.dataset.category);

    if (selectedCategories.length === 0) {
        showNotification('Please select at least one meal type', 'error');
        return;
    }

    const selectedIngredients = pantry.filter(item => {
        const checkbox = document.querySelector(`#ingredient-${item.name}`);
        return checkbox && checkbox.checked;
    }).map(item => item.name);

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

        if (response.ok) {
            currentMeals = await response.json();
            displayMealSuggestions(currentMeals);
        } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to generate meals');
        }
    } catch (error) {
        console.error('Error generating meals:', error);
        if (mealSuggestions) {
            mealSuggestions.innerHTML = `<p class="text-red-500">Error: ${error.message}</p>`;
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
    ingredientInput.setAttribute('list', 'ingredientSuggestions');
}

function setupDragAndDrop() {
    const sortable = new Sortable(pantryList, {
        animation: 150,
        ghostClass: 'bg-blue-100',
        onEnd: function (evt) {
            const item = pantry[evt.oldIndex];
            pantry.splice(evt.oldIndex, 1);
            pantry.splice(evt.newIndex, 0, item);
            savePantry();
        },
    });
}

// =======MEAL-GEN FILTERS============

function addToggleAllCategoriesCheckbox() {
    const filterDiv = document.getElementById('categoryFilters');
    const toggleAllLabel = document.createElement('label');
    toggleAllLabel.className = 'inline-flex items-center mb-2';
    toggleAllLabel.innerHTML = `
        <input type="checkbox" id="toggleAllCategories" class="form-checkbox" checked>
        <span class="ml-2 font-semibold">Toggle All</span>
    `;
    filterDiv.insertBefore(toggleAllLabel, filterDiv.firstChild);

    document.getElementById('toggleAllCategories').addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('#categoryFilters input[type="checkbox"]:not(#toggleAllCategories)');
        checkboxes.forEach(checkbox => checkbox.checked = this.checked);
    });
}

function createCategoryFilters() {
    const categories = ['All', 'Breakfast', 'Lunch', 'Dinner', 'Dessert', 'Snack'];
    const container = document.getElementById('categoryToggleButtons');

    categories.forEach(category => {
        const button = document.createElement('button');
        button.className = 'category-toggle px-4 py-2 rounded-full bg-gray-200 text-gray-700 font-medium transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-300';
        button.textContent = category;
        button.dataset.category = category;
        button.onclick = toggleCategory;
        
        if (category === 'All') {
            button.classList.add('active', 'bg-blue-500', 'text-white');
        }
        
        container.appendChild(button);
    });
}


function updateSelectedCategories() {
    const activeButtons = document.querySelectorAll('.category-toggle.active');
    const selectedCategories = Array.from(activeButtons).map(btn => btn.dataset.category);

    if (selectedCategories.includes('All') || selectedCategories.length === 0) {
        document.querySelectorAll('.category-toggle').forEach(btn => {
            if (btn.dataset.category !== 'All') {
                btn.classList.add('active', 'bg-blue-500', 'text-white');
                btn.classList.remove('bg-gray-200', 'text-gray-700');
            }
        });
    }
}

// =========== LOGIN AND REGISTER =====================
// =========== LOGIN AND REGISTER =====================
// Add these functions
async function register() {
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (response.ok) {
    showNotification('Registered successfully. Please log in.');
  } else {
    const data = await response.json();
    showNotification(data.error, 'error');
  }
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  if (response.ok) {
    showNotification('Logged in successfully');
    loadUserData();
  } else {
    const data = await response.json();
    showNotification(data.error, 'error');
  }
}

async function logout() {
  await fetch('/api/logout');
  showNotification('Logged out successfully');
  // Clear user data and show login form
}

// ========= END OF LOGIN AND REGISTER ========================
// ========= END OF LOGIN AND REGISTER ========================

// ===========END OF MEAL GEN FILTERS=========

document.getElementById('selectAllIngredients').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.ingredient-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});

window.addEventListener('load', async () => {
    // createLoadingIndicator();
    setupAutocomplete();
    await loadPantry();
    await loadFavoriteMeals();
    await loadCategories();
    setupSearch();
    displayFavoriteMeals();
    setupDragAndDrop();
    // addToggleAllCategoriesCheckbox();
    createCategoryFilters(); // Add this line
});

//   !!            DO THIS             !!
//DO THIS APP BUT FOR OTHER FIELDS TOO!!! - 
//same concept, left is users data, right is genreated suggestions, bottom
// is favourite suiggestions. eg. goals, clothes (wqardrobe > generate outfits)

//========^^^^^^^^^^^^ DOW NOW!~!!!=================

//ALSO, roadmap: my kitchen area has pantry, and equipment, so u can selelct
// appliances you have. also, ability to refine choices or cycle more.
//3. ability to set number of meals generated

//4. number of ingredients to be used, in search filter eg. 4-6, 6-8,