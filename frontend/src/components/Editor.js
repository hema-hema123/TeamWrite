import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import axios from 'axios';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { 
  ArrowLeft, 
  Bold, 
  Italic, 
  Underline,
  List,
  ListOrdered,
  Quote,
  Minus,
  Save,
  Users,
  Circle,
  Wifi,
  WifiOff
} from 'lucide-react';

const Editor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [content, setContent] = useState('');
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [wsConnection, setWsConnection] = useState(null);

  // Fetch document data
  const fetchDocument = useCallback(async () => {
    try {
      const response = await axios.get(`/documents/${documentId}`);
      setDocument(response.data);
      setContent(response.data.content || 'Hello world! Start collaborating...');
    } catch (error) {
      if (error.response?.status === 404) {
        setError('Document not found');
      } else if (error.response?.status === 403) {
        setError('Access denied to this document');
      } else {
        setError('Failed to load document');
      }
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  // Save document content
  const saveDocument = useCallback(async () => {
    setSaving(true);
    try {
      await axios.put(`/documents/${documentId}`, { content });
    } catch (error) {
      setError('Failed to save document');
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  }, [content, documentId]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!user || !documentId) return;

    const token = localStorage.getItem('token');
    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    
    const ws = new WebSocket(`${wsUrl}/ws/${documentId}?token=${token}`);

    ws.onopen = () => {
      setConnected(true);
      console.log('WebSocket connected');
    };

    ws.onclose = () => {
      setConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence') {
          setOnlineUsers(data.users || []);
        } else if (data.type === 'content_change') {
          setContent(data.content);
        }
      } catch (e) {
        console.log('Non-JSON message received:', event.data);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWsConnection(ws);

    return () => {
      ws.close();
    };
  }, [user, documentId]);

  // Auto-save on content change
  useEffect(() => {
    if (!content || loading) return;
    
    // Debounced save (save after 2 seconds of inactivity)
    const timeoutId = setTimeout(saveDocument, 2000);
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [content, saveDocument, loading]);

  // Load document on component mount
  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <Alert className="border-red-200 bg-red-50 text-red-800 mb-4">
            {error}
          </Alert>
          <Button 
            onClick={() => navigate('/dashboard')}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Card>
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
              <Button 
                onClick={() => navigate('/dashboard')}
                variant="outline"
                size="sm"
                className="border-slate-300"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-xl font-semibold text-slate-800">
                  {document?.title || 'Untitled Document'}
                </h1>
                <div className="flex items-center space-x-4 text-sm text-slate-600">
                  <div className="flex items-center space-x-1">
                    {connected ? (
                      <>
                        <Wifi className="w-3 h-3 text-green-600" />
                        <span className="text-green-600">Connected</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="w-3 h-3 text-red-500" />
                        <span className="text-red-500">Disconnected</span>
                      </>
                    )}
                  </div>
                  {saving && <span className="text-blue-600">Saving...</span>}
                </div>
              </div>
            </div>

            {/* Online users */}
            <div className="flex items-center space-x-4">
              {onlineUsers.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <div className="flex -space-x-2">
                    {onlineUsers.slice(0, 5).map((onlineUser) => (
                      <div
                        key={onlineUser.user_id}
                        className="w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                        title={onlineUser.user_name}
                      >
                        {onlineUser.user_name.charAt(0).toUpperCase()}
                      </div>
                    ))}
                    {onlineUsers.length > 5 && (
                      <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-white text-xs">
                        +{onlineUsers.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={saveDocument}
                disabled={saving}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-white min-h-[600px] shadow-sm">
          <div className="p-8">
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                // Broadcast content change to other users
                if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                  wsConnection.send(JSON.stringify({
                    type: 'content_change',
                    content: e.target.value
                  }));
                }
              }}
              className="w-full min-h-[500px] p-4 border-none resize-none focus:outline-none text-slate-700 text-lg leading-relaxed"
              placeholder="Start typing your document..."
            />
          </div>
        </Card>
      </main>

      {/* Online users sidebar (mobile) */}
      {onlineUsers.length > 0 && (
        <div className="fixed bottom-4 right-4 md:hidden">
          <Card className="p-3 bg-white shadow-lg">
            <div className="flex items-center space-x-2 text-sm">
              <Circle className="w-2 h-2 fill-green-500 text-green-500" />
              <span className="font-medium">{onlineUsers.length} online</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Editor;