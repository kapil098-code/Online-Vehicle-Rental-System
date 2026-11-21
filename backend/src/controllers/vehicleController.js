const Vehicle = require('../models/vehicleModel');
const HttpError = require('../utils/httpError');
const { validateRentalDates } = require('../utils/dateValidator');

exports.getVehicles = async (req, res, next) => {
    try {
        const f = req.query;
        if (f.startDate || f.endDate) {
            const chk = validateRentalDates(f.startDate, f.endDate);
            if (!chk.isValid) throw new HttpError(400, chk.message);
        }
        const vehicles = await Vehicle.search(f);
        res.json({ success: true, count: vehicles.length, vehicles });
    } catch (e) { next(e); }
};

exports.getVehicleById = async (req, res, next) => {
    try {
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) throw new HttpError(404, 'Vehicle not found.');
        const bookedRanges = await Vehicle.bookedRanges(req.params.id);
        res.json({ success: true, vehicle, bookedRanges });
    } catch (e) { next(e); }
};
