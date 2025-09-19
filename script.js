const API_KEY = window.WeatherConfig?.API_KEY || 'YOUR_API_KEY_HERE';
const API_URL = window.WeatherConfig?.API_URL || 'https://api.openweathermap.org/data/2.5/weather';

// Mock local data as fallback
const mockWeatherData = {
    'london': {
        name: 'London',
        main: { temp: 15, feels_like: 13, humidity: 78 },
        weather: [{ main: 'Clouds', description: 'overcast clouds', icon: '04d' }],
        wind: { speed: 4.2 }
    },
    'new york': {
        name: 'New York',
        main: { temp: 22, feels_like: 24, humidity: 65 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        wind: { speed: 3.1 }
    },
    'tokyo': {
        name: 'Tokyo',
        main: { temp: 28, feels_like: 31, humidity: 85 },
        weather: [{ main: 'Rain', description: 'light rain', icon: '10d' }],
        wind: { speed: 2.5 }
    },
    'paris': {
        name: 'Paris',
        main: { temp: 18, feels_like: 17, humidity: 70 },
        weather: [{ main: 'Clouds', description: 'few clouds', icon: '02d' }],
        wind: { speed: 3.8 }
    }
};

// DOM elements
const cityInput = document.querySelector('.js-city-input');
const searchBtn = document.querySelector('.js-search-btn');
const loading = document.querySelector('.js-loading');
const weatherCard = document.querySelector('.js-weather-card');
const errorMessage = document.querySelector('.js-error-message');
const retryBtn = document.querySelector('.js-retry-btn');

// Weather display elements
const cityName = document.querySelector('.js-city-name');
const temperature = document.querySelector('.js-temperature');
const description = document.querySelector('.js-description');
const weatherIcon = document.querySelector('.js-weather-icon');
const feelsLike = document.querySelector('.js-feels-like');
const humidity = document.querySelector('.js-humidity');
const windSpeed = document.querySelector('.js-wind-speed');
const errorText = document.querySelector('.js-error-text');

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadLastSearchedCity();
    setupEventListeners();
});

function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    cityInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    retryBtn.addEventListener('click', handleSearch);
}

async function handleSearch() {
    const city = cityInput.value.trim();

    if (!city) {
        showError('Please enter a city name');
        return;
    }

    showLoading();

    try {
        const weatherData = await getWeather(city);
        displayWeather(weatherData);
        saveLastSearchedCity(city);
    } catch (error) {
        console.error('Error fetching weather:', error);

        // Try fallback data
        const fallbackData = getFallbackData(city);
        if (fallbackData) {
            displayWeather(fallbackData);
            if (error.message.includes('API key not configured')) {
                showError('Using offline data - add your API key for live weather', false);
            } else {
                showError('Using offline data - API unavailable', false);
            }
        } else {
            showError('Weather data not available. Please check the city name and try again.');
        }
    }
}

async function getWeather(city) {
    const url = `${API_URL}?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;

    const response = await fetch(url);

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('City not found');
        } else if (response.status === 401) {
            throw new Error('Invalid API key');
        } else {
            throw new Error('Weather service unavailable');
        }
    }

    return await response.json();
}

function getFallbackData(city) {
    const cityKey = city.toLowerCase();
    return mockWeatherData[cityKey] || null;
}

function displayWeather(data) {
    hideAllSections();

    cityName.textContent = data.name;
    temperature.textContent = Math.round(data.main.temp);
    description.textContent = data.weather[0].description;
    feelsLike.textContent = Math.round(data.main.feels_like);
    humidity.textContent = data.main.humidity;
    windSpeed.textContent = data.wind.speed.toFixed(1);

    // Set weather icon
    const iconCode = data.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    weatherIcon.alt = data.weather[0].description;

    weatherCard.style.display = 'block';
}

function showLoading() {
    hideAllSections();
    loading.style.display = 'block';
}

function showError(message, hideWeather = true) {
    if (hideWeather) {
        hideAllSections();
    }

    errorText.textContent = message;
    errorMessage.style.display = 'block';

    // Auto-hide error message after 5 seconds if it's just a warning
    if (!hideWeather) {
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
}

function hideAllSections() {
    loading.style.display = 'none';
    weatherCard.style.display = 'none';
    errorMessage.style.display = 'none';
}

function saveLastSearchedCity(city) {
    try {
        localStorage.setItem('lastSearchedCity', city);
    } catch (error) {
        console.warn('Could not save to localStorage:', error);
    }
}

function loadLastSearchedCity() {
    try {
        const lastCity = localStorage.getItem('lastSearchedCity');
        if (lastCity) {
            cityInput.value = lastCity;
        }
    } catch (error) {
        console.warn('Could not load from localStorage:', error);
    }
}

// Utility function to get user's location (optional feature)
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await fetch(
                        `${API_URL}?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`
                    );
                    const data = await response.json();
                    cityInput.value = data.name;
                    displayWeather(data);
                } catch (error) {
                    console.error('Error getting weather for current location:', error);
                }
            },
            (error) => {
                console.error('Error getting location:', error);
            }
        );
    }
}