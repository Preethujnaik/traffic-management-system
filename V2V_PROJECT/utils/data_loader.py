import pandas as pd
import random
import json

def load_vehicle_data():
    # Sample vehicle data based on your dataset structure
    vehicles = []
    vehicle_types = ['Motorcycle', 'Sedan', 'SUV', 'Truck', 'Ambulance', 'Bus']
    communication_modes = ['V2V', 'V2I', 'V2X']
    slice_types = ['eMBB', 'URLLC', 'mMTC']
    weather_conditions = ['Clear', 'Rain', 'Snow', 'Fog']
    times_of_day = ['Morning', 'Afternoon', 'Evening', 'Night']
    
    for i in range(100):
        vehicle = {
            'id': f'V{i:03d}',
            'type': random.choice(vehicle_types),
            'speed': random.randint(30, 120),
            'position_x': random.randint(0, 1000),
            'position_y': random.randint(0, 1000),
            'priority': random.randint(0, 1),
            'communication_mode': random.choice(communication_modes),
            'slice_type': random.choice(slice_types),
            'allocated_bandwidth': random.randint(30, 300),
            'latency': random.randint(10, 100),
            'energy_consumption': random.randint(20, 50),
            'ai_optimization_score': round(random.uniform(0.7, 0.99), 3),
            'congestion_level': random.randint(1, 10),
            'signal_strength': random.randint(-90, -60),
            'traffic_density': random.randint(1, 100),
            'weather_condition': random.choice(weather_conditions),
            'throughput': random.randint(50, 200),
            'time_of_day': random.choice(times_of_day)
        }
        vehicles.append(vehicle)
    
    return vehicles

def get_random_vehicles(count=10):
    all_vehicles = load_vehicle_data()
    return random.sample(all_vehicles, min(count, len(all_vehicles)))