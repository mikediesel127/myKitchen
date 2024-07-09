// dashboard.js

// -------- INITIALIZATION --------
document.addEventListener('DOMContentLoaded', () => {
     setActiveNavLink();
    checkAuth();
    loadRecentUsers();
    fetchChartData();
    setupEventListeners();
});
// -------- END INITIALIZATION --------

// -------- AUTHENTICATION --------
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

document.getElementById('logoutButton').addEventListener('click', () => {
    fetch('/api/logout')
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(error => console.error('Error logging out:', error));
});
// -------- END AUTHENTICATION --------

// -------- RECENT USERS --------
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow';
    card.innerHTML = `
        <h3 class="text-xl font-semibold mb-2">${user.username}</h3>
        <p class="text-gray-600 mb-4">Joined ${moment(user.createdAt).fromNow()}</p>
        <div class="flex space-x-2">
            <button class="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 transition-colors favorite-meals-btn" data-username="${user.username}">
                Show Favorite Meals
            </button>
            <button class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors add-friend-btn" data-username="${user.username}">
                Add Friend
            </button>
        </div>
        <div id="favoriteMeals-${user.username}" class="mt-4 hidden"></div>
    `;
    return card;
}



function setupEventListeners() {
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('favorite-meals-btn')) {
            toggleFavoriteMeals(event.target.dataset.username);
        } else if (event.target.classList.contains('add-friend-btn')) {
            addFriend(event.target.dataset.username);
        }
    });
}
// Call this function after loading recent users
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
            setupEventListeners(); // Add this line
        })
        .catch(error => console.error('Error loading recent users:', error));
}

// Make sure addFriend function is defined
function addFriend(username) {
    console.log('Adding friend:', username); // Debugging line
    fetch('/api/add-friend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendUsername: username })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Server response:', data); // Debugging line
        if (data.error) {
            showNotification(data.error, 'error');
        } else {
            showNotification(data.message, 'success');
        }
    })
    .catch(error => {
        console.error('Error adding friend:', error);
        showNotification('Failed to add friend', 'error');
    });
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
// -------- END RECENT USERS --------

// -------- DATA VISUALIZATION --------
async function fetchChartData() {
    try {
        const [ingredientsData, categoriesData] = await Promise.all([
            fetch('/api/top-ingredients').then(res => res.json()),
            fetch('/api/favorite-categories').then(res => res.json())
        ]);

        createIngredientsChart(ingredientsData);
        createCategoriesChart(categoriesData);
    } catch (error) {
        console.error('Error fetching chart data:', error);
        showNotification('Failed to load chart data', 'error');
    }
}

function createIngredientsChart(data) {
    const ctx = document.getElementById('ingredientsChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(item => item[0]),
            datasets: [{
                label: 'Usage Count',
                data: data.map(item => item[1]),
                backgroundColor: 'rgba(99, 102, 241, 0.8)',
                borderColor: 'rgb(99, 102, 241)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

function createCategoriesChart(data) {
    const ctx = document.getElementById('categoriesChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item[0]),
            datasets: [{
                data: data.map(item => item[1]),
                backgroundColor: [
                    'rgba(255, 99, 132, 0.8)',
                    'rgba(54, 162, 235, 0.8)',
                    'rgba(255, 206, 86, 0.8)',
                    'rgba(75, 192, 192, 0.8)',
                    'rgba(153, 102, 255, 0.8)',
                ],
                borderColor: [
                    'rgb(255, 99, 132)',
                    'rgb(54, 162, 235)',
                    'rgb(255, 206, 86)',
                    'rgb(75, 192, 192)',
                    'rgb(153, 102, 255)',
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}
// -------- END DATA VISUALIZATION --------

// -------- UTILITY FUNCTIONS --------
function showNotification(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `fixed bottom-5 right-5 p-4 rounded-lg shadow-lg mb-3 ${type === 'error' ? 'bg-red-500' : type === 'warning' ? 'bg-yellow-500' : 'bg-green-500'} text-white fade-in z-50`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}
// -------- END UTILITY FUNCTIONS --------