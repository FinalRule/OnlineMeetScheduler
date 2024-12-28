import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'http://localhost:5000/api/google/callback'
});

export async function createMeeting(summary: string, startTime: Date, duration: number) {
  try {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const event = {
      summary,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'UTC',
      },
      conferenceData: {
        createRequest: {
          requestId: `meet_${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: event,
    });

    const meetLink = response.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === 'video'
    )?.uri;

    return meetLink;
  } catch (error) {
    console.error('Error creating Google Meet:', error);
    throw error;
  }
}
