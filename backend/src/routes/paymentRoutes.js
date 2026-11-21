const router = require('express').Router();
const c = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, c.makePayment);
module.exports = router;
