const multer = require('multer');
const path = require('path');
const fs = require('fs');

const makeStorage = (dir) => {
    fs.mkdirSync(dir, { recursive: true });
    return multer.diskStorage({
        destination: (req, file, cb) => cb(null, dir),
        filename: (req, file, cb) => {
            const suffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
            cb(null, `${file.fieldname}-${suffix}${path.extname(file.originalname).toLowerCase()}`);
        }
    });
};

const imagesOnly = (allowed) => (req, file, cb) => {
    if (allowed.includes(file.mimetype)) return cb(null, true);
    const err = new Error('Only image files are allowed.');
    err.statusCode = 400;
    cb(err, false);
};

// Vehicle photos: stored in /uploads and served publicly
const vehicleUpload = multer({
    storage: makeStorage(path.join(__dirname, '../../uploads')),
    fileFilter: (req, file, cb) => (file.mimetype.startsWith('image/') ? cb(null, true) : imagesOnly([])(req, file, cb)),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ID documents: stored OUTSIDE the public folder, only an admin can view them through the API
vehicleUpload.document = multer({
    storage: makeStorage(path.join(__dirname, '../../private_uploads/documents')),
    fileFilter: imagesOnly(['image/jpeg', 'image/png', 'image/webp']),
    limits: { fileSize: 5 * 1024 * 1024 }
});

module.exports = vehicleUpload;
