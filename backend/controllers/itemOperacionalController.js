const itemOperacionalService = require("../services/itemOperacionalService");

async function listar(req, res) {
  try {
    const filtros = {};

    if (req.query.status_item !== undefined) {
      filtros.status_item = req.query.status_item;
    }

    if (req.query.apartamento_id !== undefined) {
      filtros.apartamento_id = req.query.apartamento_id;
    }

    if (req.query.categoria !== undefined) {
      filtros.categoria = req.query.categoria;
    }

    const itens = await itemOperacionalService.listarItens(filtros);

    return res.status(200).json(itens);
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const item = await itemOperacionalService.buscarItemPorId(id);

    return res.status(200).json(item);
  } catch (error) {
    return res.status(404).json({
      mensagem: error.message
    });
  }
}

async function criar(req, res) {
  try {
    const item = await itemOperacionalService.criarItem(req.body, req.usuario);

    return res.status(201).json({
      mensagem: "Item operacional criado com sucesso.",
      item
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

    const item = await itemOperacionalService.atualizarItem(
      id,
      req.body,
      req.usuario
    );

    return res.status(200).json({
      mensagem: "Item operacional atualizado com sucesso.",
      item
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function alterarStatus(req, res) {
  try {
    const { id } = req.params;

    const item = await itemOperacionalService.alterarStatusItem(
      id,
      req.body,
      req.usuario
    );

    return res.status(200).json({
      mensagem: "Status do item alterado com sucesso.",
      item
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

    const caminhoImagem = `/uploads/itens/${req.file.filename}`;

    const item = await itemOperacionalService.atualizarImagemItem(
      id,
      caminhoImagem,
      req.usuario
    );

    return res.status(200).json({
      mensagem: "Imagem do item operacional atualizada com sucesso.",
      imagem: caminhoImagem,
      item
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function excluir(req, res) {
  try {
    const { id } = req.params;

    const resultado = await itemOperacionalService.excluirItemDefinitivo(
      id,
      req.usuario
    );

    return res.status(200).json(resultado);
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
  alterarStatus,
  uploadImagem,
  excluir
};