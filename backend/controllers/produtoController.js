const produtoService = require("../services/produtoService");

async function listar(req, res) {
  try {
    const filtros = {};

    if (req.query.status !== undefined) {
      filtros.status = req.query.status === "true";
    }

    const produtos = await produtoService.listarProdutos(filtros);

    return res.status(200).json(produtos);
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const produto = await produtoService.buscarProdutoPorId(id);

    return res.status(200).json(produto);
  } catch (error) {
    return res.status(404).json({
      mensagem: error.message
    });
  }
}

async function criar(req, res) {
  try {
    const produto = await produtoService.criarProduto(req.body, req.usuario);

    return res.status(201).json({
      mensagem: "Produto criado com sucesso.",
      produto
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

    const produto = await produtoService.atualizarProduto(id, req.body, req.usuario);

    return res.status(200).json({
      mensagem: "Produto atualizado com sucesso.",
      produto
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

    const produto = await produtoService.inativarProduto(id, req.usuario);

    return res.status(200).json({
      mensagem: "Produto inativado com sucesso.",
      produto
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

    const produto = await produtoService.reativarProduto(id, req.usuario);

    return res.status(200).json({
      mensagem: "Produto reativado com sucesso.",
      produto
    });
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

async function excluirProdutoDefinitivo(req, res) {
  try {
    const { id } = req.params;

    const resultado = await produtoService.excluirProdutoDefinitivo(id);

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
  excluirProdutoDefinitivo
};