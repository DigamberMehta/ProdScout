import express from 'express';
import fetch from 'node-fetch';
import mongoose from 'mongoose';
import session from 'express-session';
import passport from 'passport';
import LocalStrategy from 'passport-local';
import User from './models/user.js'; // Import your User model
import isLoggedIn from './middlware.js'; // Import your middleware function

const app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mongoose connection
const dbUrl = process.env.DB_URL || "mongodb+srv://digambermehta2603:AuelLSKJHHohPw60@cluster0.brpld.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
console.log(dbUrl);
main()
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));
async function main() {
  await mongoose.connect(dbUrl);
}

// Session configuration
app.use(
  session({
    secret: 'replaceThisWithASecretKey', // Replace with your own secret
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

// Configure Passport to use the local strategy
passport.use(new LocalStrategy(User.authenticate()));

// How to store user information in session
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Sample User Model with Passport-Local-Mongoose plugin
// Import User Model (Assuming you have a user.js with passport-local-mongoose configured)

// Authentication routes

// Signup Route
app.get('/signup', (req, res) => {
  res.render('users/signup');
});

app.post('/signup', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const user = new User({ email, username });
    await User.register(user, password);
    req.login(user, (err) => {
      if (err) {
        console.error(err);
        return res.redirect('/signup');
      }
      res.redirect('/');
    });
  } catch (error) {
    console.error('Error signing up:', error);
    res.redirect('/signup');
  }
});

// Login Route
app.get('/login', (req, res) => {
  res.render('users/login');
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
  }),
  (req, res) => {
    res.redirect('/');
  }
);

// Logout Route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error logging out:', err);
    }
    res.redirect('/');
  });
});

// Directly use API keys provided
const GEMINI_API_KEY = "AIzaSyBTjDbammUOohTge5Q642-nqR4cbR3diJY";
const EXTERNAL_USER_ID = "Void_Walkerz";
const AMAZON_API_KEY = "pEi6n7JwkghzUf01meReyw1nnp8KcJGg";
const INTERNET_SHOPPING_API_KEY = "pEi6n7JwkghzUf01meReyw1nnp8KcJGg";

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// 1. Amazon API Functions
async function createChatSessionAmazon(apiKey) {
  const response = await fetch("https://api.on-demand.io/chat/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      pluginIds: [],
      externalUserId: EXTERNAL_USER_ID,
    }),
  });

  const data = await response.json();
  return data.data.id;
}

async function submitQueryAmazon(apiKey, sessionId, query) {
  const response = await fetch(
    `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        endpointId: "predefined-openai-gpt4o",
        query: query,
        pluginIds: ["plugin-1716334779"],
        responseMode: "sync",
      }),
    }
  );

  const data = await response.json();
  return data.data.answer;
}

// 2. Internet Shopping API Functions
async function createChatSessionInternetShopping(apiKey) {
  const response = await fetch("https://api.on-demand.io/chat/v1/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
    },
    body: JSON.stringify({
      pluginIds: [],
      externalUserId: EXTERNAL_USER_ID,
    }),
  });

  const data = await response.json();
  return data.data.id;
}

async function submitQueryInternetShopping(apiKey, sessionId, query) {
  const response = await fetch(
    `https://api.on-demand.io/chat/v1/sessions/${sessionId}/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: apiKey,
      },
      body: JSON.stringify({
        endpointId: "predefined-openai-gpt4o",
        query: query,
        pluginIds: ["plugin-1716119225"],
        responseMode: "sync",
      }),
    }
  );

  const data = await response.json();
  return data.data.answer;
}

// 3. Function to send reviews to Gemini API for summarization
async function sendReviewsToGemini(reviewInternetShopping, reviewAmazon) {
  const content = `Here are two product reviews from different sources. Summarize them and provide a final recommendation if the product should be purchased or not:\n\n1. Internet Shopping Review:\n${reviewInternetShopping}\n\n2. Amazon Review:\n${reviewAmazon}`;

  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: content,
          },
        ],
      },
    ],
  };

  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  return data.candidates[0]?.content?.parts[0]?.text || "No summary available";
}

// 4. Function to interact with the Gemini API
async function sendToGeminiAPI(content) {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: content,
          },
        ],
      },
    ],
  };

  const response = await fetch(`${API_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

// 5. Function to get follow-up questions
async function getFollowUpQuestions(productType) {
  const content = `Please provide the most important parameters or factors to consider when buying a ${productType}. List up to 5 key considerations.`;
  const data = await sendToGeminiAPI(content);

  if (data && data.candidates && data.candidates.length > 0) {
    const candidate = data.candidates[0];
    const parameters = candidate.content.parts[0].text
      .split("\n")
      .filter((line) => line.trim() !== "")
      .slice(0, 5);
    return parameters;
  }

  return [];
}


// 6. Function to get product recommendations
async function getProductRecommendations(answers) {
  const content = `Find product recommendations with ordering references and best prices based on the following answers: ${JSON.stringify(
    answers
  )}`;

  const data = await sendToGeminiAPI(content);

  if (data && data.candidates && data.candidates.length > 0) {
    const recommendations = data.candidates[0].content.parts[0].text
      .split("\n")
      .filter((line) => line.trim() !== "");
    return recommendations;
  }

  return [];
}

// 7. Function to summarize the product need
async function summarizeProductNeed(productType, answers) {
  const content = `🔍 Please provide a clear and concise summary of the user's needs for a ${productType} based on the following answers: ${JSON.stringify(
    answers
  )}. Use emojis to make it more engaging and easier to understand.`;

  const data = await sendToGeminiAPI(content);

  if (data && data.candidates && data.candidates.length > 0) {
    const summary = data.candidates[0].content.parts[0].text;
    return summary || "🔍 No summary available.";
  }

  return "🔍 No summary available.";
}


// Main Routes

app.get('/', isLoggedIn,(req, res) => {
  res.render('index');
});

app.get('/questions', (req, res) => {
  res.render('questions', { questions: [], productType: '' });
});

app.get('/recommendations', (req, res) => {
  const recommendations = JSON.parse(req.query.recommendations || '[]');
  res.render('recommendations', { recommendations });
});

app.get('/results', (req, res) => {
  res.render('results', { finalVerdict: '', summary: '' });
});

app.post('/questions', async (req, res) => {
  const productType = req.body.productName;
  try {
    const questions = await getFollowUpQuestions(productType);
    res.json({ questions });
  } catch (error) {
    console.error("Error fetching follow-up questions:", error);
    res.status(500).json({ error: "An error occurred while fetching follow-up questions." });
  }
});

app.post('/recommendations', async (req, res) => {
  const answers = req.body.answers;
  try {
    const recommendations = await getProductRecommendations(answers);
    res.json({ recommendations });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    res.status(500).json({ error: "An error occurred while fetching recommendations." });
  }
});

app.post('/results', async (req, res) => {
  const { selectedProduct } = req.body;
  let reviewAmazon, reviewInternetShopping;

  try {
    const sessionIdAmazon = await createChatSessionAmazon(AMAZON_API_KEY);
    reviewAmazon = await submitQueryAmazon(AMAZON_API_KEY, sessionIdAmazon, `give me review of ${selectedProduct}`);

    const sessionIdInternetShopping = await createChatSessionInternetShopping(INTERNET_SHOPPING_API_KEY);
    reviewInternetShopping = await submitQueryInternetShopping(INTERNET_SHOPPING_API_KEY, sessionIdInternetShopping, `give me review of ${selectedProduct}`);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({ error: "Error occurred while fetching reviews." });
  }

  try {
    const finalVerdict = await sendReviewsToGemini(reviewInternetShopping, reviewAmazon);
    const summary = await summarizeProductNeed(selectedProduct, req.body.answers);

    res.render('results', {
      reviewAmazon,
      reviewInternetShopping,
      finalVerdict,
      summary
    });
  } catch (error) {
    console.error("Error generating final verdict:", error);
    res.status(500).send("Error occurred while generating the final verdict and summary.");
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
