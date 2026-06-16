const express = require("express");
const itemOperacionalController = require("../controllers/itemOperacionalController");
const authMiddleware = require("../middlewares/authMiddleware");
const criarUpload = require("../middlewares/uploadMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const uploadItem = criarUpload("itens");

const router = express.Router();

router.get("/", authMiddleware, itemOperacionalController.listar);

router.get("/:id", authMiddleware, itemOperacionalController.buscarPorId);

router.post("/", authMiddleware, itemOperacionalController.criar);

router.put("/:id", authMiddleware, itemOperacionalController.atualizar);

router.patch("/:id/status", authMiddleware, itemOperacionalController.alterarStatus);

router.patch(
  "/:id/imagem",
  authMiddleware,
  uploadItem.single("imagem"),
  itemOperacionalController.uploadImagem
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  itemOperacionalController.excluir
);

module.exports = router;