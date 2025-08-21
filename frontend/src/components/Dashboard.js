import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Alert } from './ui/alert';
import { 
  FileText, 
  Plus, 
  User, 
  LogOut, 
  Calendar,
  Users,
  Clock,
  Trash2,
  Edit3
} from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [error, setError] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get('/documents');
      setDocuments(response.data);
    } catch (error) {
      setError('Failed to fetch documents');
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async () => {
    if (!newDocTitle.trim()) {
      setError('Please enter a document title');
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await axios.post('/documents', {
        title: newDocTitle.trim()
      });
      
      setDocuments([response.data, ...documents]);
      setNewDocTitle('');
      setShowCreateDialog(false);
      
      // Navigate to the new document
      navigate(`/editor/${response.data.id}`);
    } catch (error) {
      setError('Failed to create document');
      console.error('Error creating document:', error);
    } finally {
      setCreating(false);
    }
  };

  const deleteDocument = async (docId, docTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${docTitle}"?`)) {
      return;
    }

    try {
      await axios.delete(`/documents/${docId}`);
      setDocuments(documents.filter(doc => doc.id !== docId));
    } catch (error) {
      setError('Failed to delete document');
      console.error('Error deleting document:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className="skeleton h-8 w-48 rounded"></div>
            <div className="skeleton h-10 w-32 rounded"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton h-48 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">TeamWrite</h1>
                <p className="text-sm text-slate-600">Collaborative Editor</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white btn-hover-scale">
                    <Plus className="w-4 h-4 mr-2" />
                    New Document
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white">
                  <DialogHeader>
                    <DialogTitle>Create New Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {error && (
                      <Alert className="border-red-200 bg-red-50 text-red-800">
                        {error}
                      </Alert>
                    )}
                    <Input
                      placeholder="Enter document title..."
                      value={newDocTitle}
                      onChange={(e) => {
                        setNewDocTitle(e.target.value);
                        if (error) setError('');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && createDocument()}
                      className="form-input"
                      disabled={creating}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowCreateDialog(false)}
                        disabled={creating}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={createDocument}
                        disabled={creating || !newDocTitle.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex items-center space-x-2 px-4 py-2 bg-slate-100 rounded-lg">
                <User className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">{user?.username}</span>
              </div>
              
              <Button 
                onClick={logout} 
                variant="outline"
                className="text-slate-600 hover:text-slate-800 border-slate-300"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-slate-800">Your Documents</h2>
              <p className="text-slate-600 mt-2">
                Create and collaborate on documents with your team
              </p>
            </div>
            <div className="text-sm text-slate-600 bg-white px-4 py-2 rounded-lg border border-slate-200">
              {documents.length} document{documents.length !== 1 ? 's' : ''}
            </div>
          </div>

          {error && (
            <Alert className="border-red-200 bg-red-50 text-red-800 animate-fade-in">
              {error}
            </Alert>
          )}

          {documents.length === 0 ? (
            <Card className="p-12 text-center bg-white card-hover">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                No documents yet
              </h3>
              <p className="text-slate-600 mb-6">
                Create your first document to start collaborating with your team.
              </p>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white btn-hover-scale"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Document
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((doc) => (
                <Card 
                  key={doc.id} 
                  className="p-6 bg-white card-hover cursor-pointer group"
                  onClick={() => navigate(`/editor/${doc.id}`)}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors mb-2">
                          {doc.title}
                        </h3>
                        <div className="flex items-center text-sm text-slate-600 space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(doc.updated_at)}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{doc.collaborators?.length || 1}</span>
                          </div>
                        </div>
                      </div>
                      
                      {doc.created_by === user?.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteDocument(doc.id, doc.title);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      )}
                    </div>
                    
                    <div className="border-t border-slate-100 pt-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Modified {formatDate(doc.updated_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Edit3 className="w-3 h-3" />
                          <span>Click to edit</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;