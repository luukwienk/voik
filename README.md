# Voik - Voice Task Manager

Voik is a voice-activated task management application that allows users to create and manage tasks using voice commands.

## Features

- Voice-activated task creation
- Task list management
- Google Calendar integration for scheduling tasks

## Prerequisites

Before you begin, ensure you have met the following requirements:
* You have installed the latest version of [Node.js and npm](https://nodejs.org/)
* You have a Google account for Calendar integration
* You have an OpenAI account for voice recognition capabilities

## Installing Voik

To install Voik, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/voik.git
   ```
2. Navigate to the project directory:
   ```
   cd voik
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Configuration

1. Copy the `.env.example` file to `.env`:
   ```
   cp .env.example .env
   ```
2. Open the `.env` file and fill in your API keys:
   ```
   VITE_OPENAI_API_KEY=your_openai_api_key_here
   VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
   VITE_GOOGLE_API_KEY=your_google_api_key_here
   VITE_GOOGLE_CLIENT_SECRET=your_google_client_secret_here
   ```

## Using Voik

To use Voik, follow these steps:

1. Start the development server:
   ```
   npm run dev
   ```
2. Open your web browser and navigate to `http://localhost:3000` (or the port specified in the console)

## Contributing to Voik

To contribute to Voik, follow these steps:

1. Fork this repository.
2. Create a branch: `git checkout -b <branch_name>`.
3. Make your changes and commit them: `git commit -m '<commit_message>'`
4. Push to the original branch: `git push origin <project_name>/<location>`
5. Create the pull request.

Alternatively, see the GitHub documentation on [creating a pull request](https://help.github.com/articles/creating-a-pull-request/).

## Contact

If you want to contact me, you can reach me at `<luukwienk@gmail.com>`.

## License

This project uses the following license: [MIT License](<link_to_license>).