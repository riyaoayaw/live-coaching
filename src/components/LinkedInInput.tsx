import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2, Linkedin } from 'lucide-react';

interface LinkedInInputProps {
  onSubmit: (data: any) => void;
}

export default function LinkedInInput({ onSubmit }: LinkedInInputProps) {
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!linkedinUrl.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN as string;

      if (!API_BASE || !AUTH_TOKEN) {
        throw new Error('Missing API configuration. Please set VITE_API_BASE and VITE_AUTH_TOKEN in your .env file.');
      }

      const endpointId = 'F09CC251';
      const url = `${API_BASE}/${endpointId}?linkedin_url=${encodeURIComponent(linkedinUrl)}&x-client=saleslife`;

      const res = await fetch(url, {
        headers: {
          accept: 'application/json',
          authToken: AUTH_TOKEN,
        },
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`API error ${res.status}: ${text || res.statusText}`);
      }

      const data = await res.json();

      // Map API response to UI shape expected by CoachingInterface
      const person = data?.data?.person;
      const insights = data?.data?.insights;
      const mapped = {
        name: person?.display_name || `${person?.first_name || ''} ${person?.last_name || ''}`.trim(),
        title: person?.current_work?.position || person?.current_work?.role || '',
        company: person?.current_work?.company_name || '',
        linkedinUrl: person?.linkedin_url || linkedinUrl,
        profileImage: person?.profile_pic || undefined,
        work_list: person?.work_list || [],
        companyDetails: undefined as
          | {
              industry: string;
              size: string;
              location: string;
            }
          | undefined,
        personality: insights
          ? {
              keyCharacteristics: insights.adjectives || [],
              personalityTypes: insights.personality_types || [],
            }
          : undefined,
      };

      onSubmit(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidLinkedInUrl = (url: string) => {
    return url.includes('linkedin.com/in/') || url.includes('linkedin.com/company/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <Linkedin className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <CardTitle>AI Coaching Setup</CardTitle>
          <CardDescription>
            Enter a LinkedIn profile URL to get started with personalized coaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
              <Input
                id="linkedin-url"
                type="url"
                placeholder="https://www.linkedin.com/in/johndoe"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                required
              />
              {linkedinUrl && !isValidLinkedInUrl(linkedinUrl) && (
                <p className="text-sm text-destructive">
                  Please enter a valid LinkedIn profile URL
                </p>
              )}
              {error && (
                <p className="text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={!linkedinUrl.trim() || !isValidLinkedInUrl(linkedinUrl) || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Profile...
                </>
              ) : (
                'Start Coaching Session'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-sm text-muted-foreground">
            <p className="mb-2">What we'll extract:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Professional background</li>
              <li>Current role and company</li>
              <li>Industry insights</li>
              <li>Personality characteristics</li>
              <li>Career progression</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}