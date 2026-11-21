const router = require('express').Router();
const c = require('../controllers/bookingController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, c.createBooking);
router.get('/my', auth, c.getMyBookings);
router.put('/:id/cancel', auth, c.cancelBooking);
module.exports = router;
