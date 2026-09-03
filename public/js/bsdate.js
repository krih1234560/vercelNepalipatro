// ============================================================
//  BS ↔ AD CONVERSION ENGINE
// ============================================================
(function () {
  const normalMonths = [31, 32, 31, 31, 31, 31, 30, 29, 30, 29, 30, 30];
  const leapMonths   = [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30];

  function isLeap(bsYear) {
    return (bsYear % 4 === 0) && (bsYear % 100 !== 0 || bsYear % 400 === 0);
  }

  function getMonthDays(bsYear) {
    return isLeap(bsYear) ? leapMonths : normalMonths;
  }

  const REF_BS_YEAR = 2000;
  const REF_AD = new Date(1943, 3, 14);

  function bsToAd(bsYear, bsMonth, bsDay) {
    let days = 0;
    for (let y = REF_BS_YEAR; y < bsYear; y++) {
      const mds = getMonthDays(y);
      for (let m = 0; m < 12; m++) days += mds[m];
    }
    const targetMds = getMonthDays(bsYear);
    for (let m = 0; m < bsMonth; m++) days += targetMds[m];
    days += (bsDay - 1);
    const result = new Date(REF_AD);
    result.setDate(result.getDate() + days);
    return result;
  }

  function adToBs(adDate) {
    let daysDiff = Math.floor((adDate - REF_AD) / (24 * 60 * 60 * 1000));
    let bsYear = REF_BS_YEAR;
    let remaining = daysDiff;
    while (true) {
      const mds = getMonthDays(bsYear);
      const total = mds.reduce((a, b) => a + b, 0);
      if (remaining < total) break;
      remaining -= total;
      bsYear++;
    }
    const mds = getMonthDays(bsYear);
    let bsMonth = 0;
    while (remaining >= mds[bsMonth]) {
      remaining -= mds[bsMonth];
      bsMonth++;
      if (bsMonth >= 12) { bsMonth = 0; bsYear++; break; }
    }
    return { year: bsYear, month: bsMonth, day: remaining + 1 };
  }

  window.BSDate = {
    toAD: bsToAd,
    fromAD: adToBs,
    getMonthDays: getMonthDays,
    isLeap: isLeap,
  };
})();
