const router = require('express').Router();
const c = require('../controllers/authController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', upload.document.single('id_document'), c.register);
router.post('/login', c.login);
router.get('/me', auth, c.me);
router.put('/documents', auth, upload.document.single('id_document'), c.resubmitDocument);
module.exports = router;
