# VibeTune 🎵

A Next.js application that allows users to create AI-generated music from short videos, text descriptions, and images. Built with modern web technologies and designed with a beautiful, Suno-inspired interface.

## Features

### 🎥 Video Recording

-   Real-time camera access and video recording
-   Up to 30-second video capture
-   Live preview and playback
-   High-quality video processing

### 🎨 Context Addition

-   Text descriptions for mood and style
-   Image upload for visual context
-   Multiple image support
-   Drag-and-drop interface

### 🤖 AI Music Generation

-   Integration with Sonu AI for music generation
-   Mood and style detection from video content
-   High-quality audio output
-   Multiple genre support

### 🎵 Music Player

-   Advanced audio player with waveform visualization
-   Playback controls (play, pause, seek, volume)
-   Download functionality
-   Social sharing options

### 🎨 Beautiful UI/UX

-   Suno-inspired design with gradient backgrounds
-   Glass morphism effects
-   Responsive design for all devices
-   Dark theme optimized
-   Smooth animations and transitions

## Tech Stack

-   **Framework**: Next.js 15 with App Router
-   **Language**: TypeScript
-   **Styling**: Tailwind CSS v4
-   **UI Components**: shadcn/ui
-   **Icons**: Lucide React
-   **State Management**: React Hooks
-   **Audio Processing**: Web Audio API
-   **Video Recording**: MediaRecorder API

## Getting Started

### Prerequisites

1. **Google Cloud Setup**:
   - Create a Google Cloud project
   - Enable the Vertex AI API
   - Set up authentication and get an access token
   - Set the `GCLOUD_ACCESS_TOKEN` environment variable

2. **Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```
   GCLOUD_ACCESS_TOKEN=your_google_cloud_access_token
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Installation

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

### Simple API Structure

The application uses a single, streamlined API endpoint:

- **POST /api/generate** - Generates music and returns audio directly

### Usage Flow

1. **Input**: User enters a prompt describing the desired music
2. **Generation**: API calls Google's Lyria-002 model via Vertex AI
3. **Processing**: Base64 response is converted to audio using `audio-decode`
4. **Output**: Audio file is returned directly to the user for immediate playback/download

### Example API Usage

#### Using the Music API Helper (Recommended)

```javascript
import { musicApi, handleApiError } from '@/lib/axios';

try {
  const result = await musicApi.generateMusic({
    prompt: 'upbeat jazz piano with light drums',
    negativeTags: 'heavy metal, screaming', // optional
  });

  // Audio blob and metadata are returned together
  const audioUrl = URL.createObjectURL(result.audioBlob);
  console.log(`Generated ${result.duration}s of ${result.sampleRate}Hz audio`);
  
} catch (error) {
  const errorMessage = handleApiError(error);
  console.error('Generation failed:', errorMessage);
}
```

#### Using Axios Directly

```javascript
import axios from 'axios';

try {
  const response = await axios.post('/api/generate', {
    prompt: 'upbeat jazz piano with light drums',
    negativeTags: 'heavy metal, screaming', // optional
  }, {
    responseType: 'blob',
    timeout: 300000, // 5 minutes
    headers: {
      'Content-Type': 'application/json',
    }
  });

  const audioBlob = response.data;
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Get metadata from headers
  const duration = parseFloat(response.headers['x-audio-duration']);
  const sampleRate = parseInt(response.headers['x-audio-sample-rate']);
  const channels = parseInt(response.headers['x-audio-channels']);
  
} catch (error) {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out');
    } else if (error.response) {
      console.error('API Error:', error.response.data.error);
    } else {
      console.error('Network Error:', error.message);
    }
  }
}
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `prompt` | string | Yes | Description of the music to generate |
| `negativeTags` | string | No | Elements to avoid in the generation |

### Response

- **Success**: Returns audio file (WAV format) with metadata in headers
- **Error**: Returns JSON with error message

### Response Headers

| Header | Description |
|--------|-------------|
| `Content-Type` | `audio/wav` |
| `Content-Disposition` | Filename for download |
| `X-Audio-Duration` | Duration in seconds |
| `X-Audio-Sample-Rate` | Sample rate in Hz |
| `X-Audio-Channels` | Number of audio channels |

## Example Prompts

- `"upbeat jazz piano with light drums"`
- `"ambient electronic music with synthesizers"`
- `"classical violin solo, melancholic"`
- `"folk guitar with harmonica, happy"`
- `"lo-fi hip hop beats for studying"`

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **HTTP Client**: Axios for API requests
- **AI Model**: Google Vertex AI Lyria-002
- **Audio Processing**: audio-decode library
- **Authentication**: Supabase (configured but optional)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── generate/
│   │       └── route.ts          # Main generation endpoint
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Main UI component
├── lib/
│   └── supabase.ts              # Supabase configuration
└── middleware.ts                # Auth middleware
```

## Development

```bash
# Development server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Other Platforms

Make sure to set the required environment variables:
- `GCLOUD_ACCESS_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## API Limitations

- Requires valid Google Cloud access token
- Subject to Vertex AI API rate limits and quotas
- Generated audio is in WAV format
- No persistent storage (songs are not saved)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is private and proprietary.
-   Node.js 18+
-   npm or pnpm

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vibe-tune.git
cd vibe-tune
```

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Run the development server:

```bash
npm run dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vibe-tune/
├── src/
│   ├── app/
│   │   ├── create/          # Song creation page with video recording
│   │   ├── demo/            # Demo showcase page
│   │   ├── login/           # User authentication
│   │   ├── signup/          # User registration
│   │   ├── song/[id]/       # Individual song player page
│   │   ├── globals.css      # Global styles
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Home page
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   └── lib/
│       └── utils.ts         # Utility functions
├── public/                  # Static assets
└── package.json
```

## Pages

### Home Page (`/`)

-   Landing page with hero section
-   Feature showcase
-   Call-to-action buttons
-   Navigation to other pages

### Login (`/login`)

-   User authentication form
-   Social login options
-   Password visibility toggle
-   Form validation

### Signup (`/signup`)

-   User registration form
-   Password confirmation
-   Terms agreement
-   Social signup options

### Create (`/create`)

-   Video recording interface
-   Text description input
-   Image upload functionality
-   Song generation trigger

### Song Player (`/song/[id]`)

-   Audio player with controls
-   Waveform visualization
-   Song metadata display
-   Download and sharing options

### Demo (`/demo`)

-   App functionality showcase
-   Example results
-   Statistics and testimonials

## Key Features Implementation

### Video Recording

The video recording functionality uses the MediaRecorder API to capture video from the user's camera:

```typescript
const startRecording = async () => {
	const stream = await navigator.mediaDevices.getUserMedia({
		video: { width: { ideal: 1280 }, height: { ideal: 720 } },
		audio: true,
	});

	const recorder = new MediaRecorder(stream, {
		mimeType: "video/webm;codecs=vp9",
	});

	recorder.start();
};
```

### Audio Player

Custom audio player with waveform visualization and full controls:

```typescript
const togglePlay = () => {
	if (audioRef.current) {
		if (isPlaying) {
			audioRef.current.pause();
		} else {
			audioRef.current.play();
		}
		setIsPlaying(!isPlaying);
	}
};
```

## Styling

The app uses a custom design system inspired by Suno with:

-   **Color Palette**: Purple and pink gradients with dark backgrounds
-   **Typography**: Geist Sans and Geist Mono fonts
-   **Effects**: Glass morphism, backdrop blur, and smooth animations
-   **Components**: Consistent card-based layout with subtle borders

## API Integration

The app is designed to integrate with:

-   **Sonu AI**: For music generation from video content
-   **Authentication**: User management and session handling
-   **File Storage**: Video and image upload handling
-   **Audio Processing**: Server-side audio generation and storage

## Development

### Adding New Components

1. Create component in `src/components/ui/`
2. Follow shadcn/ui patterns
3. Use TypeScript for type safety
4. Include proper accessibility attributes

### Styling Guidelines

-   Use Tailwind CSS classes
-   Follow the established color scheme
-   Maintain responsive design
-   Include hover and focus states

### State Management

-   Use React hooks for local state
-   Keep components focused and single-purpose
-   Implement proper error handling
-   Use TypeScript interfaces for data structures

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Other Platforms

The app can be deployed to any platform that supports Next.js:

-   Netlify
-   Railway
-   DigitalOcean App Platform
-   AWS Amplify

## Environment Variables

Create a `.env.local` file with:

```env
# API Keys
SONU_API_KEY=your_sonu_api_key
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Database (if using)
DATABASE_URL=your_database_url
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

-   Inspired by [Suno](https://suno.com) design and functionality
-   Built with [shadcn/ui](https://ui.shadcn.com) components
-   Icons from [Lucide](https://lucide.dev)
-   Powered by [Next.js](https://nextjs.org)

## Support

For support, email support@vibetune.com or create an issue in the GitHub repository.