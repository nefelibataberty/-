// 广东省主要城市列表
const cities = ['广州市', '深圳市', '珠海市', '汕头市', '佛山市', '韶关市', '湛江市', '肇庆市', '江门市', '茂名市', '惠州市', '梅州市', '汕尾市', '河源市', '阳江市', '清远市', '东莞市', '中山市', '潮州市', '揭阳市', '云浮市'];
        
// 用于API请求的城市名（不带"市"字）
const citiesForApi = cities.map(city => city.replace('市', ''));

// 存储所有城市的天气数据
let weatherData = {};

// 初始化图表实例
const tempChart = echarts.init(document.getElementById('tempChart'));
const humidityChart = echarts.init(document.getElementById('humidityChart'));
const mapChart = echarts.init(document.getElementById('mapChart'));
const windChart = echarts.init(document.getElementById('windChart'));
const weatherChart = echarts.init(document.getElementById('weatherChart'));

// 获取单个城市天气数据
function fetchCityWeather(city) {
    return $.ajax({
        url: `https://wis.qq.com/weather/common?source=pc&weather_type=observe&province=广东&city=${city}`,
        type: 'get',
        dataType: 'jsonp'
    });
}

// 获取所有城市天气数据
async function getAllWeatherData() {
    for (let i = 0; i < citiesForApi.length; i++) {
        try {
            const response = await fetchCityWeather(citiesForApi[i]);
            if (response.status === 200) {
                weatherData[cities[i]] = response.data.observe;
            }
        } catch (error) {
            console.error(`获取${cities[i]}天气数据失败:`, error);
        }
    }
    updateCharts();
}

// 更新所有图表
function updateCharts() {
    updateTemperatureChart();
    updateHumidityChart();
    updateMapChart();
    updateWindChart();
    updateWeatherTypeChart();
}

// 温度柱状图
function updateTemperatureChart() {
    const option = {
        title: {
            text: '城市温度分布',
            textStyle: { color: '#fff' },
            left: 'center'
        },
        tooltip: {
            trigger: 'axis'
        },
        xAxis: {
            type: 'category',
            data: Object.keys(weatherData),
            axisLabel: {
                color: '#fff',
                rotate: 45
            }
        },
        yAxis: {
            type: 'value',
            name: '温度(℃)',
            axisLabel: { color: '#fff' }
        },
        series: [{
            data: Object.values(weatherData).map(data => parseInt(data.degree)),
            type: 'bar',
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                    offset: 0,
                    color: '#ffd85c'
                }, {
                    offset: 1,
                    color: '#ff9d45'
                }])
            }
        }]
    };
    tempChart.setOption(option);
}

// 湿度南丁格尔玫瑰图
function updateHumidityChart() {
    // 转换数据并按湿度值排序
    const data = Object.entries(weatherData)
        .map(([city, data]) => ({
            name: city,
            value: parseInt(data.humidity)
        }))
        .sort((a, b) => b.value - a.value);  
    
    const option = {
        title: {
            text: '城市湿度比较',
            textStyle: { color: '#fff' },
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c}%'
        },
        series: [{
            type: 'pie',
            roseType: 'area',    
            radius: ['20%', '60%'],
            center: ['50%', '50%'],
            itemStyle: {
                borderRadius: 4,
                borderColor: '#fff',
                borderWidth: 1
            },
            label: {
                color: '#fff',
                formatter: '{b}\n{c}%'
            },
            data: data,
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };
    humidityChart.setOption(option);
}

// 地图
async function updateMapChart() {
    const response = await fetch('./js/guangdong.json');
    const geoJson = await response.json();
    echarts.registerMap('guangdong', geoJson);
    
    const data = Object.entries(weatherData).map(([city, data]) => ({
        name: city,
        value: parseInt(data.degree)
    }));
    
    const option = {
        title: {
            text: '广东省天气地图',
            textStyle: { color: '#fff' },
            left: 'center'
        },
        tooltip: {
            trigger: 'item'
        },
        visualMap: {
            min: 0,
            max: 40,
            left: '5%',
            top: 'center',
            orient: 'vertical',
            inRange: {
                color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            },
            textStyle: {
                color: '#fff'
            }
        },
        series: [{
            name: '广东省天气',
            type: 'map',
            map: 'guangdong',
            itemStyle: {
                areaColor: '#323c48',
                borderColor: '#111'
            },
            emphasis: {
                label: {
                    show: true
                },
                itemStyle: {
                    areaColor: '#2a333d'
                }
            },
            data: data
        }]
    };
    mapChart.setOption(option);
}

// 风向雷达图
function updateWindChart() {
    const windDirections = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风'];
    const windCounts = new Array(8).fill(0);
    
    Object.values(weatherData).forEach(data => {
        const direction = data.wind_direction_name;
        const index = windDirections.indexOf(direction);
        if (index !== -1) {
            windCounts[index]++;
        }
    });
    
    const option = {
        title: {
            text: '风向分布',
            textStyle: { color: '#fff' },
            left: 'center'
        },
        radar: {
            radius: '60%', 
            indicator: windDirections.map(dir => ({ name: dir, max: cities.length })),
            axisName: {
                color: '#fff'
            }
        },
        series: [{
            type: 'radar',
            data: [{
                value: windCounts,
                name: '风向统计',
                areaStyle: {
                    color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                        {
                            color: 'rgba(86,171,248,0.6)',
                            offset: 0
                        },
                        {
                            color: 'rgba(86,171,248,0.2)',
                            offset: 1
                        }
                    ])
                }
            }]
        }]
    };
    windChart.setOption(option);
}

// 天气类型矩形树图
function updateWeatherTypeChart() {
    const weatherTypes = {};
    Object.entries(weatherData).forEach(([city, data]) => {
        if (!weatherTypes[data.weather]) {
            weatherTypes[data.weather] = {
                name: data.weather,
                value: 1,
                children: [{
                    name: city,
                    value: 1
                }]
            };
        } else {
            weatherTypes[data.weather].value += 1;
            weatherTypes[data.weather].children.push({
                name: city,
                value: 1
            });
        }
    });

    const option = {
        title: {
            text: '天气类型分布',
            textStyle: { color: '#fff' },
            left: 'center'
        },
        tooltip: {
            formatter: function(info) {
                const value = info.value;
                const name = info.name;
                if (info.data.children) {
                    return `${name}: ${value}个城市`;
                }
                return `${name}`;
            }
        },
        series: [{
            type: 'treemap',
            data: Object.values(weatherTypes),
            levels: [{
                itemStyle: {
                    borderColor: '#555',
                    borderWidth: 4,
                    gapWidth: 4
                }
            }, {
                itemStyle: {
                    borderColor: '#333',
                    borderWidth: 2,
                    gapWidth: 2
                }
            }],
            breadcrumb: {
                show: false
            },
            label: {
                color: '#fff'
            },
            upperLabel: {
                show: true,
                height: 30,
                color: '#fff'
            }
        }]
    };
    weatherChart.setOption(option);
}

window.addEventListener('resize', () => {
    tempChart.resize();
    humidityChart.resize();
    mapChart.resize();
    windChart.resize();
    weatherChart.resize();
});

getAllWeatherData();

setInterval(getAllWeatherData, 300000); 


function updateDate() {
    const now = new Date();
    const dateStr = now.getFullYear() + '年' + 
                   (now.getMonth() + 1) + '月' + 
                   now.getDate() + '日 ' + 
                   now.getHours().toString().padStart(2, '0') + ':' +
                   now.getMinutes().toString().padStart(2, '0') + ':' +
                   now.getSeconds().toString().padStart(2, '0');
    document.getElementById('dateDisplay').textContent = dateStr;
}

// 初始更新日期
updateDate();

// 每秒更新一次日期
setInterval(updateDate, 1000);