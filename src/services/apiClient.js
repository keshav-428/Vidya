import { topicsMap } from '../utils/constants';

// Simulated API Client to prepare for Phase 2 (FastAPI integration)
// Using this structure allows us to easily swap these out with real fetch/axios calls later.

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const api = {
    // Syncs user progress to the backend
    saveProgress: async (userId, data) => {
        await delay(500);
        console.log("Mock Save Progress:", data);
        return { success: true };
    },

    // Asks Gemini a question grounded in the syllabus via our dedicated API
    askQuestion: async (query, context) => {
        await delay(1500);
        return {
            answer: `This is a mock answer from the local service regarding: "${query}". In Phase 4, this will hit our FastAPI endpoint.`,
            flashcards: [
                { q: `What is ${query}?`, a: "A fundamental concept." },
                { q: "Key Principle", a: "Core rule for this concept." }
            ]
        };
    },

    // Fetches the user's roadmap and topics
    getRoadmap: async (classLevel) => {
        await delay(300);
        return topicsMap[classLevel] || topicsMap['Class 6'];
    }
};
