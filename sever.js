const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors()); // allow requests from your frontend

const PORT = 3000;

// TMDB Config
const TMDB_KEY = '2a48fa3779af50f428b6d5f73d4d8ba7';
const TMDB_BASE = 'https://api.themoviedb.org/3';

// Test route
app.get('/', (req, res) => {
    res.send('Movie backend is running!');
});

// Fetch trending movies
app.get('/movies/trending', async (req, res) => {
    try {
        const response = await axios.get(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// Fetch single movie by ID
app.get('/movies/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const response = await axios.get(`${TMDB_BASE}/movie/${id}?api_key=${TMDB_KEY}&append_to_response=videos`);
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movie' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
