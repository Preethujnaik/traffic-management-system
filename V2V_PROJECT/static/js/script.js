class Simulation {
    constructor() {
        this.canvas = document.getElementById('simulation-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.vehicles = [];
        this.trafficLights = {
            north: 'red',
            south: 'red',
            east: 'green',
            west: 'red'
        };
        this.events = [];
        this.animationId = null;
        this.isRunning = false;
        this.emergencyActive = false;
        
        this.vehicleImages = {};
        this.loadImages();
        
        this.initEventListeners();
        this.getInitialVehicles();
    }
    
    loadImages() {
        const types = ['Motorcycle', 'Sedan', 'SUV', 'Truck', 'Ambulance', 'Bus'];
        types.forEach(type => {
            const img = new Image();
            img.onerror = () => {
                console.log(`Image for ${type} not found, using colored rectangle`);
            };
            img.src = `/static/images/vehicles/${type.toLowerCase()}.png`;
            this.vehicleImages[type] = img;
        });
        
        this.trafficLightImages = {
            red: new Image(), yellow: new Image(), green: new Image()
        };
        
        Object.keys(this.trafficLightImages).forEach(color => {
            this.trafficLightImages[color].onerror = () => {
                console.log(`Traffic light image for ${color} not found`);
            };
            this.trafficLightImages[color].src = `/static/images/traffic_elements/${color}_light.png`;
        });
    }
    
    initEventListeners() {
        // Simulation control buttons
        document.getElementById('start-btn').addEventListener('click', () => this.startSimulation());
        document.getElementById('stop-btn').addEventListener('click', () => this.stopSimulation());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAllVehicles());
        
        // Add vehicles buttons
        document.getElementById('add-north-btn').addEventListener('click', () => this.addVehiclesNorth());
        document.getElementById('add-south-btn').addEventListener('click', () => this.addVehiclesSouth());
        document.getElementById('add-east-btn').addEventListener('click', () => this.addVehiclesEast());
        document.getElementById('add-west-btn').addEventListener('click', () => this.addVehiclesWest());
        
        // Add ambulance buttons
        document.getElementById('ambulance-north-btn').addEventListener('click', () => this.addAmbulanceNorth());
        document.getElementById('ambulance-south-btn').addEventListener('click', () => this.addAmbulanceSouth());
        document.getElementById('ambulance-east-btn').addEventListener('click', () => this.addAmbulanceEast());
        document.getElementById('ambulance-west-btn').addEventListener('click', () => this.addAmbulanceWest());
        
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.selectVehicle(x, y);
        });
    }
    
    async getInitialVehicles() {
        try {
            const response = await fetch('/get_vehicle_data?count=20');
            const vehicles = await response.json();
            this.setVehicles(vehicles);
        } catch (error) {
            console.error('Error fetching vehicle data:', error);
            this.createFallbackVehicles();
        }
    }
    
    createFallbackVehicles() {
        const vehicleTypes = ['Sedan', 'SUV', 'Motorcycle', 'Truck', 'Bus'];
        const directions = ['north', 'south', 'east', 'west'];
        
        for (let i = 0; i < 12; i++) {
            const vehicle = {
                id: `V${i.toString().padStart(3, '0')}`,
                type: vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)],
                speed: Math.random() * 70 + 30,
                communication_mode: ['V2V', 'V2I', 'V2X'][Math.floor(Math.random() * 3)],
                slice_type: ['eMBB', 'URLLC', 'mMTC'][Math.floor(Math.random() * 3)],
                signal_strength: Math.random() * -30 - 60,
                allocated_bandwidth: Math.random() * 200 + 100,
                latency: Math.random() * 50 + 10
            };
            
            const direction = directions[i % 4];
            let x, y;
            
            if (direction === 'north') {
                x = Math.random() * 200 + 400;
                y = 800 + Math.random() * 100;
            } else if (direction === 'south') {
                x = Math.random() * 200 + 400;
                y = 100 - Math.random() * 100;
            } else if (direction === 'east') {
                x = 100 - Math.random() * 100;
                y = Math.random() * 200 + 400;
            } else {
                x = 800 + Math.random() * 100;
                y = Math.random() * 200 + 400;
            }
            
            vehicle.x = x;
            vehicle.y = y;
            vehicle.direction = direction;
            vehicle.originalSpeed = vehicle.speed;
            vehicle.status = 'moving';
            vehicle.statusReason = 'Clear road ahead';
            
            this.vehicles.push(vehicle);
        }
    }
    
    setVehicles(vehicles) {
        this.vehicles = vehicles.map(vehicle => {
            const direction = ['north', 'south', 'east', 'west'][Math.floor(Math.random() * 4)];
            let x, y;
            
            if (direction === 'north') {
                x = Math.random() * 200 + 400;
                y = 800 + Math.random() * 100;
            } else if (direction === 'south') {
                x = Math.random() * 200 + 400;
                y = 100 - Math.random() * 100;
            } else if (direction === 'east') {
                x = 100 - Math.random() * 100;
                y = Math.random() * 200 + 400;
            } else {
                x = 800 + Math.random() * 100;
                y = Math.random() * 200 + 400;
            }
            
            return {
                ...vehicle,
                x,
                y,
                direction,
                originalSpeed: vehicle.speed,
                status: 'moving',
                statusReason: 'Clear road ahead'
            };
        });
    }
    
    async startSimulation() {
        if (this.isRunning) return;
        
        try {
            const response = await fetch('/start_simulation');
            if (!response.ok) throw new Error('Network response was not ok');
            
            this.isRunning = true;
            document.getElementById('start-btn').disabled = true;
            document.getElementById('stop-btn').disabled = false;
            this.animate();
            this.pollSimulationState();
        } catch (error) {
            console.error('Error starting simulation:', error);
            alert('Error starting simulation: ' + error.message);
        }
    }
    
    async stopSimulation() {
        if (!this.isRunning) return;
        
        try {
            const response = await fetch('/stop_simulation');
            if (!response.ok) throw new Error('Network response was not ok');
            
            this.isRunning = false;
            document.getElementById('start-btn').disabled = false;
            document.getElementById('stop-btn').disabled = true;
            cancelAnimationFrame(this.animationId);
        } catch (error) {
            console.error('Error stopping simulation:', error);
            alert('Error stopping simulation: ' + error.message);
        }
    }
    
    async clearAllVehicles() {
        try {
            const response = await fetch('/clear_all_vehicles');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('All vehicles cleared');
        } catch (error) {
            console.error('Error clearing vehicles:', error);
            alert('Error clearing vehicles: ' + error.message);
        }
    }
    
    async addVehiclesNorth() {
        try {
            const response = await fetch('/add_vehicles_north');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Vehicles added to north');
        } catch (error) {
            console.error('Error adding vehicles to north:', error);
            alert('Error adding vehicles: ' + error.message);
        }
    }
    
    async addVehiclesSouth() {
        try {
            const response = await fetch('/add_vehicles_south');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Vehicles added to south');
        } catch (error) {
            console.error('Error adding vehicles to south:', error);
            alert('Error adding vehicles: ' + error.message);
        }
    }
    
    async addVehiclesEast() {
        try {
            const response = await fetch('/add_vehicles_east');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Vehicles added to east');
        } catch (error) {
            console.error('Error adding vehicles to east:', error);
            alert('Error adding vehicles: ' + error.message);
        }
    }
    
    async addVehiclesWest() {
        try {
            const response = await fetch('/add_vehicles_west');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Vehicles added to west');
        } catch (error) {
            console.error('Error adding vehicles to west:', error);
            alert('Error adding vehicles: ' + error.message);
        }
    }
    
    async addAmbulanceNorth() {
        try {
            const response = await fetch('/add_ambulance_north');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Ambulance added to north with priority');
        } catch (error) {
            console.error('Error adding ambulance to north:', error);
            alert('Error adding ambulance: ' + error.message);
        }
    }
    
    async addAmbulanceSouth() {
        try {
            const response = await fetch('/add_ambulance_south');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Ambulance added to south with priority');
        } catch (error) {
            console.error('Error adding ambulance to south:', error);
            alert('Error adding ambulance: ' + error.message);
        }
    }
    
    async addAmbulanceEast() {
        try {
            const response = await fetch('/add_ambulance_east');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Ambulance added to east with priority');
        } catch (error) {
            console.error('Error adding ambulance to east:', error);
            alert('Error adding ambulance: ' + error.message);
        }
    }
    
    async addAmbulanceWest() {
        try {
            const response = await fetch('/add_ambulance_west');
            if (!response.ok) throw new Error('Network response was not ok');
            console.log('Ambulance added to west with priority');
        } catch (error) {
            console.error('Error adding ambulance to west:', error);
            alert('Error adding ambulance: ' + error.message);
        }
    }
    
    async pollSimulationState() {
        if (!this.isRunning) return;
        
        try {
            const response = await fetch('/get_simulation_state');
            if (!response.ok) throw new Error('Network response was not ok');
            const state = await response.json();
            
            this.updateFromState(state);
            setTimeout(() => this.pollSimulationState(), 1000);
        } catch (error) {
            console.error('Error polling simulation state:', error);
            setTimeout(() => this.pollSimulationState(), 2000);
        }
    }
    
    updateFromState(state) {
        if (state.vehicles) this.vehicles = state.vehicles;
        if (state.traffic_lights) this.trafficLights = state.traffic_lights;
        if (state.events) this.events = state.events;
        if (state.emergency_active !== undefined) this.emergencyActive = state.emergency_active;
        
        this.updateTrafficLightsDisplay();
        this.updateEventsDisplay();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.draw();
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawRoads();
        this.drawVehicles();
        this.drawTrafficLights();
        this.drawIntersection();
    }
    
    drawRoads() {
        this.ctx.fillStyle = '#5d6d7e';
        this.ctx.fillRect(400, 0, 200, 1000);
        this.ctx.fillRect(0, 400, 1000, 200);
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([30, 20]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(500, 0);
        this.ctx.lineTo(500, 1000);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 500);
        this.ctx.lineTo(1000, 500);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
    }
    
    drawIntersection() {
        this.ctx.fillStyle = '#7f8c8d';
        this.ctx.fillRect(400, 400, 200, 200);
        
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(420, 480);
        this.ctx.lineTo(580, 480);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(420, 520);
        this.ctx.lineTo(580, 520);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(520, 420);
        this.ctx.lineTo(520, 580);
        this.ctx.stroke();
        
        this.ctx.beginPath();
        this.ctx.moveTo(480, 420);
        this.ctx.lineTo(480, 580);
        this.ctx.stroke();
    }
    
    drawVehicles() {
        this.vehicles.forEach(vehicle => {
            const img = this.vehicleImages[vehicle.type];
            const width = 45;
            const height = 25;
            
            this.ctx.save();
            this.ctx.translate(vehicle.x, vehicle.y);
            
            if (vehicle.direction === 'north') {
                this.ctx.rotate(Math.PI);
            } else if (vehicle.direction === 'east') {
                this.ctx.rotate(Math.PI / 2);
            } else if (vehicle.direction === 'west') {
                this.ctx.rotate(-Math.PI / 2);
            }
            
            this.ctx.fillStyle = this.getVehicleColor(vehicle.type);
            this.ctx.fillRect(-width/2, -height/2, width, height);
            
            if (img && img.complete) {
                this.ctx.drawImage(img, -width/2, -height/2, width, height);
            } else {
                this.ctx.fillStyle = 'white';
                this.ctx.font = '8px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(vehicle.id.substring(0, 4), 0, 0);
            }
            
            if (vehicle.type === 'Ambulance') {
                this.ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? 'red' : 'blue';
                this.ctx.fillRect(-width/2 + 2, -height/2 + 2, 6, 4);
                this.ctx.fillRect(width/2 - 8, -height/2 + 2, 6, 4);
            }
            
            this.ctx.restore();
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(vehicle.x - 30, vehicle.y - 40, 60, 16);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`${vehicle.id}: ${Math.round(vehicle.speed)} km/h`, vehicle.x, vehicle.y - 30);
            
            if (vehicle.speed === 0 || vehicle.status !== 'moving') {
                this.ctx.fillStyle = this.getStatusColor(vehicle.status);
                this.ctx.fillRect(vehicle.x - 35, vehicle.y - 60, 70, 15);
                
                this.ctx.fillStyle = 'white';
                this.ctx.font = '8px Arial';
                this.ctx.fillText(vehicle.statusReason || vehicle.status, vehicle.x, vehicle.y - 50);
            }
        });
    }
    
    getVehicleColor(type) {
        const colors = {
            'Motorcycle': '#e74c3c',
            'Sedan': '#3498db',
            'SUV': '#2ecc71',
            'Truck': '#f39c12',
            'Ambulance': '#ff0000',
            'Bus': '#9b59b6'
        };
        return colors[type] || '#95a5a6';
    }
    
    getStatusColor(status) {
        const colors = {
            'stopped': 'rgba(231, 76, 60, 0.8)',
            'emergency': 'rgba(192, 57, 43, 0.8)',
            'moving': 'rgba(46, 204, 113, 0.8)'
        };
        return colors[status] || 'rgba(149, 165, 166, 0.8)';
    }
    
    drawTrafficLights() {
        this.drawTrafficLight(500, 350, this.trafficLights.north, 'north');
        this.drawTrafficLight(500, 650, this.trafficLights.south, 'south');
        this.drawTrafficLight(350, 500, this.trafficLights.east, 'east');
        this.drawTrafficLight(650, 500, this.trafficLights.west, 'west');
    }
    
    drawTrafficLight(x, y, color, direction) {
        const img = this.trafficLightImages[color];
        const size = 25;
        
        this.ctx.save();
        this.ctx.translate(x, y);
        
        if (direction === 'north') {
            this.ctx.rotate(Math.PI);
        } else if (direction === 'east') {
            this.ctx.rotate(-Math.PI / 2);
        } else if (direction === 'west') {
            this.ctx.rotate(Math.PI / 2);
        }
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(-3, -size/2, 6, size + 10);
        
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(-size/2, -size/2, size, size * 1.5);
        
        if (img && img.complete) {
            this.ctx.drawImage(img, -size/2, -size/2, size, size);
        } else {
            const colors = ['red', 'yellow', 'green'];
            const radius = size / 6;
            
            colors.forEach((lightColor, index) => {
                this.ctx.beginPath();
                this.ctx.arc(0, -size/4 + index * radius * 2.5, radius, 0, Math.PI * 2);
                
                if (lightColor === color) {
                    this.ctx.fillStyle = lightColor;
                    this.ctx.fill();
                    this.ctx.shadowColor = lightColor;
                    this.ctx.shadowBlur = 10;
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                } else {
                    this.ctx.fillStyle = this.darkenColor(lightColor, 0.7);
                    this.ctx.fill();
                }
                
                this.ctx.strokeStyle = '#2c3e50';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            });
        }
        
        this.ctx.restore();
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(direction.toUpperCase(), x, y + 25);
    }
    
    darkenColor(color, factor) {
        const colorMap = {
            'red': '#7b241c',
            'yellow': '#7d6608',
            'green': '#186a3b'
        };
        return colorMap[color] || color;
    }
    
    selectVehicle(x, y) {
        let selectedVehicle = null;
        let minDistance = Infinity;
        
        this.vehicles.forEach(vehicle => {
            const dx = vehicle.x - x;
            const dy = vehicle.y - y;
            const distance = Math.sqrt(dx*dx + dy*dy);
            
            if (distance < 30 && distance < minDistance) {
                minDistance = distance;
                selectedVehicle = vehicle;
            }
        });
        
        if (selectedVehicle) {
            this.displayVehicleInfo(selectedVehicle);
            this.highlightVehicle(selectedVehicle);
        }
    }
    
    highlightVehicle(vehicle) {
        this.ctx.strokeStyle = '#f39c12';
        this.ctx.lineWidth = 3;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.arc(vehicle.x, vehicle.y, 35, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }
    
    displayVehicleInfo(vehicle) {
        const infoDiv = document.getElementById('vehicle-info');
        
        infoDiv.innerHTML = `
            <div class="vehicle-details">
                <h4>🚗 Vehicle ${vehicle.id}</h4>
                <div class="detail-row">
                    <span class="label">Type:</span>
                    <span class="value">${vehicle.type}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Speed:</span>
                    <span class="value">${Math.round(vehicle.speed)} km/h</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value status-${vehicle.status.replace(' ', '-')}">${vehicle.status}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Reason:</span>
                    <span class="value">${vehicle.statusReason || 'Normal operation'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Direction:</span>
                    <span class="value">${vehicle.direction}</span>
                </div>
            </div>
        `;
    }
    
    updateTrafficLightsDisplay() {
        for (const [direction, color] of Object.entries(this.trafficLights)) {
            const element = document.getElementById(`${direction}-light`);
            if (element) {
                element.textContent = color.charAt(0).toUpperCase() + color.slice(1);
                element.setAttribute('data-color', color);
                
                if (this.emergencyActive && color === 'green') {
                    element.style.boxShadow = '0 0 10px #ff0000';
                    element.style.animation = 'pulse 1s infinite';
                } else {
                    element.style.boxShadow = 'none';
                    element.style.animation = 'none';
                }
            }
        }
    }
    
    updateEventsDisplay() {
        const eventsList = document.getElementById('events-list');
        
        if (this.events.length === 0) {
            eventsList.innerHTML = '<p class="no-events">No events yet. Start the simulation to see events.</p>';
            return;
        }
        
        eventsList.innerHTML = this.events.map(event => `
            <div class="event-item event-${event.type}">
                <div class="event-time">${event.timestamp}</div>
                <div class="event-type">${event.type.toUpperCase()}</div>
                <div class="event-message">${event.message}</div>
            </div>
        `).join('');
        
        eventsList.scrollTop = eventsList.scrollHeight;
    }
}

// Initialize simulation when page loads
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
        }
        
        .event-emergency, .event-ambulance_added, .event-priority_given {
            border-left: 4px solid #e74c3c;
            background: #fadbd8;
        }
        
        .event-vehicles_added {
            border-left: 4px solid #3498db;
            background: #d6eaf8;
        }
        
        .status-emergency {
            color: #e74c3c;
            font-weight: bold;
        }
        
        .status-stopped {
            color: #c0392b;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
    
    window.simulation = new Simulation();
    document.getElementById('stop-btn').disabled = true;
});

// Handle page cleanup
window.addEventListener('beforeunload', function() {
    if (window.simulation && window.simulation.isRunning) {
        window.simulation.stopSimulation();
    }
});