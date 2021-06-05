const express = require('express');
import AppController from '../controllers/AppController';

const router = express();

//Endpoints
router.get('/status', function(req, res) {
    AppController.getStatus(req, res);
})

router.get('/stats', function (req, res) {
    AppController.getStats(req, res);
})

module.exports = router;
