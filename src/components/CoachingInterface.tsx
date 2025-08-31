import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { BarChart3, ClipboardCheck, FileText, Mic, MicOff } from "lucide-react";
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import { ArrowLeft } from 'lucide-react';
import VoiceAnimation from './VoiceAnimation';
import PersonAvatar from './PersonAvatar';

// Removed unused placeholder image variable

interface CoachingInterfaceProps {
  profileData: any;
  onBack: () => void;
}

const MOODS = [
  'friendly', 'professional', 'casual', 'empathetic', 'humorous', 
  'direct', 'neutral', 'skeptical', 'hostile', 'distracted', 'curious', 'defensive'
];

export default function CoachingInterface({ profileData, onBack }: CoachingInterfaceProps) {
  const [selectedMood, setSelectedMood] = useState('professional');
  const [isListening, setIsListening] = useState(false);
  const [currentTip, setCurrentTip] = useState('');
  const [conversationLog, setConversationLog] = useState('');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isRolePlayMode, setIsRolePlayMode] = useState(false);
  // Define types for scorecard and session state
  type ScoreItem = {
    category: string;
    score: number;
    rating: string;
    comments: string;
    suggestions: string;
  };

  type Scorecard = {
    scorecard: ScoreItem[];
    session_id: string;
    timestamp: string;
    total_score: number;
    percentage: number;
    max_possible_score: number;
  };

  type Objection = {
    objection: string;
    handling: string;
    suggestion: string;
  };

  type Summary = {
    summary: {
      scenarioContext: string;
      strengths: string[];
      areasForImprovement: string[];
      pitchDelivery: string[];
      objectionsRaisedAndHandling: Objection[];
      notableMoments: string[];
      nextSteps: string[];
    };
    session_id: string;
    timestamp: string;
  };

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeView, setActiveView] = useState<'scorecard' | 'summary'>('summary');
  const [listenError, setListenError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [subtitle, setSubtitle] = useState<string>('');
  const [userSubtitle, setUserSubtitle] = useState<string>('');
  const [ragApiResponse, setRagApiResponse] = useState<{ answer: string, sources: string[] } | null>(null);

  // Use personality data from props or fallback to default
  const personalityData = profileData?.personality || {
    keyCharacteristics: [
      'Driven', 'Analytical', 'Outgoing', 'Organized', 'Adaptable',
      'Enthusiastic', 'Pragmatic', 'Considerate', 'Resilient', 'Intellectual'
    ],
    personalityTypes: [
      'The Achiever',
      'The Organized Leader', 
      'The Analytical Extrovert'
    ]
  };

  // Helper function to get color based on score
  const getScoreColor = (score: number, maxPossible: number = 10) => {
    if (score === 0) return 'bg-gray-100 border-gray-400'; // Not demonstrated
    const percentage = (score / maxPossible) * 100;
    if (percentage >= 80) return 'bg-green-50 border-green-500';
    if (percentage >= 60) return 'bg-blue-50 border-blue-500';
    if (percentage >= 40) return 'bg-yellow-50 border-yellow-500';
    return 'bg-red-50 border-red-500';
  };
  
  // Helper function to get text color based on score
  const getScoreTextColor = (score: number, maxPossible: number = 10) => {
    if (score === 0) return 'text-gray-500'; // Not demonstrated
    const percentage = (score / maxPossible) * 100;
    if (percentage >= 80) return 'text-green-700';
    if (percentage >= 60) return 'text-blue-700';
    if (percentage >= 40) return 'text-yellow-700';
    return 'text-red-700';
  };

  // Mock LLM tips that update based on mood and conversation
  const coachingTips = {
    professional: "Maintain eye contact and speak with confidence. Use industry-specific terminology to establish credibility.",
    friendly: "Start with a warm greeting and find common ground. Use open body language and smile genuinely.",
    empathetic: "Listen actively and acknowledge their concerns. Use phrases like 'I understand' and 'That must be challenging.'",
    casual: "Keep the tone relaxed and conversational. Use humor appropriately and don't be afraid to share personal experiences.",
    humorous: "Use light humor to break the ice, but read the room. Self-deprecating jokes work better than jokes about others.",
    direct: "Be clear and concise. State your points directly without too much preamble. Respect their time.",
    neutral: "Maintain a balanced tone. Focus on facts and avoid emotional language. Stay objective.",
    skeptical: "Address concerns head-on with evidence. Acknowledge their skepticism and provide concrete examples.",
    hostile: "Stay calm and professional. Don't take things personally. Use de-escalation techniques.",
    distracted: "Use engaging questions to recapture attention. Keep your points brief and impactful.",
    curious: "Encourage questions and exploration. Share interesting insights and be prepared for deep dives.",
    defensive: "Create a safe space for open dialogue. Avoid blame language and focus on solutions."
  };

  const rolePlayTips = {
    professional: "Act as Sarah would - be analytical and data-driven. Ask detailed questions about metrics and ROI.",
    friendly: "Show enthusiasm about collaboration. Mention team initiatives and cross-functional projects.",
    empathetic: "Express concern about team workload and stress. Ask about work-life balance solutions.",
    casual: "Be informal and relaxed. Share stories about company culture and team bonding activities.",
    humorous: "Use light workplace humor. Make jokes about common industry challenges or funny team experiences.",
    direct: "Get straight to business. Ask tough questions about timelines, budgets, and deliverables.",
    neutral: "Stay factual and objective. Focus on process improvements and operational efficiency.",
    skeptical: "Question assumptions and ask for proof. Challenge proposals with 'What if...' scenarios.",
    hostile: "Show resistance to change. Express frustration with past failed initiatives and vendor disappointments.",
    distracted: "Act busy and multitask. Give short responses and check phone/email frequently.",
    curious: "Ask lots of follow-up questions. Want to understand technical details and implementation steps.",
    defensive: "Protect current processes and team decisions. Justify existing systems and approaches."
  };

  useEffect(() => {
    const tips = isRolePlayMode ? rolePlayTips : coachingTips;
    setCurrentTip(tips[selectedMood as keyof typeof tips]);
  }, [selectedMood, isRolePlayMode]);
  
  // Monitor session state and sync with UI
  useEffect(() => {
    if (!sessionId && isListening) {
      // If we have no session but UI thinks we're listening, fix the UI state
      setIsListening(false);
    }
  }, [sessionId, isListening]);

  // Function to query the RAG API
  const queryRagApi = async (query: string) => {
    try {
      const RAG_API = import.meta.env.VITE_RAG_API as string;
      if (!RAG_API) {
        throw new Error('Missing RAG API endpoint. Set VITE_RAG_API in your .env file.');
      }
      
      const response = await fetch(RAG_API, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      });
      
      if (!response.ok) {
        throw new Error(`RAG API error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setRagApiResponse(data);
      return data;
    } catch (error) {
      console.error('Error querying RAG API:', error);
      return null;
    }
  };

  const handleMoodChange = (mood: string) => {
    setSelectedMood(mood);
  };

  const createSession = async () => {
    // Clear any existing session ID first
    setSessionId(null);
    
    const LIVE_BASE = import.meta.env.VITE_LIVE_BASE as string;
    if (!LIVE_BASE) {
      throw new Error('Missing live coaching API base. Set VITE_LIVE_BASE in your .env file.');
    }
    
    // Check if LinkedIn URL is available
    if (!profileData?.linkedinUrl) {
      console.warn('LinkedIn URL is missing, using fallback URL');
    }
    
    console.log('Creating session with mood:', selectedMood);
    const url = `${LIVE_BASE}/sessions`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          linkedin_url: profileData?.linkedinUrl || 'https://www.linkedin.com/in/default-profile/',
          mood: selectedMood,
        }),
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Live API error ${res.status}: ${text || res.statusText}`);
      }
      
      const data = await res.json();
      if (!data?.session_id) {
        throw new Error('No session ID returned from API');
      }
      
      // Set the session ID in state
      setSessionId(data.session_id);
      console.log('Session created successfully:', data.session_id);
      
      // Return the session ID for immediate use
      return data.session_id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  };

  const sendChatMessage = async (text: string, forcedSessionId?: string) => {
    const LIVE_BASE = import.meta.env.VITE_LIVE_BASE as string;
    if (!LIVE_BASE) throw new Error('Missing VITE_LIVE_BASE');
    
    // Use the forced session ID if provided (from speech recognition callback)
    // otherwise fall back to the current state
    const currentSessionId = forcedSessionId || sessionId;
    console.log('Sending chat with session ID:', currentSessionId);
    
    // Check if we have a valid session
    if (!currentSessionId) {
      console.error('No session ID available for chat');
      setListenError('No live session available. Please restart the listening session.');
      setIsListening(false); // Reset UI state to match actual state
      throw new Error('No live session. Click Start Listening first.');
    }

    const url = `${LIVE_BASE}/chat`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_id: currentSessionId, // Use the captured session ID variable
        message: text,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`Chat API error ${res.status}: ${t || res.statusText}`);
    }
    const data = await res.json();
    const reply: string = data?.reply || '';
    if (reply) {
      // Append assistant reply to log
      setConversationLog((prev) => `${prev}\nCoach: ${reply}`.trim());
      // Show subtitle
      setSubtitle(reply);
      
      // Send the agent's response to the RAG API
      try {
        await queryRagApi(reply);
      } catch (error) {
        console.error('Failed to query RAG API:', error);
      }
      
      // Speak reply using Web Speech API
      try {
        const synth = window.speechSynthesis;
        if (synth) {
          const utter = new SpeechSynthesisUtterance(reply);
          utter.lang = 'en-US';
          utter.rate = 1.0;
          utter.pitch = 1.0;
          utter.onend = () => {
            // Optionally clear subtitle after speaking
          };
          synth.speak(utter);
        }
      } catch (e) {
        // Non-fatal: if TTS fails, keep subtitle visible
        console.warn('TTS failed', e);
      }
    }
  };

  const startSpeechRecognition = (forcedSessionId?: string) => {
    // Use the forced session ID if provided, otherwise use the state
    const currentSessionId = forcedSessionId || sessionId;
    
    // Verify we have a session ID before starting
    if (!currentSessionId) {
      console.error('Attempted to start speech recognition without a session ID');
      setListenError('No session ID available. Please try again.');
      return;
    }
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setListenError('Speech recognition not supported by this browser. Use Chrome.');
      return;
    }
    
    // Stop any existing recognition instance first
    stopSpeechRecognition();
    
    // Create a new recognition instance
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    
    // Store the recognition object in the ref so we can access it later
    recognitionRef.current = recognition;
    
    // Log that we're starting with a valid session ID
    console.log('Starting speech recognition with valid session ID:', currentSessionId);

    // Capture the current session ID for use in the callback
    const capturedSessionId = currentSessionId;
    console.log('Capturing session ID for speech recognition callbacks:', capturedSessionId);
    
    recognition.onresult = async (event: any) => {
      // Verify we still have a valid session
      if (!capturedSessionId) {
        console.error('Session ID lost during speech recognition');
        setListenError('Session ID lost. Please restart listening.');
        stopSpeechRecognition();
        setIsListening(false);
        return;
      }
      
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript || '';
        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }
      // Show live interim as user subtitle
      if (interimTranscript) {
        setUserSubtitle(interimTranscript.trim());
      }
      if (finalTranscript.trim()) {
        const text = finalTranscript.trim();
        // Freeze user subtitle to the final line briefly
        setUserSubtitle(text);
        // Append user message locally
        setConversationLog((prev) => `${prev}\nYou: ${text}`.trim());
        try {
          // Log the session ID we're using for this message
          console.log('Sending chat with captured session ID:', capturedSessionId);
          // Pass the captured session ID to ensure it's used even if state has changed
          await sendChatMessage(text, capturedSessionId);
        } catch (err: any) {
          console.error(err);
          setListenError(err?.message || 'Failed to send chat message');
        } finally {
          // Clear user subtitle after sending
          setTimeout(() => setUserSubtitle(''), 500);
        }
      }
    };

    recognition.onerror = (e: any) => {
      console.error('Speech recognition error', e);
      setListenError('Speech recognition error');
    };

    recognition.onend = () => {
      // If still in listening mode, restart for continuous capture
      if (isListening) {
        try {
          recognition.start();
        } catch (_) {
          /* ignore */
        }
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (_) {
      // sometimes it throws if already started
    }
  };

  const fetchScores = async (sessionIdToUse: string) => {
    try {
      const LIVE_BASE = import.meta.env.VITE_LIVE_BASE as string;
      if (!LIVE_BASE) {
        throw new Error('Missing live coaching API base. Set VITE_LIVE_BASE in your .env file.');
      }

      console.log('Starting to fetch scores for session:', sessionIdToUse);
      const url = `${LIVE_BASE}/scores`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionIdToUse
        }),
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`Scores API returned error status ${res.status}:`, text);
        throw new Error(`Scores API error ${res.status}: ${text || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Successfully received scorecard:', data);
      setScorecard(data);
    } catch (error) {
      console.error('Failed to fetch scores - this is normal if session just ended:', error);
      // Don't throw - just log the error
    }
  };
  
  const fetchSummary = async (sessionIdToUse: string) => {
    try {
      const LIVE_BASE = import.meta.env.VITE_LIVE_BASE as string;
      if (!LIVE_BASE) {
        throw new Error('Missing live coaching API base. Set VITE_LIVE_BASE in your .env file.');
      }

      console.log('Starting to fetch summary for session:', sessionIdToUse);
      const url = `${LIVE_BASE}/summary`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionIdToUse
        }),
      });
      
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error(`Summary API returned error status ${res.status}:`, text);
        throw new Error(`Summary API error ${res.status}: ${text || res.statusText}`);
      }
      
      const data = await res.json();
      console.log('Successfully received summary:', data);
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch summary - this is normal if session just ended:', error);
      // Don't throw - just log the error
    }
  };

  const stopSpeechRecognition = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch (_) {
      /* ignore */
    }
    recognitionRef.current = null;
    setUserSubtitle('');
  };

  // Track if we're in the process of starting a session
  const [isStartingSession, setIsStartingSession] = useState(false);

  const toggleListening = async () => {
    if (!isListening) {
      try {
        // Set starting state to show loading indicator
        setIsStartingSession(true);
        setListenError(null);
        
        // Create session and wait for it to complete
        // Get the session ID directly from the function return value
        // instead of relying on the state which might not be updated yet
        const newSessionId = await createSession();
        
        // Use the returned session ID directly instead of checking state
        if (newSessionId) {
          console.log('Starting speech recognition with session ID:', newSessionId);
          // Pass the session ID directly to startSpeechRecognition
          startSpeechRecognition(newSessionId);
          setIsListening(true);
        } else {
          throw new Error('Failed to get a valid session ID');
        }
      } catch (e: any) {
        console.error('Error in toggleListening:', e);
        setListenError(e?.message || 'Failed to start live session');
      } finally {
        setIsStartingSession(false);
      }
    } else {
      // We're currently listening, so stop
      stopSpeechRecognition();
      setIsListening(false);
      
      // If we have a session ID, fetch the scores and summary
      if (sessionId) {
        // Fetch summary immediately as it's usually faster
        fetchSummary(sessionId);
        
        // Fetch scores with a slight delay to allow backend processing
        setTimeout(() => {
          fetchScores(sessionId);
        }, 2000); // 2 second delay for scorecard
      }
    }
  };

  // Removed unused getMoodColor function

  return (
    <div className="h-screen w-screen bg-gray-50 p-2 overflow-hidden">
      {/* Header - Compact */}
      <div className="mb-3 flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={onBack}
          size="sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Setup
        </Button>
        
        {/* Mode Toggle */}
        <div className="flex items-center space-x-3">
          <Label htmlFor="mode-toggle" className="text-sm font-medium">
            Coaching
          </Label>
          <Switch
            id="mode-toggle"
            checked={isRolePlayMode}
            onCheckedChange={setIsRolePlayMode}
          />
          <Label htmlFor="mode-toggle" className="text-sm font-medium">
            Role Play
          </Label>
        </div>
      </div>

      {/* Main Layout - Full screen utilization */}
      <div className="grid grid-cols-12 gap-3 h-[calc(100vh-120px)]">
        
        {/* Column 1 - Person Image and Moods */}
        <div className="col-span-3 space-y-3 h-full overflow-y-auto">
          {/* Person Avatar with Voice Animation */}
          <Card className="h-auto">
            <CardContent className="p-4">
              <div className="relative">
                <PersonAvatar 
                  name={profileData?.name} 
                  profileImage={profileData?.profileImage}
                />
                {isListening && (
                  <VoiceAnimation />
                )}
              </div>
              <div className="mt-3 text-center">
                <Button
                  onClick={toggleListening}
                  variant={isListening ? "destructive" : "default"}
                  size="sm"
                  disabled={isStartingSession}
                >
                  {isStartingSession ? (
                    <>
                      <span className="animate-pulse mr-2">⏳</span>
                      Creating Session...
                    </>
                  ) : isListening ? (
                    <>
                      <MicOff className="mr-2 h-4 w-4" />
                      Stop Listening
                    </>
                  ) : (
                    <>
                      <Mic className="mr-2 h-4 w-4" />
                      Start Listening
                    </>
                  )}
                </Button>
                {listenError && (
                  <p className="mt-2 text-xs text-red-600">{listenError}</p>
                )}
                {(userSubtitle || subtitle) && (
                  <div className="mt-2 space-y-1 text-left">
                    {userSubtitle && (
                      <div className="p-2 text-xs rounded bg-gray-800 text-white">
                        <span className="opacity-70 mr-1">You:</span>
                        <span>{userSubtitle}</span>
                      </div>
                    )}
                    {subtitle && (
                      <div className="p-2 text-xs rounded bg-blue-900 text-blue-50">
                        <span className="opacity-70 mr-1">Coach:</span>
                        <span>{subtitle}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Moods Dropdown */}
          <Card className="h-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Mood</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMood} onValueChange={handleMoodChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select mood" />
                </SelectTrigger>
                <SelectContent>
                  {MOODS.map((mood) => (
                    <SelectItem key={mood} value={mood} className="capitalize">
                      {mood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Key Characteristics */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Key Characteristics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Traits</label>
                <div className="grid grid-cols-2 gap-2">
                  {personalityData.keyCharacteristics.map((trait: string) => (
                    <Badge
                      key={trait}
                      variant="secondary"
                      className="text-center justify-center py-1 px-2 text-xs bg-blue-100 text-blue-800"
                    >
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-2 block">Personality Types</label>
                <div className="space-y-1">
                  {personalityData.personalityTypes.map((type: string) => (
                    <div key={type} className="p-2 bg-purple-50 rounded border-l-4 border-purple-400">
                      <p className="text-xs font-medium">{type}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 2 - Profile and Company Details */}
        <div className="col-span-3 space-y-3 h-full overflow-y-auto">
          {/* Profile Details */}
          <Card className="h-auto">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Profile Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <p className="text-sm">{profileData?.name}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Title</label>
                <p className="text-sm">{profileData?.title}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Company</label>
                <p className="text-sm">{profileData?.company}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">LinkedIn</label>
                <p className="text-xs text-blue-600 truncate">{profileData?.linkedinUrl}</p>
              </div>
            </CardContent>
          </Card>

          {/* Company Details */}
          <Card className="flex-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Work Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Array.isArray(profileData?.work_list) && profileData.work_list.length > 0 ? (
                <div className="space-y-3">
                  {profileData.work_list.map((job: any) => (
                    <div key={job.id} className="p-3 rounded border bg-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{job.company_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {job.position || job.role}
                          </p>
                        </div>
                        {job.is_current && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-800">Current</span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        <span>{job.from || ''}</span>
                        {(job.from || job.to) && ' — '}
                        <span>{job.to || (job.is_current ? 'Present' : '')}</span>
                      </div>
                      {job.linkedin && (
                        <a
                          href={job.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block text-xs text-blue-600 truncate"
                        >
                          {job.linkedin}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No work experience found.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3 - What to say */}
        <div className="col-span-3 space-y-3 h-full overflow-y-auto">
          {/* What to say Card */}
          <Card className="h-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">What to say</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 h-full overflow-y-auto">
              {/* Current AI Tip */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {isRolePlayMode ? `Role Play as ${profileData?.name} (${selectedMood})` : `Current Suggestion (${selectedMood})`}
                </label>
                <div className={`mt-2 p-3 rounded-lg border ${isRolePlayMode ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
                  <p className="text-sm">{currentTip}</p>
                </div>
              </div>
              
              {/* Additional Tips */}
              <div>
                <label className="text-xs font-medium text-muted-foreground">
                  {isRolePlayMode ? 'Character Behaviors' : 'Quick Tips'}
                </label>
                <div className="mt-2 space-y-2">
                  {isRolePlayMode ? (
                    <>
                      <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-400">
                        <p className="text-xs">🎭 Stay in character as {profileData?.name}</p>
                      </div>
                      <div className="p-2 bg-pink-50 rounded border-l-4 border-pink-400">
                        <p className="text-xs">📋 Reference their role as {profileData?.title}</p>
                      </div>
                      <div className="p-2 bg-indigo-50 rounded border-l-4 border-indigo-400">
                        <p className="text-xs">🏢 Consider {profileData?.company}'s perspective</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-2 bg-green-50 rounded border-l-4 border-green-400">
                        <p className="text-xs">💡 Ask about {profileData?.name}'s experience at {profileData?.company}</p>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                        <p className="text-xs">⚡ Mention their role as {profileData?.title} and how it relates to your solution</p>
                      </div>
                      <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                        <p className="text-xs">🔍 Discuss how your product can help with challenges in {profileData?.work_list?.[0]?.industry || 'their industry'}</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-400">
                        <p className="text-xs">🎯 Connect your solution to {profileData?.company}'s growth goals</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Column 4 - Tips (RAG), Conversation Notes, and Performance */}
        <div className="col-span-3 space-y-3 h-full overflow-y-auto">
          {/* Tips Card (RAG Response) */}
          <Card className="h-1/3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="h-full overflow-y-auto">
              {ragApiResponse ? (
                <div>
                  <div className="p-3 rounded-lg border bg-green-50 border-green-200">
                    <div className="text-sm prose prose-sm max-w-none">
                      <ReactMarkdown>{ragApiResponse.answer}</ReactMarkdown>
                    </div>
                    {ragApiResponse.sources && ragApiResponse.sources.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-muted-foreground">Sources:</p>
                        <ul className="text-xs list-disc list-inside">
                          {ragApiResponse.sources.map((source, index) => (
                            <li key={index} className="text-green-700">{source}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <p className="text-sm">Knowledge base tips will appear here during conversation</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversation Notes Card - Hide after conversation ends */}
          {(!scorecard && !summary) && (
          <Card className="h-1/3">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Conversation Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 hover:bg-blue-100">Important</Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs"
                      onClick={() => setIsEditingNotes(!isEditingNotes)}
                    >
                      {isEditingNotes ? 'Done' : 'Edit'}
                    </Button>
                  </div>
                </div>
                <div className="bg-white rounded-lg border border-gray-200 p-3">
                  {!isEditingNotes ? (
                    /* Formatted conversation display */
                    <div 
                      className="min-h-[100px] text-sm overflow-y-auto max-h-[150px] cursor-pointer" 
                      onClick={() => setIsEditingNotes(true)}
                    >
                      {conversationLog ? conversationLog.split('\n').map((line, index) => {
                        // Format "You:" in blue
                        if (line.startsWith('You:')) {
                          return (
                            <p key={index} className="mb-2">
                              <strong className="text-blue-500">You:</strong>
                              {line.substring(4)}
                            </p>
                          );
                        }
                        
                        // Format coach's name in green
                        const coachName = profileData?.name?.split(' ')[0] || 'Coach';
                        if (line.startsWith(`${coachName}:`) || line.startsWith('Coach:')) {
                          const nameLength = line.startsWith(`${coachName}:`) ? coachName.length + 1 : 6;
                          return (
                            <p key={index} className="mb-2">
                              <strong className="text-green-500">{line.substring(0, nameLength)}</strong>
                              {line.substring(nameLength)}
                            </p>
                          );
                        }
                        
                        // Return regular line
                        return <p key={index} className="mb-2">{line}</p>;
                      }) : (
                        <p className="text-gray-400 italic">Click to add conversation notes...</p>
                      )}
                    </div>
                  ) : (
                    /* Editable textarea */
                    <Textarea
                      id="conversation-notes"
                      placeholder={`Format as 'You:' and '${profileData?.name?.split(' ')[0] || 'Coach'}:' for automatic styling`}
                      value={conversationLog}
                      onChange={(e) => setConversationLog(e.target.value)}
                      className="min-h-[100px] text-sm border-none resize-none focus:outline-none focus:ring-0"
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Performance Analysis Card - Only show after conversation ends */}
          {(scorecard || summary) && (
            <Card className="h-2/3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  {activeView === 'scorecard' ? (
                    <>
                      <BarChart3 className="h-4 w-4" />
                      Performance Scorecard
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      Session Summary
                    </>
                  )}
                </CardTitle>
                
                <div className="flex items-center gap-2 text-xs">
                  <span className={activeView === 'scorecard' ? 'font-medium' : ''}>Scorecard</span>
                  <Switch 
                    checked={activeView === 'summary'}
                    onCheckedChange={(checked: boolean) => setActiveView(checked ? 'summary' : 'scorecard')}
                  />
                  <span className={activeView === 'summary' ? 'font-medium' : ''}>Summary</span>
                </div>
              </div>
              
              {scorecard && activeView === 'scorecard' && (
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <span>Total Score: <span className="font-semibold">{scorecard.total_score}/{scorecard.max_possible_score}</span></span>
                  <span>|</span>
                  <span>Percentage: <span className="font-semibold">{scorecard.percentage.toFixed(1)}%</span></span>
                </div>
              )}
            </CardHeader>
            <CardContent className="h-full overflow-y-auto">
              {/* Show placeholder if neither scorecard nor summary is available */}
              {!scorecard && !summary ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                  <ClipboardCheck className="h-8 w-8 mb-2" />
                  <p className="text-sm">Complete a session to view your performance analysis</p>
                </div>
              ) : activeView === 'scorecard' ? (
                /* Scorecard View */
                <div className="space-y-4">
                  {scorecard?.scorecard.map((item, index) => (
                    <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-sm">{item.category}</h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreTextColor(item.score)}`}>
                          {item.score === 0 ? 'Not Demonstrated' : `${item.score}/10 - ${item.rating}`}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {item.comments && (
                          <div className={`p-2 rounded border-l-4 ${getScoreColor(item.score)}`}>
                            <p className="text-xs font-medium mb-1">Comments:</p>
                            <p className="text-xs">{item.comments}</p>
                          </div>
                        )}
                        
                        {item.suggestions && (
                          <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                            <p className="text-xs font-medium mb-1">Suggestions:</p>
                            <p className="text-xs">{item.suggestions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Summary View */
                <div className="space-y-4">
                  {summary && (
                    <>
                      {/* Scenario Context */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="font-medium text-sm mb-2">Scenario Context</h3>
                        <div className="p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="text-xs">{summary.summary.scenarioContext}</p>
                        </div>
                      </div>
                      
                      {/* Strengths */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="font-medium text-sm mb-2">Strengths</h3>
                        <div className="space-y-1">
                          {summary.summary.strengths.map((strength, index) => (
                            <div key={index} className="p-2 bg-green-50 rounded border-l-4 border-green-500">
                              <p className="text-xs">{strength}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Areas for Improvement */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="font-medium text-sm mb-2">Areas for Improvement</h3>
                        <div className="space-y-1">
                          {summary.summary.areasForImprovement.map((area, index) => (
                            <div key={index} className="p-2 bg-yellow-50 rounded border-l-4 border-yellow-500">
                              <p className="text-xs">{area}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Pitch Delivery */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="font-medium text-sm mb-2">Pitch Delivery</h3>
                        <div className="space-y-1">
                          {summary.summary.pitchDelivery.map((point, index) => (
                            <div key={index} className="p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                              <p className="text-xs">{point}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Objections & Handling */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="font-medium text-sm mb-2">Objections & Handling</h3>
                        <div className="space-y-3">
                          {summary.summary.objectionsRaisedAndHandling.map((obj, index) => (
                            <div key={index} className="space-y-1">
                              <div className="p-2 bg-red-50 rounded border-l-4 border-red-400">
                                <p className="text-xs font-medium mb-1">Objection:</p>
                                <p className="text-xs">{obj.objection}</p>
                              </div>
                              <div className="p-2 bg-purple-50 rounded border-l-4 border-purple-400">
                                <p className="text-xs font-medium mb-1">Handling:</p>
                                <p className="text-xs">{obj.handling}</p>
                              </div>
                              <div className="p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                                <p className="text-xs font-medium mb-1">Suggestion:</p>
                                <p className="text-xs">{obj.suggestion}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Notable Moments */}
                      <div className="border-b border-gray-200 pb-4">
                        <h3 className="font-medium text-sm mb-2">Notable Moments</h3>
                        <div className="space-y-1">
                          {summary.summary.notableMoments.map((moment, index) => (
                            <div key={index} className="p-2 bg-indigo-50 rounded border-l-4 border-indigo-500">
                              <p className="text-xs">{moment}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Next Steps */}
                      <div className="pb-4">
                        <h3 className="font-medium text-sm mb-2">Next Steps</h3>
                        <div className="space-y-1">
                          {summary.summary.nextSteps.map((step, index) => (
                            <div key={index} className="p-2 bg-teal-50 rounded border-l-4 border-teal-500">
                              <p className="text-xs">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </div>
      </div>
    </div>
  );
}