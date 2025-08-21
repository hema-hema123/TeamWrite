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

// Random colors for collaboration cursors
const getRandomColor = () => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#FF7F50', '#87CEEB', '#DEB887', '#F0E68C'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Editor = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [ydoc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState(null);

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false, // Disable history for collaboration
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider: null, // Will be set later
        user: {
          name: user?.username || 'Anonymous',
          color: getRandomColor(),
        },
      }),
    ],
    content: '<p>Loading document...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none',
      },
    },
  });

  // Fetch document data
  const fetchDocument = useCallback(async () => {
    try {
      const response = await axios.get(`/documents/${documentId}`);
      setDocument(response.data);
      
      if (response.data.content) {
        // Set initial content if available
        editor?.commands.setContent(response.data.content);
      } else {
        editor?.commands.setContent('<p>Hello world! Start collaborating...</p>');
      }
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
  }, [documentId, editor]);

  // Save document content
  const saveDocument = useCallback(async () => {
    if (!editor) return;
    
    setSaving(true);
    try {
      const content = editor.getHTML();
      await axios.put(`/documents/${documentId}`, { content });
    } catch (error) {
      setError('Failed to save document');
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  }, [editor, documentId]);

  // Initialize WebSocket connection and Yjs provider
  useEffect(() => {
    if (!user || !documentId) return;

    const token = localStorage.getItem('token');
    const wsUrl = process.env.REACT_APP_BACKEND_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    
    const wsProvider = new WebsocketProvider(
      `${wsUrl}/ws/${documentId}?token=${token}`,
      'document-room',
      ydoc
    );

    wsProvider.on('status', (event) => {
      setConnected(event.status === 'connected');
    });

    // Listen for presence updates
    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence') {
          setOnlineUsers(data.users || []);
        }
      } catch (e) {
        // Handle non-JSON messages (Yjs sync messages)
      }
    };

    if (wsProvider.ws) {
      wsProvider.ws.addEventListener('message', handleMessage);
    }

    setProvider(wsProvider);

    // Update collaboration cursor provider
    if (editor) {
      const collaborationCursorExt = editor.extensionManager.extensions.find(
        ext => ext.name === 'collaborationCursor'
      );
      if (collaborationCursorExt) {
        collaborationCursorExt.options.provider = wsProvider;
      }
    }

    return () => {
      wsProvider.destroy();
    };
  }, [user, documentId, ydoc, editor]);

  // Auto-save on content change
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      // Debounced save (save after 2 seconds of inactivity)
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(saveDocument, 2000);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
      clearTimeout(window.autoSaveTimeout);
    };
  }, [editor, saveDocument]);

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

      {/* Toolbar */}
      {editor && (
        <div className="bg-white border-b border-slate-200 px-4 py-2">
          <div className="container mx-auto">
            <div className="flex items-center space-x-1">
              <Button
                onClick={() => editor.chain().focus().toggleBold().run()}
                variant={editor.isActive('bold') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Bold className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                variant={editor.isActive('italic') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Italic className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                variant={editor.isActive('strike') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Underline className="w-4 h-4" />
              </Button>

              <div className="w-px h-6 bg-slate-300 mx-2"></div>

              <Button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                variant={editor.isActive('bulletList') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <List className="w-4 h-4" />
              </Button>
              
              <Button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                variant={editor.isActive('orderedList') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                variant={editor.isActive('blockquote') ? 'default' : 'ghost'}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Quote className="w-4 h-4" />
              </Button>

              <Button
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <main className="container mx-auto px-4 py-8">
        <Card className="bg-white min-h-[600px] shadow-sm">
          <EditorContent 
            editor={editor} 
            className="p-8 min-h-[600px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-opacity-20 rounded-lg"
          />
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