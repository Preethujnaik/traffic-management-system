from flask import Flask, render_template, request, redirect, url_for, session, jsonify, flash
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import json
import random
from datetime import datetime
from data_loader import load_vehicle_data, get_random_vehicles
from simulation import SimulationEngine, TrafficPredictor
import threading
import time
import numpy as np

app = Flask(__name__)
app.config.from_object('config.Config')

db = SQLAlchemy(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

# Initialize simulation engine and traffic predictor
simulation_engine = SimulationEngine()
traffic_predictor = TrafficPredictor()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            session['user_id'] = user.id
            session['username'] = user.username
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        confirm_password = request.form['confirm_password']
        
        # Validation
        if not username or not email or not password:
            flash('Please fill all fields', 'error')
            return render_template('register.html')
            
        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists', 'error')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists', 'error')
            return render_template('register.html')
        
        # Create new user
        new_user = User(username=username, email=email)
        new_user.set_password(password)
        
        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Registration successful! Please log in.', 'success')
            return redirect(url_for('login'))
        except Exception as e:
            db.session.rollback()
            flash('An error occurred during registration', 'error')
    
    return render_template('register.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        flash('Please log in to access this page', 'error')
        return redirect(url_for('login'))
    
    return render_template('dashboard.html', username=session['username'])

@app.route('/simulation')
def simulation():
    if 'user_id' not in session:
        flash('Please log in to access this page', 'error')
        return redirect(url_for('login'))
    
    return render_template('simulation.html')

@app.route('/get_vehicle_data')
def get_vehicle_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401
        
    vehicle_count = session.get('vehicle_count', 5) * 4  # 4 roads
    vehicles = get_random_vehicles(vehicle_count)
    
    # Update simulation engine configuration
    simulation_engine.update_config(
        session.get('vehicle_count', 5),
        session.get('ai_prediction', True),
        session.get('emergency_priority', True)
    )
    
    simulation_engine.set_vehicles(vehicles)
    return jsonify(vehicles)

@app.route('/start_simulation')
def start_simulation():
    simulation_engine.start()
    return jsonify({'status': 'started'})

@app.route('/stop_simulation')
def stop_simulation():
    simulation_engine.stop()
    return jsonify({'status': 'stopped'})

@app.route('/get_simulation_state')
def get_simulation_state():
    try:
        return jsonify(simulation_engine.get_state())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_simulation_stats')
def get_simulation_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401
        
    # Calculate statistics from simulation
    vehicles = simulation_engine.vehicles
    if vehicles:
        avg_speed = sum(v['speed'] for v in vehicles) / len(vehicles)
        avg_latency = sum(v.get('latency', 0) for v in vehicles) / len(vehicles)
        avg_signal = sum(v.get('signal_strength', 0) for v in vehicles) / len(vehicles)
    else:
        avg_speed, avg_latency, avg_signal = 0, 0, 0
        
    return jsonify({
        'active_vehicles': len(vehicles),
        'avg_speed': round(avg_speed, 1),
        'avg_latency': round(avg_latency, 1),
        'avg_signal': round(avg_signal, 1)
    })

@app.route('/update_config', methods=['POST'])
def update_config():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authorized'}), 401
        
    data = request.get_json()
    session['vehicle_count'] = int(data.get('vehicle_count', 5))
    session['ai_prediction'] = bool(data.get('ai_prediction', True))
    session['emergency_priority'] = bool(data.get('emergency_priority', True))
    
    return jsonify({'status': 'success'})

# Add vehicles to specific roads
@app.route('/add_vehicles_north')
def add_vehicles_north():
    simulation_engine.add_vehicles_to_road('north', 3)
    return jsonify({'status': 'vehicles added to north'})

@app.route('/add_vehicles_south')
def add_vehicles_south():
    simulation_engine.add_vehicles_to_road('south', 3)
    return jsonify({'status': 'vehicles added to south'})

@app.route('/add_vehicles_east')
def add_vehicles_east():
    simulation_engine.add_vehicles_to_road('east', 3)
    return jsonify({'status': 'vehicles added to east'})

@app.route('/add_vehicles_west')
def add_vehicles_west():
    simulation_engine.add_vehicles_to_road('west', 3)
    return jsonify({'status': 'vehicles added to west'})

# Add ambulance to specific roads with priority
@app.route('/add_ambulance_north')
def add_ambulance_north():
    simulation_engine.add_ambulance_with_priority('north')
    return jsonify({'status': 'ambulance added to north with priority'})

@app.route('/add_ambulance_south')
def add_ambulance_south():
    simulation_engine.add_ambulance_with_priority('south')
    return jsonify({'status': 'ambulance added to south with priority'})

@app.route('/add_ambulance_east')
def add_ambulance_east():
    simulation_engine.add_ambulance_with_priority('east')
    return jsonify({'status': 'ambulance added to east with priority'})

@app.route('/add_ambulance_west')
def add_ambulance_west():
    simulation_engine.add_ambulance_with_priority('west')
    return jsonify({'status': 'ambulance added to west with priority'})

@app.route('/clear_all_vehicles')
def clear_all_vehicles():
    simulation_engine.clear_all_vehicles()
    return jsonify({'status': 'all vehicles cleared'})

@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out', 'info')
    return redirect(url_for('index'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)