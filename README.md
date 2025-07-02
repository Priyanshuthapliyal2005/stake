
# Stake: Real-Time Debate Platform

> A modern, real-time debate platform with live speech recognition, captioning, summaries, and collaborative features for anchors, organisers, and participants.

## Features

- **Live Debate Rooms**: Create, join, and organise debate rooms in real time.
- **Automatic Speech Recognition**: Real-time transcription and captioning for anchors and participants.
- **Live Captions Display**: Captions are streamed and displayed for all users in a room.
- **Debate Summaries**: Generate and view summaries of debates.
- **Role Management**: Organiser, anchor, and participant roles with tailored controls.
- **Supabase Integration**: Authentication, real-time data, and storage powered by Supabase.
- **Voice & WebRTC**: Voice call and WebRTC support for seamless communication.
- **Modern UI**: Built with React, TailwindCSS, and Vite for a fast, responsive experience.

## Tech Stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Supabase](https://supabase.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Socket.io](https://socket.io/)
- [TypeScript](https://www.typescriptlang.org/)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
git clone https://github.com/Priyanshuthapliyal2005/stake.git
cd stake
npm install
# or
yarn install
```

### Development

```bash
npm run dev
# or
yarn dev
```
The app will be available at `http://localhost:5173` by default.

### Build for Production

```bash
npm run build
# or
yarn build
```

### Linting

```bash
npm run lint
# or
yarn lint
```

## Project Structure

```
src/
	components/      # Reusable UI components (AuthForm, CaptionsDisplay, etc.)
	hooks/           # Custom React hooks (useAuth, useCaptions, useSpeechRecognition, etc.)
	lib/             # Supabase and Gemini API clients
	pages/           # Main app pages (HomePage, RoomPage, LiveDebatePage, etc.)
	types/           # TypeScript type definitions
	index.css        # Global styles (TailwindCSS)
	App.tsx          # Main app component
	main.tsx         # App entry point
supabase/          # Database migrations and SQL
```

## Environment Variables

Create a `.env` file in the root with your Supabase credentials:

```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements and bug fixes.

## License

MIT
