// server.js
const express = require('express');
const fs = require('fs');
const { fetchDataWithCookie } = require('../anime.js'); // Ubah sesuai dengan path file anime.js

const app = express();
const PORT = 3000; // Port yang digunakan, sesuaikan jika diperlukan

// Middleware untuk mengeksekusi animeScript saat mengakses URL /anime
app.get('/anime', async (req, res) => {
   
        await fetchDataWithCookie(); // Jalankan animeScript
        const jsonData = fs.readFileSync('update-anime-web.json', 'utf8');
        res.json(JSON.parse(jsonData));
  
});

app.get('/', (req, res) => {
res.send('api aktif')
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
