import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { 
  Users, 
  FileText, 
  Zap, 
  Share2, 
  MessageSquare, 
  History,
  Eye,
  Lock,
  Globe,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="w-6 h-6" />,
      title: "Real-time Collaboration",
      description: "See who's online and edit together in real-time. Watch cursors move as teammates type.",
      color: "blue"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Instant Sync",
      description: "Changes sync across all devices instantly. No more version conflicts or lost work.",
      color: "emerald"
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: "Easy Sharing",
      description: "Share documents with a simple link. Control who can view, comment, or edit.",
      color: "amber"
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Live Comments",
      description: "Add comments and suggestions in real-time. Perfect for reviews and feedback.",
      color: "purple"
    },
    {
      icon: <History className="w-6 h-6" />,
      title: "Version History",
      description: "Never lose your work. View and restore previous versions with full history tracking.",
      color: "rose"
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: "Presence Awareness",
      description: "See who's online, where they're editing, and collaborate without stepping on toes.",
      color: "indigo"
    }
  ];

  const benefits = [
    "No more emailing document versions back and forth",
    "Real-time collaboration with your entire team",
    "Professional document editor with rich formatting",
    "Secure sharing with granular permissions",
    "Works seamlessly across all devices"
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-800">TeamWrite</h1>
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link to="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Home
              </Link>
              {user && (
                <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                  Dashboard
                </Link>
              )}
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-600">Welcome, {user.username}!</span>
                  <Button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Button 
                    variant="ghost" 
                    onClick={() => navigate('/login')}
                    className="text-slate-600 hover:text-slate-800"
                  >
                    Sign In
                  </Button>
                  <Button 
                    onClick={() => navigate('/login')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Star className="w-4 h-4" />
              <span>Trusted by teams worldwide</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-slate-800 mb-6 leading-tight">
              Collaborate in 
              <span className="text-blue-600 block">Real-time</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-slate-600 mb-12 leading-relaxed">
              Create, edit, and collaborate on documents with your team. 
              See changes instantly with powerful real-time synchronization.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold btn-hover-scale"
              >
                {user ? 'Go to Dashboard' : 'Start Collaborating'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg"
                className="px-8 py-4 text-lg font-semibold border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Globe className="w-5 h-5 mr-2" />
                View Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">
              Everything you need for seamless collaboration
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Powerful features designed to make team collaboration effortless and productive.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-8 bg-white border-slate-200 hover:shadow-lg transition-shadow card-hover">
                <div className={`w-12 h-12 bg-${feature.color}-100 rounded-lg flex items-center justify-center mb-6 text-${feature.color}-600`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-800 mb-6">
                Why teams choose TeamWrite
              </h2>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Stop juggling multiple versions and endless email threads. 
                TeamWrite brings your team together in one collaborative workspace.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                    <span className="text-slate-700 text-lg">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => navigate(user ? '/dashboard' : '/login')}
                size="lg"
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold btn-hover-scale"
              >
                {user ? 'Create Document' : 'Get Started Free'}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
            
            <div className="relative">
              <Card className="p-8 bg-white shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">Project Proposal Draft</h3>
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">
                        A
                      </div>
                      <div className="w-8 h-8 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">
                        B
                      </div>
                      <div className="w-8 h-8 bg-amber-500 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium">
                        C
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="h-2 bg-slate-200 rounded w-full"></div>
                    <div className="h-2 bg-slate-200 rounded w-5/6"></div>
                    <div className="h-2 bg-blue-200 rounded w-3/4"></div>
                    <div className="h-2 bg-slate-200 rounded w-4/5"></div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-slate-600">Alice is typing...</span>
                  </div>
                </div>
              </Card>
              
              {/* Floating collaboration indicators */}
              <div className="absolute -top-4 -right-4 bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-medium">
                Live
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                3 online
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to transform how your team collaborates?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams already using TeamWrite to create, collaborate, and succeed together.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold btn-hover-scale"
            >
              {user ? 'Go to Dashboard' : 'Start Free Today'}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-white">TeamWrite</span>
              </div>
              <p className="text-slate-400 text-sm">
                The future of collaborative document editing. 
                Real-time, secure, and built for teams.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <div className="space-y-2 text-sm">
                <Link to="/" className="block hover:text-white transition-colors">Features</Link>
                <Link to="/" className="block hover:text-white transition-colors">Pricing</Link>
                <Link to="/" className="block hover:text-white transition-colors">Security</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <div className="space-y-2 text-sm">
                <Link to="/" className="block hover:text-white transition-colors">About</Link>
                <Link to="/" className="block hover:text-white transition-colors">Contact</Link>
                <Link to="/" className="block hover:text-white transition-colors">Careers</Link>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-4">Support</h4>
              <div className="space-y-2 text-sm">
                <Link to="/" className="block hover:text-white transition-colors">Help Center</Link>
                <Link to="/" className="block hover:text-white transition-colors">Privacy Policy</Link>
                <Link to="/" className="block hover:text-white transition-colors">Terms of Service</Link>
              </div>
            </div>
          </div>
          
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 TeamWrite. All rights reserved. Built with ❤️ for collaborative teams.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;