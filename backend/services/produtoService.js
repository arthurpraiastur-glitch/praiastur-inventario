const {
  ProdutoAdministrativo,
  EntradaAdministrativa,
  SaidaItem,
  HistoricoMovimentacao
} = require("../models");

async function listarProdutos(filtros = {}) {
  const where = {};

  if (filtros.status !== undefined) {
    where.status = filtros.status;
  }

  const produtos = await ProdutoAdministrativo.findAll({
    where,
    order: [["nome", "ASC"]]
  });

  return produtos;
}

async function buscarProdutoPorId(id) {
  const produto = await ProdutoAdministrativo.findByPk(id);

  if (!produto) {
    throw new Error("Produto não encontrado.");
  }

  return produto;
}

async function criarProduto(dados, usuarioLogado) {
  const { nome, quantidade_atual, estoque_minimo, observacao } = dados;

  if (!nome || nome.trim() === "") {
    throw new Error("O nome do produto é obrigatório.");
  }

  if (quantidade_atual === undefined || quantidade_atual < 0) {
    throw new Error("A quantidade inicial não pode ser negativa.");
  }

  if (estoque_minimo === undefined || estoque_minimo < 0) {
    throw new Error("O estoque mínimo não pode ser negativo.");
  }

  const produto = await ProdutoAdministrativo.create({
    nome: nome.trim(),
    quantidade_atual,
    estoque_minimo,
    observacao: observacao || null,
    status: true,
    created_by: usuarioLogado?.id || null
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "PRODUTOS",
    acao: "CRIAR",
    tabela_referenciada: "produtos_administrativos",
    registro_id: produto.id,
    descricao: `Produto administrativo criado: ${produto.nome}`
  });

  return produto;
}

async function atualizarProduto(id, dados, usuarioLogado) {
  const produto = await buscarProdutoPorId(id);

  const { nome, estoque_minimo, observacao, status } = dados;

  if (nome !== undefined && nome.trim() === "") {
    throw new Error("O nome do produto não pode ficar vazio.");
  }

  if (estoque_minimo !== undefined && estoque_minimo < 0) {
    throw new Error("O estoque mínimo não pode ser negativo.");
  }

  await produto.update({
    nome: nome !== undefined ? nome.trim() : produto.nome,
    estoque_minimo: estoque_minimo !== undefined ? estoque_minimo : produto.estoque_minimo,
    observacao: observacao !== undefined ? observacao : produto.observacao,
    status: status !== undefined ? status : produto.status
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "PRODUTOS",
    acao: "EDITAR",
    tabela_referenciada: "produtos_administrativos",
    registro_id: produto.id,
    descricao: `Produto administrativo atualizado: ${produto.nome}`
  });

  return produto;
}

async function inativarProduto(id, usuarioLogado) {
  const produto = await buscarProdutoPorId(id);

  await produto.update({
    status: false
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "PRODUTOS",
    acao: "INATIVAR",
    tabela_referenciada: "produtos_administrativos",
    registro_id: produto.id,
    descricao: `Produto administrativo inativado: ${produto.nome}`
  });

  return produto;
}

async function reativarProduto(id, usuarioLogado) {
  const produto = await buscarProdutoPorId(id);

  await produto.update({
    status: true
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "PRODUTOS",
    acao: "REATIVAR",
    tabela_referenciada: "produtos_administrativos",
    registro_id: produto.id,
    descricao: `Produto administrativo reativado: ${produto.nome}`
  });

  return produto;
}
async function excluirProdutoDefinitivo(id) {
  const produto = await ProdutoAdministrativo.findByPk(id);

  if (!produto) {
    throw new Error("Produto não encontrado.");
  }

  const entradasVinculadas = await EntradaAdministrativa.count({
    where: { produto_Id: id }
  });

  const saidasVinculadas = await SaidaItem.count({
    where: { produto_Id: id }
  });

  if (entradasVinculadas > 0 || saidasVinculadas > 0) {
    throw new Error(
      "Este produto possui movimentações vinculadas. Para preservar o histórico, ele não pode ser excluído definitivamente. Use a opção de inativar."
    );
  }

  await produto.destroy();

  return {
    mensagem: "Produto excluído definitivamente com sucesso."
  };
}
module.exports = {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  inativarProduto,
  reativarProduto,
  excluirProdutoDefinitivo
};