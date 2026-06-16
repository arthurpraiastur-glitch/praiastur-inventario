const apartamentoService = require("../services/apartamentoService");

async function listar(req, res) {
  try {
    const filtros = {};

    if (req.query.status !== undefined) {
      filtros.status = req.query.status === "true";
    }

    if (req.query.residencial_id !== undefined) {
      filtros.residencial_id = req.query.residencial_id;
    }

    const apartamentos = await apartamentoService.listarApartamentos(filtros);

    return res.status(200).json(apartamentos);
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const apartamento = await apartamentoService.buscarApartamentoPorId(id);

    return res.status(200).json(apartamento);
  } catch (error) {
    return res.status(404).json({
      mensagem: error.message
    });
  }
}

async function criar(req, res) {
  try {
    const apartamento = await apartamentoService.criarApartamento(req.body, req.usuario);

    return res.status(201).json({
      mensagem: "Apartamento/espaço criado com sucesso.",
      apartamento
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

    const apartamento = await apartamentoService.atualizarApartamento(
      id,
      req.body,
      req.usuario
    );

    return res.status(200).json({
      mensagem: "Apartamento/espaço atualizado com sucesso.",
      apartamento
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

    const apartamento = await apartamentoService.inativarApartamento(id, req.usuario);

    return res.status(200).json({
      mensagem: "Apartamento/espaço inativado com sucesso.",
      apartamento
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

    const apartamento = await apartamentoService.reativarApartamento(id, req.usuario);

    return res.status(200).json({
      mensagem: "Apartamento/espaço reativado com sucesso.",
      apartamento
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

    const caminhoImagem = `/uploads/apartamentos/${req.file.filename}`;

    const apartamento = await apartamentoService.atualizarImagemApartamento(
      id,
      caminhoImagem,
      req.usuario
    );

    return res.status(200).json({
      mensagem: "Imagem do apartamento/espaço atualizada com sucesso.",
      imagem: caminhoImagem,
      apartamento
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function excluirApartamentoDefinitivo(req, res) {
  try {
    const { id } = req.params;

    const resultado = await apartamentoService.excluirApartamentoDefinitivo(id);

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
  excluirApartamentoDefinitivo
};