const residencialService = require("../services/residencialService");

async function listar(req, res) {
  try {
    const filtros = {};

    if (req.query.status !== undefined) {
      filtros.status = req.query.status === "true";
    }

    const residenciais = await residencialService.listarResidenciais(filtros);

    return res.status(200).json(residenciais);
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const residencial = await residencialService.buscarResidencialPorId(id);

    return res.status(200).json(residencial);
  } catch (error) {
    return res.status(404).json({
      mensagem: error.message
    });
  }
}

async function criar(req, res) {
  try {
    const residencial = await residencialService.criarResidencial(req.body, req.usuario);

    return res.status(201).json({
      mensagem: "Residencial criado com sucesso.",
      residencial
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function atualizar(req, res) {
  try {
    const { id } = req.params;

    const residencial = await residencialService.atualizarResidencial(
      id,
      req.body,
      req.usuario
    );

    return res.status(200).json({
      mensagem: "Residencial atualizado com sucesso.",
      residencial
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function inativar(req, res) {
  try {
    const { id } = req.params;

    const residencial = await residencialService.inativarResidencial(id, req.usuario);

    return res.status(200).json({
      mensagem: "Residencial inativado com sucesso.",
      residencial
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function reativar(req, res) {
  try {
    const { id } = req.params;

    const residencial = await residencialService.reativarResidencial(id, req.usuario);

    return res.status(200).json({
      mensagem: "Residencial reativado com sucesso.",
      residencial
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}
async function uploadImagem(req, res) {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        mensagem: "Nenhuma imagem enviada."
      });
    }

    const caminhoImagem = `/uploads/residenciais/${req.file.filename}`;

    const residencial = await residencialService.atualizarImagemResidencial(
      id,
      caminhoImagem,
      req.usuario
    );

    return res.status(200).json({
      mensagem: "Imagem do residencial atualizada com sucesso.",
      imagem: caminhoImagem,
      residencial
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function excluirResidencialDefinitivo(req, res) {
  try {
    const { id } = req.params;

    const resultado = await residencialService.excluirResidencialDefinitivo(id);

    return res.json(resultado);
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

module.exports = {
  listar,
  buscarPorId,
  criar,
  atualizar,
  inativar,
  reativar,
  uploadImagem,
  excluirResidencialDefinitivo
};