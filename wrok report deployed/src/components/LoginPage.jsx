import React, { useState, useRef } from 'react';
import { api } from '../api';
import './LoginPage.css';
import logo from '../assets/laserexperts.png';

const LoginPage = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [department, setDepartment] = useState('');
    const [photo, setPhoto] = useState(null);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("Profile picture must be smaller than 2MB");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isRegistering) {
                await api.register({
                    email,
                    password,
                    name,
                    department,
                    photo
                });
                alert('Registration successful! Please sign in.');
                setIsRegistering(false);
                setPassword('');
            } else {
                const { token, user } = await api.login(email, password);
                
                // Store token for API requests
                localStorage.setItem('work_report_token', token);
                
                onLogin(user, rememberMe);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-glass-card">
                <div className="login-header">
                    <img src={logo} alt="Laser Experts" className="login-logo" />
                    <div className="login-title">
                        LEI <span className="accent-text">Report</span> Portal
                    </div>
                    <p className="login-subtitle">
                        {isRegistering ? 'Create your professional account' : 'Access your professional dashboard'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {isRegistering && (
                        <div className="registration-fields animate-fade-in">
                            <div className="photo-upload-section">
                                <div 
                                    className="profile-preview" 
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ backgroundImage: photo ? `url(${photo})` : 'none' }}
                                >
                                    {!photo && <span className="add-photo-icon">+</span>}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handlePhotoUpload} 
                                />
                                <p className="photo-label">Profile Picture (Optional)</p>
                            </div>

                            <div className="input-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. John Doe"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label>Department</label>
                                <input
                                    type="text"
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    placeholder="e.g. Sales, Engineering"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter Password"
                            required
                        />
                    </div>

                    {!isRegistering && (
                        <div className="remember-me-container animate-fade-in">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe} 
                                    onChange={(e) => setRememberMe(e.target.checked)} 
                                />
                                <span className="checkbox-text">Remember Me</span>
                            </label>
                        </div>
                    )}

                    {error && <div className="login-error animate-shake">{error}</div>}

                    <button type="submit" className="login-button">
                        {isRegistering ? 'Create Account' : 'Sign In'}
                    </button>
                    
                    <button 
                        type="button" 
                        className="mode-toggle-btn"
                        onClick={() => {
                            setIsRegistering(!isRegistering);
                            setError('');
                        }}
                    >
                        {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
                    </button>
                </form>

                <div className="login-footer">
                    <p>© 2026 LEI Professional Services</p>
                    <div className="login-support">
                        <span>Support:</span>
                        <a href="tel:8807717916">8807717916</a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
