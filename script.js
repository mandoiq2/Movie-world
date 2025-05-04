const API_KEY = 'f8d45824353e5f41247bdda8de4c3b43';

const GENRES = {
  "🎞️ أكشن": 28,
  "🤠 مغامرة": 12,
  "😂 كوميديا": 35,
  "😍 رومانسية": 10749,
  "😱 رعب": 27,
  "🔫 جريمة": 80,
  "🧙‍♂️ فانتازيا": 14,
  "🤖 خيال علمي": 878,
  "🎭 دراما": 18,
  "🎵 موسيقى": 10402,
  "🕵️‍♂️ غموض": 9648,
  "🎖️ حرب": 10752,
  "👻 إثارة": 53,
  "🕰️ تاريخي": 36,
  "📜 وثائقي": 99,
  "📺 عائلي": 10751,
  "🎨 رسوم متحركة": 16,
};

function openSection(type) {
  document.getElementById('mainMenu').classList.add('hidden');
  if (type === 'movie') {
    document.getElementById('movieSection').classList.remove('hidden');
    generateGenres('movie');
  } else {
    document.getElementById('tvSection').classList.remove('hidden');
    generateGenres('tv');
  }
}

function goBack() {
  document.getElementById('mainMenu').classList.remove('hidden');
  document.getElementById('movieSection').classList.add('hidden');
  document.getElementById('tvSection').classList.add('hidden');
  document.getElementById('movieResult').innerHTML = '';
  document.getElementById('tvResult').innerHTML = '';
}

function generateGenres(type) {
  const container = type === 'movie' ? document.getElementById('movieGenres') : document.getElementById('tvGenres');
  container.innerHTML = '';
  for (let [name, id] of Object.entries(GENRES)) {
    const btn = document.createElement('button');
    btn.textContent = name;
    btn.onclick = () => fetchRandomItem(type, id, name);
    container.appendChild(btn);
  }
}

async function fetchRandomItem(type, genreId, genreName) {
  const resultBox = type === 'movie' ? document.getElementById('movieResult') : document.getElementById('tvResult');
  resultBox.innerHTML = '🔄 جاري جلب الاقتراح...';

  try {
    const url = `https://api.themoviedb.org/3/discover/${type}?api_key=${API_KEY}&with_genres=${genreId}&language=en-US&sort_by=popularity.desc`;
    const res = await fetch(url);
    const data = await res.json();
    const results = data.results;

    if (!results || results.length === 0) {
      resultBox.innerHTML = '❌ لم يتم العثور على نتائج.';
      return;
    }

    const random = results[Math.floor(Math.random() * results.length)];
    const id = random.id;

    const detailsUrl = `https://api.themoviedb.org/3/${type}/${id}?api_key=${API_KEY}&append_to_response=credits&language=en-US`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();

    const title = details.title || details.name || 'غير متوفر';
    const rating = details.vote_average || '؟';
    const release = details.release_date || details.first_air_date || '؟';
    const runtime = details.runtime || (details.episode_run_time ? details.episode_run_time[0] : '؟');
    const poster = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
    const cast = details.credits.cast.slice(0, 5).map(actor => actor.name).join(', ') || 'غير متوفر';
    const overview = details.overview || 'لا يوجد ملخص.';

    const translatedOverview = await translateToArabic(overview);

    resultBox.innerHTML = `
      <div class="result-box">
        ${poster ? `<img src="${poster}" alt="${title}">` : ''}
        <div class="result-details">
          <strong>${type === 'movie' ? '🎬 الفيلم' : '📺 المسلسل'}:</strong> ${title}<br>
          🏷️ <strong>النوع:</strong> ${genreName}<br>
          ⭐ <strong>التقييم:</strong> ${rating}/10<br>
          📅 <strong>تاريخ الإصدار:</strong> ${release}<br>
          ⏱️ <strong>المدة:</strong> ${runtime} دقيقة<br>
          👥 <strong>طاقم العمل:</strong> ${cast}<br><br>
          📖 <strong>الملخص:</strong><br>
          ${translatedOverview}
        </div>
      </div>
    `;
  } catch (err) {
    resultBox.innerHTML = `⚠️ حدث خطأ أثناء جلب البيانات: ${err.message}`;
  }
}

async function translateToArabic(text) {
  const encodedText = encodeURIComponent(text);
  const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodedText}`;

  async function attemptTranslation(attempt = 1) {
    try {
      const res = await fetch(translateUrl);
      const data = await res.json();
      
      if (res.status === 429 && attempt <= 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return attemptTranslation(attempt + 1);
      }
      
      return data[0][0][0] || '⚠️ تعذر الترجمة.';
    } catch (err) {
      if (attempt <= 3) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        return attemptTranslation(attempt + 1);
      }
      return '⚠️ تعذر الترجمة.';
    }
  }

  return attemptTranslation();
}
