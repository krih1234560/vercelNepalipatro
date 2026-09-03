const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', {
    pageTitle: 'नेपाली पात्रो · Nepali Patro - Calendar 2083',
    pageDescription:
      'नेपाली पात्रो २०८३: आजको मिति, चाडपर्व, बिदा, तिथि, साइत र रुपान्तरण। Complete Nepali Calendar 2083 with festivals, holidays, Tithi & BS-AD converter.',
    canonical: 'https://nepalipatro.app/',
    activeNav: 'calendar',
  });
});

module.exports = router;
