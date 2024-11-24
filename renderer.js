// Координаты маршрута
const routeCoordinates = [
    [68.97, 33.07], [68.97, 33.04], [68.99, 33.03], [69.02, 33.04],
    [69.06, 33.07], [69.09, 33.39], [69.14, 33.46], [69.18, 33.55],
    [69.22, 33.53], [69.29, 33.52], [69.33, 33.59], [69.33, 33.75],
    [69.33, 33.86], [69.32, 34.03], [69.31, 34.14], [69.31, 34.26],
    [69.31, 34.36], [69.30, 34.58], [69.28, 34.86], [69.25, 35.80],
    [69.11, 36.74], [68.77, 38.00], [68.43, 39.15], [68.15, 40.42],
    [67.82, 41.44], [67.39, 41.90], [66.93, 41.78], [66.51, 41.45],
    [66.13, 40.90], [65.89, 40.14], [65.60, 39.44], [65.13, 39.71],
    [64.96, 39.96], [64.84, 40.19], [64.78, 40.37], [64.73, 40.41],
    [64.71, 40.42], [64.70, 40.41], [64.68, 40.41], [64.66, 40.41],
    [64.65, 40.41], [64.63, 40.43], [64.62, 40.45], [64.61, 40.46],
    [64.60, 40.49], [64.59, 40.49], [64.57, 40.50], [64.54, 40.50],
    [64.54, 40.51]
];

// Функция для получения текущего времени в формате "HH:MM:SS DD.MM.YYYY"
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('ru-RU');
    document.getElementById('update-time').textContent = ${timeString} ${dateString};
}

// Функция для получения данных с сервера
async function fetchZoneData(lat, lon, iceLevel) {
    const response = await fetch('http://127.0.0.1:5000/get_zone_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            latitude: lat,
            longitude: lon,
            ice_level: iceLevel
        })
    });
    return response.json();
}

// Функция для определения цвета на основе уровня риска
function getColorByRiskLevel(riskLevel) {
    if (riskLevel === 'Высокий') {
        return 'red';
    } else if (riskLevel === 'Средний') {
        return 'orange';
    } else {
        return 'green';
    }
}

// Функция для обновления панели с информацией о зоне
function updateInfoPanel(zoneName, zoneData) {
    document.getElementById('zone-name').textContent = zoneName;
    document.getElementById('ice-level').textContent = ${zoneData.ice_level}%;
    document.getElementById('temperature').textContent = ${zoneData.temperature} °C;
    document.getElementById('water-temperature').textContent = ${zoneData.water_temperature} °C;
    document.getElementById('wind-speed').textContent = ${zoneData.wind_speed} м/с;
    document.getElementById('humidity').textContent = ${zoneData.humidity}%;
    document.getElementById('pressure').textContent = ${zoneData.pressure} гПа;
    document.getElementById('visibility').textContent = ${zoneData.visibility} км;

    // Обновляем список рекомендаций
    const recommendationsList = document.getElementById('recommendations-list');
    recommendationsList.innerHTML = zoneData.recommendations.map(rec => <li>${rec}</li>).join('');

    // Обновляем время обновления
    updateTime();
}

// Функция для добавления зон риска с начальным заполнением цвета и периодическим обновлением
async function addRiskZones(map) {
    const riskZones = [
        { coordinates: [68.97, 33.04], area: "Риск вдоль маршрута 1" },
        { coordinates: [69.09, 33.39], area: "Риск вдоль маршрута 2" },
        { coordinates: [68.77, 38.00], area: "Риск вдоль маршрута 3" },
        { coordinates: [67.82, 41.44], area: "Риск вдоль маршрута 4" },
        { coordinates: [66.51, 41.45], area: "Риск вдоль маршрута 5" },
        { coordinates: [65.13, 39.71], area: "Риск вдоль маршрута 6" }
    ];

    // Загружаем и отображаем данные для каждой зоны
    const circles = [];
    for (const zone of riskZones) {
        const zoneData = await fetchZoneData(zone.coordinates[0], zone.coordinates[1], 50);
        const color = getColorByRiskLevel(zoneData.risk_level);

        const circle = L.circle(zone.coordinates, {
            color: color,
            radius: 30000,
            fillOpacity: 0.3
        }).addTo(map);

        circles.push({ circle, zone, zoneData });
        
        // Устанавливаем содержимое всплывающего окна и обновление панели
        circle.bindPopup(
            <strong>Текущие условия:</strong><br>
            Уровень льда: ${zoneData.ice_level}%<br>
            Температура воздуха: ${zoneData.temperature} °C<br>
            Температура воды: ${zoneData.water_temperature} °C<br>
            Скорость ветра: ${zoneData.wind_speed} м/с<br>
            Влажность: ${zoneData.humidity}%<br>
            Давление: ${zoneData.pressure} гПа<br>
            Видимость: ${zoneData.visibility} км<br><br>
            <strong>Рекомендации:</strong><ul>${zoneData.recommendations.map(rec => <li>${rec}</li>).join('')}</ul>
        );

        // Устанавливаем обработчик клика на зону
        circle.on('click', () => {
            updateInfoPanel(zone.area, zoneData);
            circle.openPopup();
        });
    }

    // Обновление данных для всех зон в режиме реального времени
    setInterval(async () => {
        for (const { circle, zone } of circles) {
            const updatedData = await fetchZoneData(zone.coordinates[0], zone.coordinates[1], 50);
            const updatedColor = getColorByRiskLevel(updatedData.risk_level);
            circle.setStyle({ color: updatedColor });
            circle.bindPopup(
                <strong>Текущие условия:</strong><br>
                Уровень льда: ${updatedData.ice_level}%<br>
                Температура воздуха: ${updatedData.temperature} °C<br>
                Температура воды: ${updatedData.water_temperature} °C<br>
                Скорость ветра: ${updatedData.wind_speed} м/с<br>
                Влажность: ${updatedData.humidity}%<br>
                Давление: ${updatedData.pressure} гПа<br>
                Видимость: ${updatedData.visibility} км<br><br>
                <strong>Рекомендации:</strong><ul>${updatedData.recommendations.map(rec => <li>${rec}</li>).join('')}</ul>
            );
        }
        updateTime(); // Обновляем время обновления
    }, 300000); // Обновление каждые 5 минут
}

async function updateZoneInfoFromBackend(lat, lon, iceLevel) {
    const zoneData = await fetchZoneData(lat, lon, iceLevel);
    updateInfoPanel("Обновлённые данные зоны", zoneData);
}


// Функция для инициализации карты и добавления маршрута и зон
function initializeMap() {
    const map = L.map('map-container').setView([66.5, 36.5], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Добавляем линию маршрута
    L.polyline(routeCoordinates, { color: 'blue', weight: 3 }).addTo(map);

    // Добавляем маркеры начальной и конечной точек маршрута
    const startMarker = L.marker(routeCoordinates[0]).addTo(map).bindPopup("Начальная точка маршрута").openPopup();
    const endMarker = L.marker(routeCoordinates[routeCoordinates.length - 1]).addTo(map).bindPopup("Конечная точка маршрута");

    // Добавляем кликабельные зоны риска с начальным заполнением
    addRiskZones(map);
}

// Инициализация карты при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initializeMap();
    updateTime(); // Устанавливаем время обновления при загрузке
});