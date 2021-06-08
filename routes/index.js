import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
const express = require('express');

const router = express.Router();

//Endpoints
router.get('/status', function(req, res) {
    AppController.getStatus(req, res);
})

router.get('/stats', function (req, res) {
    AppController.getStats(req, res);
})

router.post('/users', function(req, res) {
    UsersController.postNew(req, res)
})

module.exports = router;
