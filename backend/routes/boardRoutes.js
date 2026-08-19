const path = require('path');
const express = require('express');
const router = express.Router();
const { createBoard, getBoard } = require('../controllers/boardController.js')

router.post('/createBoard', createBoard)
router.get('/getBoard/:boardId', getBoard)
// router.get('/',)

module.exports = router;
