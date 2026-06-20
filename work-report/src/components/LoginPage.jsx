import React, { useState, useRef, useEffect } from 'react';
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

    // Initialize Google GSI Client Sign-In on mount
    useEffect(() => {
        const initGoogleSignIn = () => {
            if (window.google && google.accounts && google.accounts.id) {
                google.accounts.id.initialize({
                    client_id: '1014113880303-fco3csrmb627vc5d7rq76emmd71rjteq.apps.googleusercontent.com',
                    callback: handleGoogleResponse
                });
                google.accounts.id.renderButton(
                    document.getElementById('google-btn-container-report'),
                    { theme: 'outline', size: 'large', width: '100%' }
                );
            }
        };

        if (!document.getElementById('google-gsi-script')) {
            const script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.body.appendChild(script);
            script.onload = initGoogleSignIn;
        } else {
            // Keep trying if the window.google library isn't fully ready
            let retries = 0;
            const timer = setInterval(() => {
                if (window.google?.accounts?.id) {
                    initGoogleSignIn();
                    clearInterval(timer);
                } else if (++retries > 20) {
                    clearInterval(timer);
                }
            }, 100);
            return () => clearInterval(timer);
        }
    }, [isRegistering]);

    const decodeJWT = (token) => {
        try {
            const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(
                atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
            );
            return JSON.parse(json);
        } catch (e) {
            console.error('JWT decode failed', e);
            return null;
        }
    };

    const handleGoogleResponse = async (response) => {
        setError('');
        setIsLoading(true);
        try {
            const payload = decodeJWT(response.credential);
            if (payload && payload.email) {
                const data = await api.ssoLogin(payload.email, payload.name || payload.email.split('@')[0]);
                if (data && data.token) {
                    localStorage.setItem('work_report_token', data.token);
                    onLogin(data.user, true);
                }
            } else {
                setError('Google authentication failed.');
            }
        } catch (err) {
            setError(err.message || 'Google Sign-In failed');
        } finally {
            setIsLoading(false);
        }
    };

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
                    {!isRegistering && (
                        <>
                            <div id="google-btn-container-report" style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', minHeight: '40px' }}></div>
                            <div className="or-divider" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#94a3b8', fontSize: '0.8rem', margin: '15px 0' }}>
                                <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></span>
                                <span>OR</span>
                                <span style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></span>
                            </div>
                        </>
                    )}

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
