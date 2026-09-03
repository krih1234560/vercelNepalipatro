const express = require('express');
const router = express.Router();

const { fixedEvents, publicHolidays } = require('../data/festivals');
const { saitharuData } = require('../data/saitharu');

const MIN_BS_YEAR = 1975;
const MAX_BS_YEAR = 2100;

/**
 * GET /api/calendar/:year
 * Returns festival, public-holiday and saitharu (auspicious-date) data
 * for the given BS year. fixedEvents / publicHolidays are recurring
 * (month-day keyed) so they're the same object for every year right now;
 * saitharu is looked up per "year-month" and returns {} where no data
 * has been entered yet.
 *
 * This is the first of the "self-made API" endpoints — weather,
 * gold/silver and fuel-rate routes will follow the same
 * GET /api/<topic> -> JSON shape.
 */
router.get('/calendar/:year', (req, res) => {
  const year = parseInt(req.params.year, 10);

  if (Number.isNaN(year) || year < MIN_BS_YEAR || year > MAX_BS_YEAR) {
    return res.status(400).json({
      error: `year must be a number between ${MIN_BS_YEAR} and ${MAX_BS_YEAR}`,
    });
  }

  const saitharuForYear = {};
  for (let m = 0; m < 12; m++) {
    const key = `${year}-${m}`;
    saitharuForYear[m] = saitharuData[key] || {};
  }

  res.json({
    year,
    fixedEvents,
    publicHolidays,
    saitharu: saitharuForYear,
  });
});

module.exports = router;
