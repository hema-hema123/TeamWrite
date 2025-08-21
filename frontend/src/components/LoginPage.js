import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert } from './ui/alert';
import { Users, FileText, Zap } from 'lucide-react';

const LoginPage = () => {
  const { user, login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { username, password } = formData;
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    const result = isLogin 
      ? await login(username, password)
      : await register(username, password);

    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Branding */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-slate-800 leading-tight">
              Collaborate
              <span className="text-blue-600 block">in Real-time</span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Create, edit, and collaborate on documents with your team. 
              See changes instantly with powerful real-time synchronization.
            </p>
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Real-time Collaboration</h3>
                <p className="text-slate-600">See who's online and edit together</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Rich Text Editing</h3>
                <p className="text-slate-600">Powerful editor with formatting tools</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl">
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Instant Sync</h3>
                <p className="text-slate-600">Changes sync across all devices instantly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex justify-center lg:justify-end">
          <Card className="w-full max-w-md p-8 bg-white/80 backdrop-blur-sm border-0 shadow-xl">
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-800">
                  {isLogin ? 'Welcome Back' : 'Join TeamWrite'}
                </h2>
                <p className="text-slate-600">
                  {isLogin 
                    ? 'Sign in to your account to continue' 
                    : 'Create your account to get started'
                  }
                </p>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50 text-red-800 animate-fade-in">
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium">
                    Username
                  </Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-input h-12 bg-white border-slate-200 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-700 font-medium">
                    Password
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="form-input h-12 bg-white border-slate-200 focus:border-blue-500"
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium btn-hover-scale"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{isLogin ? 'Signing In...' : 'Creating Account...'}</span>
                    </div>
                  ) : (
                    isLogin ? 'Sign In' : 'Create Account'
                  )}
                </Button>
              </form>

              <div className="text-center">
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setFormData({ username: '', password: '' });
                  }}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  disabled={loading}
                >
                  {isLogin 
                    ? "Don't have an account? Sign up" 
                    : "Already have an account? Sign in"
                  }
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;