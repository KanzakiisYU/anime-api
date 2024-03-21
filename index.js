const express = require('express');
const app = express();
const fs = require('fs');
const updateThisAnime = require('./anime.js');

// Endpoint untuk mengeksekusi animeUpdater setiap 1 jam
app.get('/update-anime', async (req, res) => {
  try {
    await updateThisAnime(); // Panggil fungsi animeUpdater
    res.send('Anime update process started.');
  } catch (e){
    console.log(e)
  }
});

// Port server Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
