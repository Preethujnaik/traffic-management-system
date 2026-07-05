import time
import random
import threading
from datetime import datetime
import numpy as np

# Traffic Predictor Class
class TrafficPredictor:
    def __init__(self):
        self.weights = np.array([0.05, 0.1])
        self.bias = 5.0
    
    def predict_arrival_time(self, speed, distance):
        features = np.array([speed, distance])
        prediction = self.bias + np.dot(self.weights, features)
        return max(1.0, prediction)

# Simulation Engine Class
class SimulationEngine:
    def __init__(self):
        self.is_running = False
        self.vehicles = []
        self.traffic_lights = {
            'north': 'red',
            'south': 'red',
            'east': 'green',
            'west': 'red'
        }
        self.events = []
        self.thread = None
        self.emergency_active = False
        self.ai_prediction = True
        self.emergency_priority = True
        self.vehicle_count_per_road = 5
        self.traffic_predictor = TrafficPredictor()
        self.green_duration = 15
        self.yellow_duration = 3
        self.last_light_change = time.time()
        self.ambulances = []
        
    def update_config(self, vehicle_count, ai_prediction, emergency_priority):
        self.vehicle_count_per_road = vehicle_count
        self.ai_prediction = ai_prediction
        self.emergency_priority = emergency_priority
        
    def start(self):
        if self.is_running:
            return
            
        self.is_running = True
        self.thread = threading.Thread(target=self.run)
        self.thread.daemon = True
        self.thread.start()
        self.last_light_change = time.time()
        
    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join()
            
    def run(self):
        light_cycle = 0
        
        while self.is_running:
            # Update vehicle positions
            self.update_vehicles()
            
            # Handle traffic light timing (only if no emergency)
            if not self.emergency_active:
                current_time = time.time()
                elapsed_time = current_time - self.last_light_change
                
                current_green = self.get_green_light_direction()
                if current_green:
                    if elapsed_time >= self.green_duration:
                        self.traffic_lights[current_green] = 'yellow'
                        self.last_light_change = current_time
                        self.add_event('traffic_light_change', 
                                      f'{current_green.capitalize()} light changed to yellow')
                    elif (self.traffic_lights[current_green] == 'yellow' and 
                          elapsed_time >= self.yellow_duration):
                        self.cycle_to_next_light()
                
            # Check for collisions
            self.check_collisions()
            
            time.sleep(0.1)
    
    def update_vehicles(self):
        for vehicle in self.vehicles:
            # Skip if vehicle is stopped at red light (unless it's an ambulance)
            if vehicle.get('stopped', False) and vehicle['type'] != 'Ambulance':
                vehicle['status'] = 'stopped'
                vehicle['statusReason'] = 'Red traffic light'
                continue
                
            # Reset status if vehicle was previously stopped
            if vehicle.get('status') == 'stopped' and vehicle['speed'] > 0:
                vehicle['status'] = 'moving'
                vehicle['statusReason'] = 'Green light - proceeding'
                
            # Movement logic
            speed_factor = vehicle['speed'] / 50
            
            # Ambulances move faster
            if vehicle['type'] == 'Ambulance':
                speed_factor *= 1.5
            
            if vehicle['direction'] == 'north':
                vehicle['y'] -= speed_factor
            elif vehicle['direction'] == 'south':
                vehicle['y'] += speed_factor
            elif vehicle['direction'] == 'east':
                vehicle['x'] += speed_factor
            elif vehicle['direction'] == 'west':
                vehicle['x'] -= speed_factor
                
            # Remove vehicles that go off screen
            if (vehicle['x'] < -50 or vehicle['x'] > 1050 or 
                vehicle['y'] < -50 or vehicle['y'] > 1050):
                if vehicle in self.vehicles:
                    if vehicle['type'] == 'Ambulance' and vehicle in self.ambulances:
                        self.ambulances.remove(vehicle)
                    self.vehicles.remove(vehicle)
                continue
                
            # Check if vehicle should stop at red light
            if self.should_stop_at_light(vehicle) and vehicle['type'] != 'Ambulance':
                vehicle['speed'] = 0
                vehicle['stopped'] = True
                vehicle['status'] = 'stopped'
                vehicle['statusReason'] = 'Red traffic light'
            else:
                vehicle['speed'] = vehicle['original_speed']
                vehicle['stopped'] = False
                if vehicle['type'] != 'Ambulance':
                    vehicle['status'] = 'moving'
                    vehicle['statusReason'] = 'Clear road ahead'
    
    def cycle_to_next_light(self):
        directions = ['north', 'east', 'south', 'west']
        current_green = self.get_green_light_direction()
        
        if current_green:
            current_index = directions.index(current_green)
            next_index = (current_index + 1) % 4
            next_direction = directions[next_index]
            
            for direction in directions:
                self.traffic_lights[direction] = 'red'
            
            self.traffic_lights[next_direction] = 'green'
            self.last_light_change = time.time()
            
            self.add_event('traffic_light_change', 
                          f'Traffic lights cycled to {next_direction.capitalize()} green')
    
    def check_collisions(self):
        for i, v1 in enumerate(self.vehicles):
            for j, v2 in enumerate(self.vehicles[i+1:], i+1):
                dist = ((v1['x'] - v2['x'])**2 + (v1['y'] - v2['y'])**2)**0.5
                
                if dist < 25:
                    if v1['speed'] > 0 or v2['speed'] > 0:
                        self.add_event('collision_warning', 
                                      f'Collision warning between {v1["id"]} and {v2["id"]}!')
                        
                        if v1['type'] != 'Ambulance':
                            v1['speed'] = max(0, v1['speed'] * 0.3)
                        if v2['type'] != 'Ambulance':
                            v2['speed'] = max(0, v2['speed'] * 0.3)
                
                if dist < 15:
                    self.add_event('collision', 
                                  f'Collision between {v1["id"]} and {v2["id"]}!')
                    if v1['type'] != 'Ambulance':
                        v1['speed'] = 0
                        v1['stopped'] = True
                    if v2['type'] != 'Ambulance':
                        v2['speed'] = 0
                        v2['stopped'] = True
    
    def should_stop_at_light(self, vehicle):
        if vehicle['type'] == 'Ambulance':
            return False
            
        direction = vehicle['direction']
        light_state = self.traffic_lights[direction]
        
        if light_state == 'green':
            return False
            
        if direction == 'north':
            distance_to_intersection = vehicle['y'] - 500
            approaching = distance_to_intersection > 0 and distance_to_intersection < 100
        elif direction == 'south':
            distance_to_intersection = 500 - vehicle['y']
            approaching = distance_to_intersection > 0 and distance_to_intersection < 100
        elif direction == 'east':
            distance_to_intersection = vehicle['x'] - 500
            approaching = distance_to_intersection > 0 and distance_to_intersection < 100
        else:
            distance_to_intersection = 500 - vehicle['x']
            approaching = distance_to_intersection > 0 and distance_to_intersection < 100
            
        return approaching and light_state != 'green'
        
    def add_event(self, event_type, message):
        self.events.append({
            'type': event_type,
            'message': message,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        })
        if len(self.events) > 50:
            self.events = self.events[-50:]
            
    def get_state(self):
        return {
            'vehicles': self.vehicles,
            'traffic_lights': self.traffic_lights,
            'events': self.events[-10:],
            'emergency_active': self.emergency_active
        }
        
    def set_vehicles(self, vehicles):
        vehicles = vehicles[:self.vehicle_count_per_road * 4]
        directions = ['north', 'south', 'east', 'west']
        
        for i, vehicle in enumerate(vehicles):
            direction = directions[i % 4]
            
            if direction == 'north':
                x = random.randint(400, 600)
                y = random.randint(600, 1000)
            elif direction == 'south':
                x = random.randint(400, 600)
                y = random.randint(0, 400)
            elif direction == 'east':
                x = random.randint(0, 400)
                y = random.randint(400, 600)
            else:
                x = random.randint(600, 1000)
                y = random.randint(400, 600)
                
            vehicle['x'] = x
            vehicle['y'] = y
            vehicle['direction'] = direction
            vehicle['original_speed'] = vehicle['speed']
            vehicle['stopped'] = False
            vehicle['status'] = 'moving'
            vehicle['statusReason'] = 'Clear road ahead'
            
        self.vehicles = vehicles
        self.ambulances = [v for v in self.vehicles if v['type'] == 'Ambulance']
    
    def get_green_light_direction(self):
        for direction, state in self.traffic_lights.items():
            if state == 'green':
                return direction
        return None

    def add_vehicles_to_road(self, direction, count=3):
        """Add regular vehicles to a specific road"""
        vehicle_types = ['Sedan', 'SUV', 'Motorcycle', 'Truck', 'Bus']
        
        for i in range(count):
            vehicle = {
                'id': f'V{len(self.vehicles):03d}',
                'type': random.choice(vehicle_types),
                'speed': random.randint(40, 80),
                'communication_mode': random.choice(['V2V', 'V2I', 'V2X']),
                'slice_type': random.choice(['eMBB', 'URLLC', 'mMTC']),
                'signal_strength': random.randint(-90, -60),
                'allocated_bandwidth': random.randint(100, 300),
                'latency': random.randint(10, 50)
            }
            
            if direction == 'north':
                vehicle['x'] = random.randint(400, 600)
                vehicle['y'] = random.randint(700, 900)
            elif direction == 'south':
                vehicle['x'] = random.randint(400, 600)
                vehicle['y'] = random.randint(100, 300)
            elif direction == 'east':
                vehicle['x'] = random.randint(100, 300)
                vehicle['y'] = random.randint(400, 600)
            else:
                vehicle['x'] = random.randint(700, 900)
                vehicle['y'] = random.randint(400, 600)
                
            vehicle['direction'] = direction
            vehicle['original_speed'] = vehicle['speed']
            vehicle['stopped'] = False
            vehicle['status'] = 'moving'
            vehicle['statusReason'] = 'Added to road'
            
            self.vehicles.append(vehicle)
        
        self.add_event('vehicles_added', f'Added {count} vehicles to {direction} road')

    def add_ambulance_with_priority(self, direction):
        """Add ambulance to a road and give it priority"""
        ambulance = {
            'id': f'AMB{len(self.ambulances):03d}',
            'type': 'Ambulance',
            'speed': 80,
            'original_speed': 80,
            'direction': direction,
            'communication_mode': 'V2I',
            'slice_type': 'URLLC',
            'signal_strength': -70,
            'allocated_bandwidth': 300,
            'latency': 10,
            'status': 'emergency',
            'statusReason': 'Emergency response - priority routing',
            'stopped': False
        }
        
        # Position ambulance
        if direction == 'north':
            ambulance['x'] = random.randint(400, 600)
            ambulance['y'] = random.randint(700, 900)
        elif direction == 'south':
            ambulance['x'] = random.randint(400, 600)
            ambulance['y'] = random.randint(100, 300)
        elif direction == 'east':
            ambulance['x'] = random.randint(100, 300)
            ambulance['y'] = random.randint(400, 600)
        else:
            ambulance['x'] = random.randint(700, 900)
            ambulance['y'] = random.randint(400, 600)
            
        self.vehicles.append(ambulance)
        self.ambulances.append(ambulance)
        
        # Give priority to this direction
        self.give_priority_to_direction(direction)
        
        self.add_event('ambulance_added', 
                      f'Ambulance {ambulance["id"]} added to {direction} road with priority')

    def give_priority_to_direction(self, direction):
        """Give traffic light priority to a specific direction"""
        self.emergency_active = True
        
        # Set all lights to red except the priority direction
        for d in self.traffic_lights:
            self.traffic_lights[d] = 'red'
        self.traffic_lights[direction] = 'green'
        
        self.last_light_change = time.time()
        
        # Stop all vehicles not in the priority direction
        for vehicle in self.vehicles:
            if vehicle['direction'] != direction and vehicle['type'] != 'Ambulance':
                vehicle['speed'] = 0
                vehicle['stopped'] = True
                vehicle['status'] = 'stopped'
                vehicle['statusReason'] = f'Giving way to {direction} priority'
        
        self.add_event('priority_given', 
                      f'Priority given to {direction} direction. Other vehicles stopped.')

    def clear_all_vehicles(self):
        """Remove all vehicles from the simulation"""
        self.vehicles.clear()
        self.ambulances.clear()
        self.emergency_active = False
        self.add_event('vehicles_cleared', 'All vehicles removed from simulation')