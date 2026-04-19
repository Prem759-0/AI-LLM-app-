# Cortex AI - Advanced Intelligence Platform

Cortex AI is a high-performance, premium AI chat application powered by Google's Gemini models. It features a sophisticated UI, real-time streaming, and a suite of advanced tools for research, creativity, and productivity.

## ✨ Key Features

- **Multi-Model Support**: Switch between Gemini Flash, Pro, and Thinking models.
- **Real-Time Streaming**: Experience lightning-fast, token-by-token responses.
- **Advanced Modes**:
  - 🔍 **Research Mode**: Deep analysis with comprehensive synthesis.
  - 🎨 **Creative Mode**: Imaginative and poetic response generation.
- **Voice Interaction**:
  - 🎙️ **Voice Input**: Speak your prompts directly.
  - 🔊 **Text-to-Speech**: Listen to AI responses.
- **File Context**: Attach text-based files (.txt, .md, .js, .json) to your chat for context-aware assistance.
- **Smart History**: Manage your conversations with search, bulk delete, and inline renaming.
- **Export Options**: Download your chats in .txt or .json formats.
- **Premium Design**: Fully responsive, glassmorphic UI with smooth animations.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## 🛠 Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion, Lucide Icons
- **AI Integration**: Google Generative AI SDK (@google/genai)
- **UI Components**: Radix UI, shadcn/ui
- **Markdown**: React Markdown, Remark GFM

## 📄 License

This project is licensed under the MIT License.

