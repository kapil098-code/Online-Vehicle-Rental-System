const router = require('express').Router();
const c = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');
const role = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(auth, role('admin'));
router.get('/stats', c.getStats);
router.get('/users', c.listUsers);
router.get('/users/:id/document', c.getUserDocument);
router.put('/users/:id/verification', c.setVerification);
router.post('/vehicles', upload.single('image'), c.addVehicle);
router.put('/vehicles/:id', upload.single('image'), c.updateVehicle);
router.delete('/vehicles/:id', c.deleteVehicle);
router.get('/bookings', c.getAllBookings);
router.put('/bookings/:id/status', c.updateBookingStatus);
module.exports = router;
