const express = require("express");
const residencialController = require("../controllers/residencialController");
const criarUpload = require("../middlewares/uploadMiddleware");
const uploadResidencial = criarUpload("residenciais");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, residencialController.listar);

router.get("/:id", authMiddleware, residencialController.buscarPorId);

router.post("/", authMiddleware, residencialController.criar);

router.put("/:id", authMiddleware, residencialController.atualizar);

router.patch("/:id/inativar", authMiddleware, residencialController.inativar);

router.patch("/:id/reativar", authMiddleware, residencialController.reativar);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  residencialController.excluirResidencialDefinitivo
);

router.patch(
  "/:id/imagem",
  authMiddleware,
  uploadResidencial.single("imagem"),
  residencialController.uploadImagem
);

module.exports = router;