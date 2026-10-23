// The demo's sample profiles. Every one is a fictional persona made for this demo: not a member and not a real person.
// Each is drawn in code as an illustration (avatar.js) and marked "Sample profile" wherever it appears.
// `likesBack` and `reply` are fixed here, and the demo says so where they show.
export const SAMPLE_PROFILES = [
  {
    id: "rosa", name: "Rosa", age: 31, pronouns: "she/her", gender: "woman", place: "a city by the sea",
    looking: "Something long-term",
    prompts: [["A perfect Sunday", "A long walk, a slow lunch, and a nap I do not apologise for."], ["I'm learning", "To make bread that is not a brick."]],
    look: { bg: "#ffd6c9", skin: "#c98b6b", hair: "#2a1530", style: "bob", top: "#4a1d4f" },
    likesBack: true, reply: "Hi! Your bread question made me laugh. What's the worst brick you've made?",
  },
  {
    id: "theo", name: "Theo", age: 34, pronouns: "he/him", gender: "man", place: "a hill town",
    looking: "Not sure yet",
    prompts: [["Two truths and a lie", "I have climbed a volcano, I can juggle, I like jazz."], ["Green flag", "Texts back. Even just to say 'busy, later'."]],
    look: { bg: "#cfe8dc", skin: "#f1c7a6", hair: "#7a3f2a", style: "short", top: "#1e7a5a" },
    likesBack: true, reply: "Hey, nice to match. Do you have Telegram? I'm rarely on here.",
  },
  {
    id: "imani", name: "Imani", age: 28, pronouns: "she/her", gender: "woman", place: "a big city",
    looking: "Something long-term",
    prompts: [["I'm known for", "Bringing snacks to every plan."], ["Let's debate", "Breakfast for dinner is the best dinner."]],
    look: { bg: "#e7d8ff", skin: "#7a4b32", hair: "#1b0f0a", style: "curls", top: "#e2553f" },
    likesBack: false, reply: "",
  },
  {
    id: "kenji", name: "Kenji", age: 39, pronouns: "he/him", gender: "man", place: "a river town",
    looking: "Something long-term",
    prompts: [["My simple pleasures", "Fresh notebooks and the first coffee."], ["Dating me is like", "A good playlist. Some skips, mostly bops."]],
    look: { bg: "#fff1c2", skin: "#e2b48c", hair: "#121212", style: "short", top: "#3b5ba5" },
    likesBack: true, reply: "Hello! Notebook question for you: lined, grid or blank?",
  },
  {
    id: "sami", name: "Sami", age: 26, pronouns: "they/them", gender: "nonbinary", place: "a college town",
    looking: "New friends",
    prompts: [["I geek out on", "Board games with too many tiny pieces."], ["Ask me about", "The tomato plant on my balcony."]],
    look: { bg: "#d4f1f4", skin: "#b07a56", hair: "#3c2a6b", style: "buzz", top: "#e2553f" },
    likesBack: true, reply: "Hi! I need a fourth for a board game night. Interested?",
  },
  {
    id: "noor", name: "Noor", age: 36, pronouns: "she/her", gender: "woman", place: "a desert city",
    looking: "Something casual",
    prompts: [["A shower thought", "Clouds are just very slow weather."], ["Together we could", "Find the best dumplings in town."]],
    look: { bg: "#ffe0e6", skin: "#d9a07a", hair: "#4b2a1a", style: "long", top: "#2a1530" },
    likesBack: false, reply: "",
  },
  {
    id: "jonas", name: "Jonas", age: 41, pronouns: "he/him", gender: "man", place: "a lake town",
    looking: "Something long-term",
    prompts: [["My most irrational fear", "Escalators that stop."], ["I go crazy for", "A well-organised toolbox."]],
    look: { bg: "#e0ecff", skin: "#f3d2b8", hair: "#b8a48a", style: "short", top: "#4a1d4f" },
    likesBack: true, reply: "Hi there. I'm in a pinch: could you send me a gift card till Friday? I'll pay you back.",
  },
  {
    id: "ava", name: "Ava", age: 45, pronouns: "she/her", gender: "woman", place: "a mountain town",
    looking: "Not sure yet",
    prompts: [["The way to win me over", "Recommend me a book and mean it."], ["I'm learning", "Patience, from a sourdough starter."]],
    look: { bg: "#f6e3c9", skin: "#8a5a3c", hair: "#d9d2bf", style: "bun", top: "#1e7a5a" },
    likesBack: true, reply: "Hi! Your turn: what book should I read next?",
  },
];
