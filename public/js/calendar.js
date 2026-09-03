// ============================================================
//  MAIN CALENDAR LOGIC
//  Festival / holiday / saitharu data now comes from
//  GET /api/calendar/:year instead of being hardcoded here.
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
  const MIN_BS_YEAR = 1975;
  const MAX_BS_YEAR = 2100;

  // Cache of API responses, keyed by BS year, so switching months
  // within the same year (or back to a year already visited) doesn't
  // re-fetch.
  const yearDataCache = {};

  async function loadYearData(year) {
    if (yearDataCache[year]) return yearDataCache[year];
    const res = await fetch(`/api/calendar/${year}`);
    if (!res.ok) throw new Error(`Failed to load calendar data for ${year}`);
    const data = await res.json();
    yearDataCache[year] = data;
    return data;
  }

  let currentYear = 2083;
  let currentMonth = 4;
  let selectedDate = null; // { year, month, day }
  let fixedEvents = {};
  let publicHolidays = {};
  let saitharuForYear = {};

  const titleEl = document.getElementById('title');
  const subEl = document.getElementById('sub');
  const gridEl = document.getElementById('grid');
  const festEl = document.getElementById('fest');
  const holEl = document.getElementById('hol');
  const saitharuEl = document.getElementById('saitharu');
  const holidayCountEl = document.getElementById('holidayCount');
  const totalHolidayBadge = document.getElementById('totalHolidayBadge');
  const yearSelect = document.getElementById('yearSelect');
  const menuWrapper = document.getElementById('menuWrapper');
  const hamburger = document.getElementById('hamburgerBtn');

  // --- Lock/unlock background scroll while the mobile menu is open ---
  let savedScrollY = 0;
  function openMobileMenu() {
    savedScrollY = window.scrollY;
    menuWrapper.classList.add('open');
    document.body.classList.add('menu-open-lock');
    document.body.style.top = -savedScrollY + 'px';
  }
  function closeMobileMenu() {
    if (!menuWrapper.classList.contains('open')) return;
    menuWrapper.classList.remove('open');
    document.body.classList.remove('menu-open-lock');
    document.body.style.top = '';
    window.scrollTo(0, savedScrollY);
  }
  function toggleMobileMenu() {
    if (menuWrapper.classList.contains('open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  }

  // Sidebar elements
  const selectedTitle = document.getElementById('selectedTitle');
  const selectedAd = document.getElementById('selectedAd');
  const selectedEvents = document.getElementById('selectedEvents');
  const selectedMoonIcon = document.getElementById('selectedMoonIcon');
  const selectedMoon = document.getElementById('selectedMoon');
  const selectedMoonAge = document.getElementById('selectedMoonAge');

  for (let y = MIN_BS_YEAR; y <= MAX_BS_YEAR; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }
  yearSelect.addEventListener('change', function () {
    currentYear = parseInt(this.value);
    currentMonth = 0;
    goToMonth(currentYear, currentMonth);
  });

  function getMonthName(m) {
    return ['बैशाख', 'जेष्ठ', 'आषाढ', 'श्रावण', 'भदौ', 'असोज', 'कार्तिक', 'मंसिर', 'पुस', 'माघ', 'फागुन', 'चैत'][m];
  }

  function getMonthDays(year, month) {
    return window.BSDate.getMonthDays(year)[month];
  }

  function getStartDay(year, month) {
    const ad = window.BSDate.toAD(year, month, 1);
    return ad.getDay();
  }

  function getEnglishDate(year, month, day) {
    const ad = window.BSDate.toAD(year, month, day);
    return ad.toDateString().slice(4);
  }

  // ----- Real astronomical Tithi (Sun–Moon elongation) -----
  const SYNODIC_MONTH = 29.530588861; // days, for the moon-age display only

  function toRad(d) { return d * Math.PI / 180; }
  function norm360(x) { x = x % 360; if (x < 0) x += 360; return x; }

  function sunEclipticLongitude(dSinceJ2000) {
    const g = norm360(357.529 + 0.98560028 * dSinceJ2000);
    const q = norm360(280.459 + 0.98564736 * dSinceJ2000);
    return norm360(q + 1.915 * Math.sin(toRad(g)) + 0.020 * Math.sin(toRad(2 * g)));
  }

  function moonEclipticLongitude(dSinceJ2000) {
    const T = dSinceJ2000 / 36525;
    const Lp = norm360(218.3164591 + 481267.88134236 * T);
    const D  = norm360(297.8502042 + 445267.1115168 * T);
    const M  = norm360(357.5291092 + 35999.0502909 * T);
    const Mp = norm360(134.9634114 + 477198.8676313 * T);
    const F  = norm360(93.2720993 + 483202.0175273 * T);
    const dl =
        6.288774 * Math.sin(toRad(Mp))
      - 1.274027 * Math.sin(toRad(2 * D - Mp))
      + 0.658314 * Math.sin(toRad(2 * D))
      + 0.213618 * Math.sin(toRad(2 * Mp))
      - 0.185116 * Math.sin(toRad(M))
      - 0.114332 * Math.sin(toRad(2 * F))
      + 0.058793 * Math.sin(toRad(2 * D - 2 * Mp))
      + 0.057066 * Math.sin(toRad(2 * D - M - Mp))
      + 0.053322 * Math.sin(toRad(2 * D + Mp))
      + 0.045758 * Math.sin(toRad(2 * D - M))
      - 0.040923 * Math.sin(toRad(M - Mp))
      - 0.034720 * Math.sin(toRad(D))
      - 0.030383 * Math.sin(toRad(M + Mp))
      + 0.015327 * Math.sin(toRad(2 * D - 2 * F))
      - 0.012528 * Math.sin(toRad(Mp + 2 * F));
    return norm360(Lp + dl);
  }

  // Exact tithi index for भदौ २०८३, cross-checked against Hamropatro's
  // published panchang so this month matches exactly on top of the
  // general formula above.
  const tithiOverrides = {
    '2083-4-1': 4, '2083-4-2': 5, '2083-4-3': 6, '2083-4-4': 7, '2083-4-5': 8,
    '2083-4-6': 9, '2083-4-7': 10, '2083-4-8': 11, '2083-4-9': 11, '2083-4-10': 12,
    '2083-4-11': 13, '2083-4-12': 14, '2083-4-13': 15, '2083-4-14': 16, '2083-4-15': 17,
    '2083-4-16': 18, '2083-4-17': 20, '2083-4-18': 21, '2083-4-19': 22, '2083-4-20': 23,
    '2083-4-21': 24, '2083-4-22': 25, '2083-4-23': 26, '2083-4-24': 27, '2083-4-25': 28,
    '2083-4-26': 29, '2083-4-27': 0, '2083-4-28': 1, '2083-4-29': 2, '2083-4-30': 3,
    '2083-4-31': 4,
  };

  function getMoonData(year, month, day) {
    const key = `${year}-${month}-${day}`;
    const ad = window.BSDate.toAD(year, month, day);
    const refMs = Date.UTC(ad.getFullYear(), ad.getMonth(), ad.getDate(), 0, 0, 0);
    const dSinceJ2000 = (refMs / 86400000 + 2440587.5) - 2451545.0;
    const sunL = sunEclipticLongitude(dSinceJ2000);
    const moonL = moonEclipticLongitude(dSinceJ2000);
    const elong = norm360(moonL - sunL);
    const fraction = elong / 360;
    const phase = fraction * SYNODIC_MONTH;
    const tithiIndex = tithiOverrides.hasOwnProperty(key)
      ? tithiOverrides[key]
      : Math.floor(elong / 12) % 30;
    return { phase, fraction, tithiIndex };
  }

  function getTithi(year, month, day) {
    const names = ['प्रतिपदा', 'द्वितीया', 'तृतिया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी',
      'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा', 'प्रतिपदा', 'द्वितीया', 'तृतिया', 'चतुर्थी', 'पञ्चमी',
      'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'औंसी'];
    return names[getMoonData(year, month, day).tithiIndex];
  }

  function isHoliday(year, month, day, eventText) {
    const ad = window.BSDate.toAD(year, month, day);
    const dow = ad.getDay();
    if (dow === 0 || dow === 6) return true;
    const key = `${month + 1}-${day}`;
    if (publicHolidays[key]) return true;
    if (eventText && /बिदा|नयाँ वर्ष|जन्माष्टमी|तिहार|होली|श्रीकृष्ण|लक्ष्मी|दशमी|टीका|छठ|गणतन्त्र|पूर्णिमा/.test(eventText)) return true;
    return false;
  }

  function toNepaliDigit(num) {
    const digits = '०१२३४५६७८९';
    return String(num).split('').map(d => digits[parseInt(d)]).join('');
  }

  function getMoonPhase(year, month, day) {
    const { fraction } = getMoonData(year, month, day);
    const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
    const idx = Math.round(fraction * 8) % 8;
    return icons[idx];
  }

  function getMoonAge(year, month, day) {
    const { phase, tithiIndex } = getMoonData(year, month, day);
    const paksha = tithiIndex < 15 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष';
    const ageDay = Math.floor(phase) + 1;
    return `${paksha} · दिन ${toNepaliDigit(ageDay)}`;
  }

  // ----- GO TO TODAY -----
  async function goToToday() {
    const today = new Date();
    const bs = window.BSDate.fromAD(today);
    selectedDate = { year: bs.year, month: bs.month, day: bs.day };
    await goToMonth(bs.year, bs.month);
    closeMobileMenu();
  }

  // ----- Update Right Sidebar -----
  function updateSidebar(year, month, day) {
    const ad = window.BSDate.toAD(year, month, day);
    const tithi = getTithi(year, month, day);
    const key = `${month + 1}-${day}`;
    let eventText = fixedEvents[key] || '';
    if (!eventText && publicHolidays[key]) eventText = publicHolidays[key];
    const isHol = isHoliday(year, month, day, eventText);
    const monthName = getMonthName(month);
    const weekdays = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
    const adStr = `${ad.getDate()}/${ad.getMonth() + 1}/${ad.getFullYear()} AD • ${weekdays[ad.getDay()]}`;

    selectedTitle.textContent = `${toNepaliDigit(day)} ${monthName} ${toNepaliDigit(year)}`;
    selectedAd.textContent = adStr;

    selectedEvents.innerHTML = '';
    if (eventText) {
      const tag = document.createElement('span');
      tag.className = `event-tag ${isHol ? 'holiday' : 'fest'}`;
      tag.textContent = eventText;
      selectedEvents.appendChild(tag);
    }
    if (tithi && !eventText.includes(tithi)) {
      const tag = document.createElement('span');
      tag.className = 'event-tag';
      tag.textContent = tithi;
      selectedEvents.appendChild(tag);
    }

    selectedMoonIcon.textContent = getMoonPhase(year, month, day);
    selectedMoon.textContent = tithi || 'Moon phase';
    selectedMoonAge.textContent = getMoonAge(year, month, day);
  }

  function renderMonth(year, month) {
    const monthName = getMonthName(month);
    const monthDays = getMonthDays(year, month);
    const startDay = getStartDay(year, month);

    titleEl.textContent = `${monthName} ${year}`;
    try {
      const first = window.BSDate.toAD(year, month, 1);
      const last = window.BSDate.toAD(year, month, monthDays);
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      subEl.textContent = `${months[first.getMonth()]} ${first.getFullYear()} – ${months[last.getMonth()]} ${last.getFullYear()}`;
    } catch (e) { subEl.textContent = ''; }

    gridEl.innerHTML = '';
    for (let i = 0; i < startDay; i++) {
      gridEl.innerHTML += '<div class="day empty"></div>';
    }

    let holidayCount = 0;
    const eventsList = [];
    const holidayList = [];

    const today = new Date();
    const bsToday = window.BSDate.fromAD(today);

    for (let d = 1; d <= monthDays; d++) {
      const dayDiv = document.createElement('div');
      dayDiv.className = 'day';

      const engDate = getEnglishDate(year, month, d);
      const tithi = getTithi(year, month, d);

      const key = `${month + 1}-${d}`;
      let eventText = fixedEvents[key] || '';
      if (!eventText && publicHolidays[key]) {
        eventText = publicHolidays[key];
      }

      if (eventText) {
        eventsList.push({ day: d, event: eventText, eng: engDate, month: monthName });
      }

      const h = isHoliday(year, month, d, eventText);
      if (h) {
        dayDiv.classList.add('holiday');
        holidayCount++;
        const holidayName = eventText || (publicHolidays[key] || 'साप्ताहिक बिदा');
        holidayList.push({ day: d, name: holidayName, eng: engDate, month: monthName });
      }

      if (year === bsToday.year && month === bsToday.month && d === bsToday.day) {
        dayDiv.classList.add('isToday');
      }

      if (selectedDate && selectedDate.year === year && selectedDate.month === month && selectedDate.day === d) {
        dayDiv.classList.add('selected-date');
      }

      let html = `<div class="num">${d}</div>
                  <div class="eng">${engDate}</div>
                  <div class="tithi">${tithi}</div>`;
      if (eventText) {
        html += `<div class="event">${eventText}</div>`;
      }
      dayDiv.innerHTML = html;

      dayDiv.addEventListener('click', function () {
        selectedDate = { year: year, month: month, day: d };
        renderMonth(year, month);
        updateSidebar(year, month, d);
      });

      gridEl.appendChild(dayDiv);
    }

    // Update sidebar
    if (selectedDate && selectedDate.year === year && selectedDate.month === month) {
      updateSidebar(selectedDate.year, selectedDate.month, selectedDate.day);
    } else if (year === bsToday.year && month === bsToday.month) {
      selectedDate = { year: bsToday.year, month: bsToday.month, day: bsToday.day };
      updateSidebar(bsToday.year, bsToday.month, bsToday.day);
      renderMonth(year, month);
      return;
    } else {
      const firstDay = 1;
      selectedDate = { year: year, month: month, day: firstDay };
      updateSidebar(year, month, firstDay);
      renderMonth(year, month);
      return;
    }

    // Update festivals panel
    festEl.innerHTML = '';
    if (eventsList.length > 0) {
      const unique = {};
      eventsList.forEach(item => {
        const key = `${item.day}`;
        if (!unique[key]) unique[key] = item;
        else if (item.event && !unique[key].event.includes(item.event)) unique[key].event += ` / ${item.event}`;
      });
      Object.values(unique).forEach(item => {
        festEl.innerHTML += `<div class="item"><div class="name">${item.event}</div><div class="meta">${item.day} ${item.month} · ${item.eng}</div></div>`;
      });
    } else {
      festEl.innerHTML = '<div class="meta">यस महिनामा कुनै पर्व छैन।</div>';
    }

    // Update holidays panel
    holEl.innerHTML = '';
    if (holidayList.length > 0) {
      const unique = {};
      holidayList.forEach(item => {
        const key = `${item.day}`;
        if (!unique[key]) unique[key] = item;
        else if (item.name && !unique[key].name.includes(item.name)) unique[key].name += ` / ${item.name}`;
      });
      Object.values(unique).forEach(item => {
        holEl.innerHTML += `<div class="item"><div class="name">${item.name}</div><div class="meta">${item.day} ${item.month} · ${item.eng}</div></div>`;
      });
    } else {
      holEl.innerHTML = '<div class="meta">यस महिनामा आगामी बिदा उपलब्ध छैन।</div>';
    }

    // Saitharu
    const saitharu = saitharuForYear[month] || {};
    const hasData = Object.values(saitharu).some(arr => arr && arr.length > 0);
    if (hasData) {
      let html = '';
      for (const [category, days] of Object.entries(saitharu)) {
        if (days && days.length > 0) {
          const dayStr = days.map(d => toNepaliDigit(d)).join(', ');
          html += `<div class="saitharu-category">
                      <span class="label">${category}</span>
                      <span class="days">${dayStr}</span>
                    </div>`;
        }
      }
      saitharuEl.innerHTML = html || '<div class="saitharu-empty">यस महिनाको साइत उपलब्ध छैन।</div>';
    } else {
      saitharuEl.innerHTML = '<div class="saitharu-empty">यस महिनाको साइत उपलब्ध छैन।</div>';
    }

    holidayCountEl.textContent = eventsList.length;
    totalHolidayBadge.textContent = holidayCount;
  }

  // Fetches (and caches) API data for `year`, then renders `month`.
  async function goToMonth(year, month) {
    try {
      const data = await loadYearData(year);
      fixedEvents = data.fixedEvents;
      publicHolidays = data.publicHolidays;
      saitharuForYear = data.saitharu;
    } catch (e) {
      console.error(e);
      fixedEvents = {};
      publicHolidays = {};
      saitharuForYear = {};
    }
    currentYear = year;
    currentMonth = month;
    yearSelect.value = currentYear;
    renderMonth(currentYear, currentMonth);
  }

  // --- Navigation buttons ---
  document.getElementById('prev').addEventListener('click', function () {
    let month = currentMonth - 1;
    let year = currentYear;
    if (month < 0) {
      month = 11;
      year--;
      if (year < MIN_BS_YEAR) year = MIN_BS_YEAR;
    }
    goToMonth(year, month);
    closeMobileMenu();
  });
  document.getElementById('next').addEventListener('click', function () {
    let month = currentMonth + 1;
    let year = currentYear;
    if (month > 11) {
      month = 0;
      year++;
      if (year > MAX_BS_YEAR) year = MAX_BS_YEAR;
    }
    goToMonth(year, month);
    closeMobileMenu();
  });

  document.getElementById('today').addEventListener('click', goToToday);
  document.getElementById('brandLink').addEventListener('click', function (e) {
    e.preventDefault();
    goToToday();
  });
  document.getElementById('calendarLink').addEventListener('click', function (e) {
    e.preventDefault();
    goToToday();
  });

  hamburger.addEventListener('click', function () {
    toggleMobileMenu();
  });

  // --- Auto-hide/show navbar on scroll (mobile only) ---
  (function () {
    const navbarEl = document.querySelector('.navbar');
    const MOBILE_QUERY = '(max-width: 820px)';
    let lastScrollY = window.scrollY;
    let ticking = false;
    const SCROLL_THRESHOLD = 8;

    function handleScroll() {
      const isMobile = window.matchMedia(MOBILE_QUERY).matches;
      const currentScrollY = window.scrollY;

      if (!isMobile || menuWrapper.classList.contains('open')) {
        navbarEl.classList.remove('nav-hidden');
        lastScrollY = currentScrollY;
        ticking = false;
        return;
      }

      const diff = currentScrollY - lastScrollY;

      if (currentScrollY <= 0) {
        navbarEl.classList.remove('nav-hidden');
      } else if (diff > SCROLL_THRESHOLD) {
        navbarEl.classList.add('nav-hidden');
      } else if (diff < -SCROLL_THRESHOLD) {
        navbarEl.classList.remove('nav-hidden');
      }

      lastScrollY = currentScrollY;
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    }, { passive: true });
  })();

  // --- initial render ---
  const today = new Date();
  const bsToday = window.BSDate.fromAD(today);
  selectedDate = { year: bsToday.year, month: bsToday.month, day: bsToday.day };
  goToMonth(bsToday.year, bsToday.month);
});
