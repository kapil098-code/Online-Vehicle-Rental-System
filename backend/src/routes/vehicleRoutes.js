const router = require('express').Router();
const c = require('../controllers/vehicleController');

router.get('/', c.getVehicles);
router.get('/:id', c.getVehicleById);
module.exports = router;
