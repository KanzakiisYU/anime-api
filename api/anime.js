const fs = require("fs");
const axios = require("axios");
const cheerio = require("cheerio");

// Fungsi untuk mengambil nomor episode dari judul
function extractEpisodeNumber(title) {
  const regex = /Episode (\d+)/i;
  const match = title.match(regex);
  return match ? match[1] : null;
}

const baseUrl = "https://animeindo.pics/";
const cookies =
  "_ga=GA1.1.697424924.1707609774; HstCfa4546282=1707609773673; __dtsu=6D001707721535E1487907097AC30715; _cc_id=940b0c8ca634bb036e73bc7e22aff264; HstCmu4546282=1710756722731; HstCnv4546282=1; HstCns4546282=1; _ga_LN4KSZCWTR=GS1.1.1710756723.4.1.1710757754.0.0.0; HstCla4546282=1710757755044; HstPn4546282=14; HstPt4546282=14";

// Header User-Agent yang akan digunakan
const userAgentHeader = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0",
  Cookie: cookies, // Tambahkan cookie ke header
};

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
// Fungsi untuk mengambil data dari situs web dengan menggunakan cookie
async function fetchDataWithCookie() {
  try {
    const response = await axios.get(baseUrl);
    const html = response.data;
    //  console.log("RONDE 1: "+html);
    const $ = cheerio.load(html);

    const newVideos = [];
    const getEpisodeLink = [];
    const getDescFromURL = [];
    const getGofileUrl = [];
    const getDownloadAnime = [];
    const downloadAnime = [];

    // Lakukan scraping data di sini hingga 10 item
    $("div.bixbox.bbnofrm > div.listupd.flex > div.excstf > article").each(
      async (index, element) => {
        if (index >= 6) return false;
        console.log(index)
        if (newVideos.length >= 6) return false; // Berhenti jika sudah mencapai batas 10

        const title = $(element).find("div.bsx > a").attr("title");
        const imageUrl = $(element)
          .find("a > div.limit > img")
          .attr("src")
          .replace(/(\?resize=)\d+,\d+/, "");
        const slug = $(element).find("div.bsx > a").attr("href") ?? "";
        const episodeTitle = title;
        const episodeNumber = extractEpisodeNumber(episodeTitle);
        const listvid = index + 1;

        let thisAnime = {
          updateAt: "",
          sinopsis: "",
          genre: "",
          streamUrl: "",
        };
        getEpisodeLink.push(
          delay(3000) // Delay 3 detik (3000 milidetik)
            .then(() => axios.get(slug))
            .then((response) => {
              const animeHtml = response.data;
              const $anime = cheerio.load(animeHtml);
              const updateAt = $anime(
                "div.megavid > div > div.item.meta > div.lm > span.year > span.updated",
              ).text();
              const getDescURL = $anime("div.megavid > div > div.item.meta > div.lm > span.year > a").attr("href");
              let goStreamUrl;
              $anime(".soraurlx").each(function (index, element) {
if ($(element).find("strong").text().trim() === "720p") {
              goStreamUrl = $(element).find('a[href*="gofile"]').attr("href");
     }
    });

              console.log(goStreamUrl);
              getDescFromURL.push(
                axios
                  .get(getDescURL)
                  .then((response) => {
                    const descPageHTML = response.data;
                    const $getDesc = cheerio.load(descPageHTML);
                    const getSinopsis = $getDesc("div.bixbox.synp > div.entry-content > p").text();
                    const genres = [];
$getDesc('div.bixbox.animefull > div > div.infox > div > div.info-content > div.genxed > a').each(function(index, element) {
                        genres.push($(element).text());
                    });

                    // Menggabungkan teks-teks genre dengan koma sebagai pemisah
                    const getGenre = genres.join(', ');

                    thisAnime.updateAt = updateAt;
                    thisAnime.sinopsis = getSinopsis;
                    thisAnime.genre = getGenre;
                    thisAnime.streamUrl = goStreamUrl;

                    const animeJson = {
                      judul: title,
                      gambar: imageUrl,
                      slug: slug,
                      episode: "episode " + episodeNumber,
                      list: listvid,
                      thisAnime: thisAnime,
                    };
                    if (
                      thisAnime.updateAt !== null &&
                      thisAnime.updateAt !== undefined &&
                      thisAnime.sinopsis !== null &&
                      thisAnime.sinopsis !== undefined &&
                      thisAnime.genre !== null &&
                      thisAnime.genre !== undefined &&
                      thisAnime.streamUrl !== null &&
                      thisAnime.streamUrl !== undefined
                    ) {
                      newVideos.push(animeJson);
                    }
                  })
                  .catch((error) => {
                    console.error("Error fetching download page:", error);
                  }),
              );
            })
            .catch((error) => {
              return true;
              console.error("Error fetching anime page:", error);
            })
            .finally(() => {
              // Kode yang akan dijalankan setelah permintaan get(slug) selesai, tidak peduli berhasil atau gagal
            }),
        );
      },
    );

    await Promise.all(getEpisodeLink);
    await Promise.all(getGofileUrl);
    await Promise.all(getDescFromURL);
    await Promise.all(getDownloadAnime);
    await Promise.all(downloadAnime);
    newVideos.sort((a, b) => a.list - b.list);

    // Baca data lama dari file JSON
    let oldVideos = readJsonFile("update-anime-web.json");

    // Bandingkan dengan data lama untuk menentukan isNewAnime
    newVideos.forEach((video) => {
      video.isNewAnime = !oldVideos.some(
        (oldVideo) => oldVideo.slug === video.slug,
      );
    });

    // Set isNewAnime false untuk video lama yang tidak ada di video baru
    oldVideos.forEach((oldVideo) => {
      if (!newVideos.some((newVideo) => newVideo.slug === oldVideo.slug)) {
        oldVideo.isNewAnime = false;
        newVideos.push(oldVideo); // Tambahkan kembali video lama ke daftar baru
      }
    });

    // Set isUpdate true jika ada isNewAnime yang true, jika tidak, set false
    const isUpdate = newVideos.some((video) => video.isNewAnime);

    // Jika tidak ada anime baru, log "BELOM ADA UPDATE ANIME"
    if (!newVideos.some((video) => video.isNewAnime)) {
      console.log("BELOM ADA UPDATE ANIME");
    }

    // Simpan hanya 3 item dari video baru ke dalam file JSON
    const updatedList = newVideos.slice(0, 6);
    saveToJson(
      { isUpdate: isUpdate, "update-anime-web": updatedList },
      "update-anime-web.json",
    );
    console.log("Data saved successfully.");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

// Fungsi untuk membaca file JSON
function readJsonFile(filename) {
  try {
    const jsonString = fs.readFileSync(filename);
    if (!jsonString || jsonString.length === 0) {
      throw new Error("File JSON kosong atau tidak valid");
    }
    const jsonData = JSON.parse(jsonString);
    return jsonData["update-anime-web"] || [];
  } catch (error) {
    console.error("Error reading JSON file:", error.message);
    return [];
  }
}

function getCurrentDate() {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // January is 0!
  const year = today.getFullYear();

  return `${day}/${month}/${year}`;
}

// Fungsi untuk menyimpan data JSON ke file
function saveToJson(data, filename) {
  fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

// Panggil fungsi untuk memulai scraping
module.exports = { fetchDataWithCookie };
