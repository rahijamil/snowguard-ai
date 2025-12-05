package com.rahi.hazardservice.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rahi.hazardservice.dto.WeatherData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeatherService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${openweather.api.key}")
    private String apiKey;

    @Value("${openweather.api.url:https://api.openweathermap.org/data/2.5/weather}")
    private String apiUrl;

    // @Cacheable(value = "weather", key = "#lat + '_' + #lon")
    public WeatherData fetchWeather(Double lat, Double lon) {
        try {
            String url = String.format("%s?lat=%s&lon=%s&appid=%s&units=metric",
                    apiUrl, lat, lon, apiKey);
            
            log.info("Fetching weather for lat={}, lon={}", lat, lon);
            String response = restTemplate.getForObject(url, String.class);
            
            return parseWeatherResponse(response);
        } catch (Exception e) {
            log.error("Failed to fetch weather data: {}", e.getMessage());
            // Return safe defaults
            return createDefaultWeather();
        }
    }

    private WeatherData parseWeatherResponse(String json) throws Exception {
        JsonNode root = objectMapper.readTree(json);
        
        WeatherData data = new WeatherData();
        
        // Main weather info
        JsonNode main = root.get("main");
        if (main != null) {
            data.setTemperature(main.get("temp").asDouble());
            data.setHumidity(main.get("humidity").asInt());
        }
        
        // Weather condition
        JsonNode weather = root.get("weather");
        if (weather != null && weather.isArray() && weather.size() > 0) {
            JsonNode first = weather.get(0);
            data.setWeatherCondition(first.get("main").asText());
            data.setDescription(first.get("description").asText());
        }
        
        // Wind
        JsonNode wind = root.get("wind");
        if (wind != null) {
            data.setWindSpeed(wind.get("speed").asDouble());
        }
        
        // Visibility
        JsonNode visibility = root.get("visibility");
        if (visibility != null) {
            data.setVisibility(visibility.asDouble());
        }
        
        // Rain/Snow
        double precipitation = 0.0;
        if (root.has("rain") && root.get("rain").has("1h")) {
            precipitation = root.get("rain").get("1h").asDouble();
        }
        if (root.has("snow") && root.get("snow").has("1h")) {
            precipitation += root.get("snow").get("1h").asDouble();
        }
        data.setPrecipitation(precipitation);
        
        return data;
    }

    private WeatherData createDefaultWeather() {
        WeatherData data = new WeatherData();
        data.setTemperature(0.0);
        data.setWeatherCondition("Unknown");
        data.setWindSpeed(0.0);
        data.setPrecipitation(0.0);
        data.setVisibility(10000.0);
        data.setHumidity(50);
        data.setDescription("Weather data unavailable");
        return data;
    }
}