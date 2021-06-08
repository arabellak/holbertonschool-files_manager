import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';

const express = require('express');

const router = express.Router();

// Endpoints
router.get('/status', (req, res) => {
  AppController.getStatus(req, res);
});

router.get('/stats', (req, res) => {
  AppController.getStats(req, res);
});

router.post('/users', (req, res) => {
  UsersController.postNew(req, res);
});

router.get('/connect', function(req, res) {
  AuthController.getConnect(req, res);
})

router.get('/disconnect', function(req, res) {
  AuthController.getDisconnect(req, res);
})

router.get('/users/me', function(req, res) {
  UserController.getMe(req, res);
})

module.exports = router;
