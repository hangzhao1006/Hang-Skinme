// Google Calendar API Integration Service using Google Identity Services (GIS)

interface CalendarEvent {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'skincare' | 'skin_condition' | 'product_delivery';
  title: string;
  description?: string;
  skinCondition?: string;
  deliveryStatus?: string;
  createdAt: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    date?: string;
    dateTime?: string;
  };
  end: {
    date?: string;
    dateTime?: string;
  };
  colorId?: string;
  extendedProperties?: {
    private?: {
      type?: string;
      skinCondition?: string;
      deliveryStatus?: string;
    };
  };
}

class GoogleCalendarService {
  private accessToken: string | null = null;
  private isInitialized: boolean = false;
  private isSignedIn: boolean = false;
  private tokenClient: any = null;

  // Color IDs for different event types
  private readonly COLOR_IDS = {
    skincare: '9',       // Blue
    skin_condition: '5', // Yellow
    product_delivery: '2' // Green
  };

  /**
   * Initialize Google Identity Services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

      console.log('Initializing Google Identity Services...');
      console.log('CLIENT_ID:', CLIENT_ID ? `${CLIENT_ID.substring(0, 20)}...` : 'NOT SET');

      if (!CLIENT_ID) {
        const error = 'Google Calendar API credentials not configured. Please check your .env.local file.';
        console.error(error);
        throw new Error(error);
      }

      // Load Google Identity Services script
      await this.loadGIS();

      // Initialize token client
      this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/calendar.events',
        callback: (response: any) => {
          if (response.error) {
            console.error('Token error:', response);
            this.isSignedIn = false;
            this.accessToken = null;
            return;
          }

          console.log('Access token received');
          this.accessToken = response.access_token;
          this.isSignedIn = true;
        },
      });

      this.isInitialized = true;
      console.log('Google Identity Services initialized successfully');
    } catch (error: any) {
      console.error('Error initializing Google Identity Services:', error);
      throw error;
    }
  }

  /**
   * Load Google Identity Services script
   */
  private loadGIS(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if GIS is already loaded
      if (typeof window !== 'undefined' && (window as any).google?.accounts) {
        resolve();
        return;
      }

      // Load the GIS script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        console.log('Google Identity Services script loaded');
        resolve();
      };
      script.onerror = (error) => {
        console.error('Failed to load Google Identity Services script:', error);
        reject(error);
      };
      document.body.appendChild(script);
    });
  }

  /**
   * Sign in to Google
   */
  async signIn(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.tokenClient) {
      throw new Error('Google Identity Services not initialized');
    }

    try {
      console.log('Requesting access token...');

      // Request access token (this will show OAuth popup)
      return new Promise((resolve, reject) => {
        this.tokenClient.callback = (response: any) => {
          if (response.error) {
            console.error('Sign-in error:', response);
            this.isSignedIn = false;
            this.accessToken = null;

            if (response.error === 'popup_closed_by_user') {
              reject(new Error('Sign-in cancelled. Please try again.'));
            } else if (response.error === 'access_denied') {
              reject(new Error('Access denied. Please grant permission to access your calendar.'));
            } else {
              reject(new Error(`Sign-in failed: ${response.error}`));
            }
            return;
          }

          console.log('Sign in successful');
          this.accessToken = response.access_token;
          this.isSignedIn = true;
          resolve();
        };

        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      });
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    if (this.accessToken && (window as any).google?.accounts?.oauth2) {
      try {
        (window as any).google.accounts.oauth2.revoke(this.accessToken, () => {
          console.log('Token revoked');
        });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }

    this.accessToken = null;
    this.isSignedIn = false;
  }

  /**
   * Check if user is signed in
   */
  isUserSignedIn(): boolean {
    return this.isSignedIn && this.accessToken !== null;
  }

  /**
   * Make authenticated request to Google Calendar API
   */
  private async makeCalendarRequest(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not signed in to Google');
    }

    const url = `https://www.googleapis.com/calendar/v3/${endpoint}`;

    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calendar API error:', errorText);
      throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Convert local event to Google Calendar event
   */
  private toGoogleEvent(event: CalendarEvent): GoogleCalendarEvent {
    const emoji = this.getEventEmoji(event.type);

    return {
      id: event.id,
      summary: `${emoji} ${event.title}`,
      description: this.buildDescription(event),
      start: { date: event.date },
      end: { date: event.date },
      colorId: this.COLOR_IDS[event.type],
      extendedProperties: {
        private: {
          type: event.type,
          skinCondition: event.skinCondition,
          deliveryStatus: event.deliveryStatus,
        },
      },
    };
  }

  /**
   * Convert Google Calendar event to local event
   */
  private fromGoogleEvent(gEvent: any): CalendarEvent | null {
    try {
      const privateProps = gEvent.extendedProperties?.private || {};

      return {
        id: gEvent.id,
        date: gEvent.start.date || gEvent.start.dateTime?.split('T')[0],
        type: privateProps.type || 'skincare',
        title: gEvent.summary?.replace(/^[💆🌡️📦]\s*/, '') || '',
        description: gEvent.description,
        skinCondition: privateProps.skinCondition,
        deliveryStatus: privateProps.deliveryStatus,
        createdAt: gEvent.created || new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error converting Google event:', error);
      return null;
    }
  }

  /**
   * Build event description
   */
  private buildDescription(event: CalendarEvent): string {
    let desc = event.description || '';

    if (event.skinCondition) {
      desc += `\n\nSkin Condition: ${event.skinCondition}`;
    }

    if (event.deliveryStatus) {
      desc += `\n\nDelivery Status: ${event.deliveryStatus}`;
    }

    desc += `\n\n---\nCreated with SkinMe AI Calendar`;

    return desc.trim();
  }

  /**
   * Get emoji for event type
   */
  private getEventEmoji(type: string): string {
    switch (type) {
      case 'skincare': return '💆';
      case 'skin_condition': return '🌡️';
      case 'product_delivery': return '📦';
      default: return '📅';
    }
  }

  /**
   * Sync local event to Google Calendar
   */
  async syncToGoogle(event: CalendarEvent): Promise<string> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google');
    }

    const gEvent = this.toGoogleEvent(event);

    try {
      const result = await this.makeCalendarRequest(
        'calendars/primary/events',
        'POST',
        gEvent
      );

      return result.id;
    } catch (error) {
      console.error('Error syncing to Google Calendar:', error);
      throw error;
    }
  }

  /**
   * Update event in Google Calendar
   */
  async updateInGoogle(event: CalendarEvent): Promise<void> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google');
    }

    const gEvent = this.toGoogleEvent(event);

    try {
      await this.makeCalendarRequest(
        `calendars/primary/events/${event.id}`,
        'PUT',
        gEvent
      );
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw error;
    }
  }

  /**
   * Delete event from Google Calendar
   */
  async deleteFromGoogle(eventId: string): Promise<void> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google');
    }

    try {
      await this.makeCalendarRequest(
        `calendars/primary/events/${eventId}`,
        'DELETE'
      );
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw error;
    }
  }

  /**
   * Get events from Google Calendar for a date range
   */
  async getEventsFromGoogle(startDate: string, endDate: string): Promise<CalendarEvent[]> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google');
    }

    try {
      const params = new URLSearchParams({
        timeMin: `${startDate}T00:00:00Z`,
        timeMax: `${endDate}T23:59:59Z`,
        showDeleted: 'false',
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const result = await this.makeCalendarRequest(
        `calendars/primary/events?${params.toString()}`
      );

      const events: CalendarEvent[] = [];

      for (const item of result.items || []) {
        // Only import events created by SkinMe AI
        if (item.extendedProperties?.private?.type) {
          const event = this.fromGoogleEvent(item);
          if (event) {
            events.push(event);
          }
        }
      }

      return events;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
      throw error;
    }
  }

  /**
   * Batch sync local events to Google Calendar
   */
  async batchSyncToGoogle(events: CalendarEvent[]): Promise<void> {
    if (!this.isSignedIn) {
      throw new Error('Not signed in to Google');
    }

    const promises = events.map(event => this.syncToGoogle(event));
    await Promise.all(promises);
  }
}

// Export singleton instance
export const googleCalendarService = new GoogleCalendarService();
