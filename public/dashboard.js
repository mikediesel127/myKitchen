document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadRecentUsers();
});

function checkAuth() {
    fetch('/api/check-auth')
        .then(response => response.json())
        .then(data => {
            if (data.authenticated) {
                document.getElementById('welcomeMessage').textContent = `Welcome, ${data.username}!`;
            } else {
                window.location.href = 'index.html';
            }
        })
        .catch(error => {
            console.error('Error checking authentication:', error);
            window.location.href = 'index.html';
        });
}

function loadRecentUsers() {
    fetch('/api/recent-users')
        .then(response => response.json())
        .then(users => {
            const recentUsersContainer = document.getElementById('recentUsers');
            recentUsersContainer.innerHTML = '';
            users.forEach(user => {
                const userCard = createUserCard(user);
                recentUsersContainer.appendChild(userCard);
            });
        })
        .catch(error => console.error('Error loading recent users:', error));
}

function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
    card.innerHTML = `
        <h3 class="text-xl font-semibold mb-2">${user.username}</h3>
        <p class="text-gray-600 mb-4">Joined ${moment(user.createdAt).fromNow()}</p>
        <button class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors" onclick="toggleFavoriteMeals('${user.username}')">
            Show Favorite Meals
        </button>
        <div id="favoriteMeals-${user.username}" class="mt-4 hidden"></div>
    `;
    return card;
}

function toggleFavoriteMeals(username) {
    const favoriteMealsContainer = document.getElementById(`favoriteMeals-${username}`);
    if (favoriteMealsContainer.classList.contains('hidden')) {
        fetch(`/api/user-favorite-meals/${username}`)
            .then(response => response.json())
            .then(meals => {
                favoriteMealsContainer.innerHTML = meals.length > 0
                    ? meals.map(meal => `<p class="mb-2">${meal.name} (${meal.category})</p>`).join('')
                    : '<p>No favorite meals yet.</p>';
                favoriteMealsContainer.classList.remove('hidden');
            })
            .catch(error => console.error('Error loading favorite meals:', error));
    } else {
        favoriteMealsContainer.classList.add('hidden');
    }
}

document.getElementById('logoutButton').addEventListener('click', () => {
    fetch('/api/logout')
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(error => console.error('Error logging out:', error));
});