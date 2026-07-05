import time
import random
import threading
from datetime import datetime

class SimulationEngine:
    def __init__(self):
        self.is_running = False
        self.vehicles = []
        self.traffic_lights = {
            'north': 'green',
            'south': 'red',
            'east': 'red',
            'west': 'red'
        }
        self.events = []
        self.thread = None
        self.crosswalk_active = False
        self.emergency_active = False
        
    def start(self):
        if self.is_running:
            return
            
        self.is_running = True
        self.thread = threading.Thread(target=self.run)
        self.thread.daemon = True
        self.thread.start()
        
    def stop(self):
        self.is_running = False
        if self.thread:
            self.thread.join()
            
    def run(self):
        light_cycle = 0
        while self.is_running:
            # Update vehicle positions
            self.update_vehicles()
            
            # Cycle traffic lights every 10 iterations
            light_cycle += 1
            if light_cycle >= 10:
                self.cycle_traffic_lights()
                light_cycle = 0
                
            # Check for events
            self.check_events()
            
            time.sleep(0.1)
            
    def update_vehicles(self):
        for vehicle in self.vehicles:
            # Simple movement logic
            if vehicle['direction'] == 'north':
                vehicle['y'] -= vehicle['speed'] / 100
            elif vehicle['direction'] == 'south':
                vehicle['y'] += vehicle['speed'] / 100
            elif vehicle['direction'] == 'east':
                vehicle['x'] += vehicle['speed'] / 100
            elif vehicle['direction'] == 'west':
                vehicle['x'] -= vehicle['speed'] / 100
                
            # Wrap around when vehicles go off screen
            if vehicle['x'] < 0:
                vehicle['x'] = 1000
            if vehicle['x'] > 1000:
                vehicle['x'] = 0
            if vehicle['y'] < 0:
                vehicle['y'] = 1000
            if vehicle['y'] > 1000:
                vehicle['y'] = 0
                
    def cycle_traffic_lights(self):
        # Simple traffic light cycling
        if self.traffic_lights['north'] == 'green':
            self.traffic_lights['north'] = 'yellow'
        elif self.traffic_lights['north'] == 'yellow':
            self.traffic_lights['north'] = 'red'
            self.traffic_lights['east'] = 'green'
        elif self.traffic_lights['east'] == 'green':
            self.traffic_lights['east'] = 'yellow'
        elif self.traffic_lights['east'] == 'yellow':
            self.traffic_lights['east'] = 'red'
            self.traffic_lights['south'] = 'green'
        elif self.traffic_lights['south'] == 'green':
            self.traffic_lights['south'] = 'yellow'
        elif self.traffic_lights['south'] == 'yellow':
            self.traffic_lights['south'] = 'red'
            self.traffic_lights['west'] = 'green'
        elif self.traffic_lights['west'] == 'green':
            self.traffic_lights['west'] = 'yellow'
        elif self.traffic_lights['west'] == 'yellow':
            self.traffic_lights['west'] = 'red'
            self.traffic_lights['north'] = 'green'
            
        self.add_event('traffic_light_change', f'Traffic lights changed: {self.traffic_lights}')
        
    def check_events(self):
        # Check for collisions
        for i, v1 in enumerate(self.vehicles):
            for j, v2 in enumerate(self.vehicles[i+1:], i+1):
                dist = ((v1['x'] - v2['x'])**2 + (v1['y'] - v2['y'])**2)**0.5
                if dist < 20:  # Collision threshold
                    self.add_event('collision', f'Collision between {v1["id"]} and {v2["id"]}')
                    
        # Check if vehicles should stop at red lights
        for vehicle in self.vehicles:
            if self.should_stop_at_light(vehicle):
                vehicle['speed'] = 0
            else:
                vehicle['speed'] = vehicle['original_speed']
                
    def should_stop_at_light(self, vehicle):
        # Simple logic to determine if a vehicle should stop at a traffic light
        light = self.traffic_lights[vehicle['direction']]
        if light != 'green':
            # Check if vehicle is approaching the intersection
            if vehicle['direction'] == 'north' and vehicle['y'] < 510 and vehicle['y'] > 490:
                return True
            elif vehicle['direction'] == 'south' and vehicle['y'] > 490 and vehicle['y'] < 510:
                return True
            elif vehicle['direction'] == 'east' and vehicle['x'] > 490 and vehicle['x'] < 510:
                return True
            elif vehicle['direction'] == 'west' and vehicle['x'] < 510 and vehicle['x'] > 490:
                return True
        return False
        
    def add_event(self, event_type, message):
        self.events.append({
            'type': event_type,
            'message': message,
            'timestamp': datetime.now().strftime('%H:%M:%S')
        })
        # Keep only the last 50 events
        if len(self.events) > 50:
            self.events = self.events[-50:]
            
    def get_state(self):
        return {
            'vehicles': self.vehicles,
            'traffic_lights': self.traffic_lights,
            'events': self.events[-10:],  # Return only last 10 events
            'crosswalk_active': self.crosswalk_active,
            'emergency_active': self.emergency_active
        }
        
    def trigger_crosswalk_event(self):
        self.crosswalk_active = not self.crosswalk_active
        if self.crosswalk_active:
            self.add_event('crosswalk', 'Pedestrian detected at crosswalk! Vehicles alerted.')
            # Slow down vehicles near crosswalk
            for vehicle in self.vehicles:
                if (vehicle['direction'] in ['east', 'west'] and 
                    450 < vehicle['x'] < 550 and 
                    450 < vehicle['y'] < 550):
                    vehicle['speed'] = max(10, vehicle['speed'] * 0.5)
        else:
            self.add_event('crosswalk', 'Crosswalk clear. Vehicles resuming normal speed.')
            for vehicle in self.vehicles:
                vehicle['speed'] = vehicle['original_speed']
                
    def trigger_emergency_event(self):
        self.emergency_active = not self.emergency_active
        if self.emergency_active:
            self.add_event('emergency', 'Emergency vehicle approaching! Traffic signals adapting.')
            # Create an emergency vehicle
            emergency_vehicle = {
                'id': 'E001',
                'type': 'Ambulance',
                'speed': 80,
                'original_speed': 80,
                'x': 100,
                'y': 500,
                'direction': 'east',
                'communication_mode': 'V2I',
                'priority': 1,
                'signal_strength': -70,
                'allocated_bandwidth': 300,
                'latency': 10
            }
            self.vehicles.append(emergency_vehicle)
            
            # Change traffic lights to give priority
            self.traffic_lights = {'north': 'red', 'south': 'red', 'east': 'green', 'west': 'red'}
        else:
            self.add_event('emergency', 'Emergency passed. Traffic signals returning to normal.')
            # Remove emergency vehicle
            self.vehicles = [v for v in self.vehicles if v['id'] != 'E001']
            
    def trigger_collision_warning(self):
        # Find two vehicles that are close to each other
        if len(self.vehicles) >= 2:
            v1, v2 = random.sample(self.vehicles, 2)
            self.add_event('collision_warning', 
                          f'Collision warning between {v1["id"]} and {v2["id"]}! Taking evasive action.')
            # Slow down the vehicles
            v1['speed'] = max(10, v1['speed'] * 0.7)
            v2['speed'] = max(10, v2['speed'] * 0.7)
            
    def set_vehicles(self, vehicles):
        # Initialize vehicle positions and directions
        for vehicle in vehicles:
            # Assign random direction and position based on direction
            direction = random.choice(['north', 'south', 'east', 'west'])
            if direction == 'north':
                x = random.randint(400, 600)
                y = 1000
            elif direction == 'south':
                x = random.randint(400, 600)
                y = 0
            elif direction == 'east':
                x = 0
                y = random.randint(400, 600)
            else:  # west
                x = 1000
                y = random.randint(400, 600)
                
            vehicle['x'] = x
            vehicle['y'] = y
            vehicle['direction'] = direction
            vehicle['original_speed'] = vehicle['speed']
            
        self.vehicles = vehicles