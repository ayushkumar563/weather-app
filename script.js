const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const errorMessage = document.getElementById('error-message');
const weatherInfo = document.getElementById('weather-info');

// Weather display elements
const cityNameEl = document.getElementById('city-name');
const tempValueEl = document.getElementById('temp-value');
const weatherConditionEl = document.getElementById('weather-condition');
const windSpeedEl = document.getElementById('wind-speed');
const humidityEl = document.getElementById('humidity');

// Open-Meteo API doesn't provide condition text directly in current_weather, only a weathercode.
// We map basic WMO weather codes to text.
const getWeatherConditionText = (code) => {
    if (code === 0) return 'Clear sky';
    if (code === 1 || code === 2 || code === 3) return 'Partly cloudy / Overcast';
    if (code >= 45 && code <= 48) return 'Fog';
    if (code >= 51 && code <= 57) return 'Drizzle';
    if (code >= 61 && code <= 67) return 'Rain';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 80 && code <= 82) return 'Rain showers';
    if (code >= 95 && code <= 99) return 'Thunderstorm';
    return 'Unknown';
};

const fetchWeather = async (city) => {
    try {
        // Reset UI
        errorMessage.classList.add('hidden');
        weatherInfo.classList.add('hidden');
        
        if (!city.trim()) {
            throw new Error('Please enter a valid city name.');
        }

        // 1. Get coordinates for the city using Open-Meteo Geocoding API
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        
        if (!geoResponse.ok) {
            throw new Error('Failed to fetch location data. Please check your network.');
        }

        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            throw new Error('City not found. Please try another search.');
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country } = location;

        // 2. Get weather for those coordinates using Open-Meteo Weather API
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relativehumidity_2m`);
        
        if (!weatherResponse.ok) {
            throw new Error('Failed to fetch weather data. Please try again later.');
        }

        const weatherData = await weatherResponse.json();
        
        // Open meteo returns current_weather object and hourly arrays.
        // We can get the first hourly humidity as an approximation if current humidity isn't directly in current_weather.
        const currentTemp = weatherData.current_weather.temperature;
        const currentWind = weatherData.current_weather.windspeed;
        const weatherCode = weatherData.current_weather.weathercode;
        const currentHumidity = weatherData.hourly.relativehumidity_2m[0] || '--';

        // Update UI
        cityNameEl.textContent = `${name}, ${country}`;
        tempValueEl.textContent = currentTemp;
        weatherConditionEl.textContent = getWeatherConditionText(weatherCode);
        windSpeedEl.textContent = currentWind;
        humidityEl.textContent = currentHumidity;

        weatherInfo.classList.remove('hidden');

    } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
    }
};

searchBtn.addEventListener('click', () => {
    fetchWeather(cityInput.value);
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        fetchWeather(cityInput.value);
    }
});
