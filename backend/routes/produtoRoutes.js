const express = require("express");
const produtoController = require("../controllers/produtoController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, produtoController.listar);

router.get("/:id", authMiddleware, produtoController.buscarPorId);

router.post("/", authMiddleware, produtoController.criar);

router.put("/:id", authMiddleware, produtoController.atualizar);

router.patch("/:id/inativar", authMiddleware, produtoController.inativar);

router.patch("/:id/reativar", authMiddleware, produtoController.reativar);
router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  produtoController.excluirProdutoDefinitivo
);

module.exports = router;