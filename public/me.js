// me.js

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadProfile();
    loadFriends();
    loadFriendRequests();
    loadSharedMeals();
    setupEventListeners();
     setActiveNavLink();

      const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', logout);
    }
});

function checkAuth() {
    fetch('/api/check-auth')
        .then(response => response.json())
        .then(data => {
            if (!data.authenticated) {
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error('Error checking authentication:', error);
            window.location.href = 'index.html';
        });
}

function loadProfile() {
    fetch('/api/user-profile')
        .then(response => response.json())
        .then(profile => {
            const profileInfo = document.getElementById('profileInfo');
            profileInfo.innerHTML = `
                <h3 class="text-2xl font-semibold mb-4">${profile.username}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${createProfileStat('Favorite Meals', profile.favoriteMeals.length)}
                    ${createProfileStat('Pantry Items', profile.pantryItemCount)}
                    ${createProfileStat('Most Used Ingredient', profile.mostUsedIngredient)}
                    ${createProfileStat('Favorite Meal Category', profile.favoriteMealCategory)}
                    ${createProfileStat('Total Meals Generated', profile.totalMealsGenerated)}
                    ${createProfileStat('Account Created', new Date(profile.createdAt).toLocaleDateString())}
                </div>
            `;
        })
        .catch(error => {
            console.error('Error loading profile:', error);
            showNotification('Failed to load profile', 'error');
        });
}

function createProfileStat(label, value) {
    return `
        <div class="bg-white rounded-lg shadow p-4">
            <p class="text-sm font-medium text-gray-500">${label}</p>
            <p class="mt-1 text-xl font-semibold text-indigo-600">${value}</p>
        </div>
    `;
}

function loadFriends() {
    fetch('/api/friends')
        .then(response => response.json())
        .then(friends => {
            const friendsList = document.getElementById('friendsList');
            friendsList.innerHTML = '';
            friends.forEach(friend => {
                const friendElement = document.createElement('div');
                friendElement.className = 'flex justify-between items-center bg-white p-3 rounded-lg shadow-sm';
                friendElement.innerHTML = `
                    <span>${friend}</span>
                    <button class="bg-indigo-500 text-white px-3 py-1 rounded text-sm hover:bg-indigo-600 transition-colors" onclick="viewProfile('${friend}')">
                        View Profile
                    </button>
                `;
                friendsList.appendChild(friendElement);
            });
        })
        .catch(error => {
            console.error('Error loading friends:', error);
            showNotification('Failed to load friends', 'error');
        });
}

function loadFriendRequests() {
    fetch('/api/friend-requests')
        .then(response => response.json())
        .then(requests => {
            const requestsList = document.createElement('div');
            requestsList.className = 'mt-4';
            requestsList.innerHTML = '<h3 class="text-lg font-semibold mb-2">Friend Requests</h3>';
            requests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.className = 'flex justify-between items-center bg-white p-3 rounded-lg shadow-sm mb-2';
                requestElement.setAttribute('data-friend-request', request);
                requestElement.innerHTML = `
                    <span>${request}</span>
                    <button class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition-colors" onclick="acceptFriendRequest('${request}')">
                        Accept
                    </button>
                `;
                requestsList.appendChild(requestElement);
            });
            document.getElementById('friends').appendChild(requestsList);
        })
        .catch(error => {
            console.error('Error loading friend requests:', error);
            showNotification('Failed to load friend requests', 'error');
        });
}

function loadSharedMeals() {
    fetch('/api/shared-meals')
        .then(response => response.json())
        .then(meals => {
            const sharedMealsList = document.getElementById('sharedMealsList');
            sharedMealsList.innerHTML = '';
            meals.forEach(meal => {
                const mealElement = document.createElement('div');
                mealElement.className = 'bg-white p-4 rounded-lg shadow-md';
                mealElement.innerHTML = `
                    <h3 class="text-xl font-semibold mb-2">${meal.name}</h3>
                    <p class="text-gray-600 mb-2">Shared by: ${meal.sharedBy}</p>
                    <p class="text-gray-600 mb-2">Category: ${meal.category}</p>
                    <button class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors" onclick="viewMealDetails(${JSON.stringify(meal)})">
                        View Details
                    </button>
                `;
                sharedMealsList.appendChild(mealElement);
            });
        })
        .catch(error => {
            console.error('Error loading shared meals:', error);
            showNotification('Failed to load shared meals', 'error');
        });
}

function setupEventListeners() {
    document.getElementById('addFriendBtn').addEventListener('click', addFriend);
}

function addFriend() {
    const friendUsername = document.getElementById('friendUsername').value;
    fetch('/api/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername })
    })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message, 'success');
            document.getElementById('friendUsername').value = '';
        })
        .catch(error => {
            console.error('Error adding friend:', error);
            showNotification('Failed to add friend', 'error');
        });
}

function acceptFriendRequest(friendUsername) {
    fetch('/api/accept-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername })
    })
        .then(response => response.json())
        .then(data => {
            showNotification(data.message, 'success');
            // Remove the friend request element from the DOM
            const requestElement = document.querySelector(`[data-friend-request="${friendUsername}"]`);
            if (requestElement) {
                requestElement.remove();
            }
            loadFriends(); // Reload the friends list
        })
        .catch(error => {
            console.error('Error accepting friend request:', error);
            showNotification('Failed to accept friend request', 'error');
        });
}

function createModal(content) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="relative bg-white rounded-lg shadow-xl p-6 m-4 max-w-xl w-full">
            ${content}
            <button onclick="this.closest('.fixed').remove()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </div>
    `;
    document.body.appendChild(modal);
}

function setActiveNavLink() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.main-nav-link');
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function viewProfile(username) {
    fetch('/api/user-profile/' + encodeURIComponent(username))
        .then(response => response.json())
        .then(profile => {
            const content = `
                <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">${profile.username}'s Profile</h3>
                <p class="mb-2">Favorite Meals: ${profile.favoriteMeals.length}</p>
                <!-- Add more profile information here -->
            `;
            createModal(content);
        })
        .catch(error => {
            console.error('Error viewing profile:', error);
            showNotification('Failed to load user profile', 'error');
        });
}

function viewMealDetails(meal) {
    const ingredientsList = meal.ingredients && Array.isArray(meal.ingredients)
        ? meal.ingredients.map(ing => `<li>${ing.amount} ${ing.name}</li>`).join('')
        : '<li>No ingredients available</li>';
    
    const content = `
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">${meal.name || 'Unnamed Meal'}</h3>
        <p class="mb-2"><strong>Category:</strong> ${meal.category || 'Uncategorized'}</p>
        <p class="mb-2"><strong>Shared by:</strong> ${meal.sharedBy || 'Unknown'}</p>
        <p class="mb-4">${meal.description || 'No description available.'}</p>
        <h4 class="font-semibold mb-2">Ingredients:</h4>
        <ul class="list-disc pl-5 mb-4">
            ${ingredientsList}
        </ul>
        <h4 class="font-semibold mb-2">Instructions:</h4>
        <p>${meal.instructions || 'No instructions available.'}</p>
    `;
    createModal(content);
}

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

function getCurrentUsername() {
    // This function should return the current user's username
    // You might need to implement this based on how you're storing the current user's information
    // For example, you could store it in localStorage when the user logs in
    return localStorage.getItem('currentUser');
}

function logout() {
    fetch('/api/logout')
        .then(response => response.json())
        .then(data => {
            showNotification('Logged out successfully', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        })
        .catch(error => {
            console.error('Logout error:', error);
            showNotification('An error occurred during logout', 'error');
        });
}