const express = require('express');
const controller = require('../controllers/produtosController');
const autenticar = require('../middleware/autenticar');

const router = express.Router();

// ler produtos continua público
router.get('/', controller.listar);
router.get('/:id', controller.buscarPorId);

// criar, editar e apagar exigem login
router.post('/', autenticar, controller.criar);
router.put('/:id', autenticar, controller.atualizar);
router.delete('/:id', autenticar, controller.remover);

module.exports = router;
