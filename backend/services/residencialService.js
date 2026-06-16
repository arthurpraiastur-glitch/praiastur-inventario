const { Residencial, Apartamento, ItemOperacional, HistoricoMovimentacao } = require("../models");
const db = require("../db/connection");
const sequelize = db.sequelize || db;
const { Op } = require("sequelize");

async function listarResidenciais(filtros = {}) {
  const where = {};

  if (filtros.status !== undefined) {
    where.status = filtros.status;
  }

  const residenciais = await Residencial.findAll({
    where,
    order: [["nome", "ASC"]]
  });

  return residenciais;
}

async function buscarResidencialPorId(id) {
  const residencial = await Residencial.findByPk(id);

  if (!residencial) {
    throw new Error("Residencial não encontrado.");
  }

  return residencial;
}

async function criarResidencial(dados, usuarioLogado) {
  const { nome, cidade, estado, endereco, observacao } = dados;

  if (!nome || nome.trim() === "") {
    throw new Error("O nome do residencial é obrigatório.");
  }

  if (!cidade || cidade.trim() === "") {
    throw new Error("A cidade é obrigatória.");
  }

  if (!estado || estado.trim() === "") {
    throw new Error("O estado é obrigatório.");
  }

  const residencial = await Residencial.create({
    nome: nome.trim(),
    cidade: cidade.trim(),
    estado: estado.trim().toUpperCase(),
    endereco: endereco || null,
    observacao: observacao || null,
    status: true,
    created_by: usuarioLogado?.id || null
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "RESIDENCIAIS",
    acao: "CRIAR",
    tabela_referenciada: "residenciais",
    registro_id: residencial.id,
    descricao: `Residencial criado: ${residencial.nome}`
  });

  return residencial;
}

async function atualizarResidencial(id, dados, usuarioLogado) {
  const residencial = await buscarResidencialPorId(id);

  const { nome, cidade, estado, endereco, observacao, status } = dados;

  if (nome !== undefined && nome.trim() === "") {
    throw new Error("O nome do residencial não pode ficar vazio.");
  }

  if (cidade !== undefined && cidade.trim() === "") {
    throw new Error("A cidade não pode ficar vazia.");
  }

  if (estado !== undefined && estado.trim() === "") {
    throw new Error("O estado não pode ficar vazio.");
  }

  await residencial.update({
    nome: nome !== undefined ? nome.trim() : residencial.nome,
    cidade: cidade !== undefined ? cidade.trim() : residencial.cidade,
    estado: estado !== undefined ? estado.trim().toUpperCase() : residencial.estado,
    endereco: endereco !== undefined ? endereco : residencial.endereco,
    observacao: observacao !== undefined ? observacao : residencial.observacao,
    status: status !== undefined ? status : residencial.status
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "RESIDENCIAIS",
    acao: "EDITAR",
    tabela_referenciada: "residenciais",
    registro_id: residencial.id,
    descricao: `Residencial atualizado: ${residencial.nome}`
  });

  return residencial;
}

async function inativarResidencial(id, usuarioLogado) {
  const residencial = await buscarResidencialPorId(id);

  await residencial.update({
    status: false
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "RESIDENCIAIS",
    acao: "INATIVAR",
    tabela_referenciada: "residenciais",
    registro_id: residencial.id,
    descricao: `Residencial inativado: ${residencial.nome}`
  });

  return residencial;
}

async function reativarResidencial(id, usuarioLogado) {
  const residencial = await buscarResidencialPorId(id);

  await residencial.update({
    status: true
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "RESIDENCIAIS",
    acao: "REATIVAR",
    tabela_referenciada: "residenciais",
    registro_id: residencial.id,
    descricao: `Residencial reativado: ${residencial.nome}`
  });

  return residencial;
}
async function atualizarImagemResidencial(id, caminhoImagem, usuarioLogado) {
  const residencial = await buscarResidencialPorId(id);

  await residencial.update({
    imagem: caminhoImagem
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "RESIDENCIAIS",
    acao: "UPLOAD_IMAGEM",
    tabela_referenciada: "residenciais",
    registro_id: residencial.id,
    descricao: `Imagem atualizada do residencial: ${residencial.nome}`
  });

  return residencial;
}

async function excluirResidencialDefinitivo(id) {
  const transaction = await sequelize.transaction();

  try {
    const residencial = await Residencial.findByPk(id, { transaction });

    if (!residencial) {
      throw new Error("Residencial não encontrado.");
    }

    const apartamentos = await Apartamento.findAll({
      where: { residencial_id: id },
      attributes: ["id"],
      transaction
    });

    const apartamentoIds = apartamentos.map((apartamento) => apartamento.id);

    if (apartamentoIds.length > 0) {
      await ItemOperacional.destroy({
        where: {
          apartamento_id: {
            [Op.in]: apartamentoIds
          }
        },
        transaction
      });

      await Apartamento.destroy({
        where: { residencial_id: id },
        transaction
      });
    }

    await residencial.destroy({ transaction });

    await transaction.commit();

    return {
      mensagem:
        "Residencial, apartamentos e itens operacionais vinculados foram excluídos definitivamente."
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  listarResidenciais,
  buscarResidencialPorId,
  criarResidencial,
  atualizarResidencial,
  inativarResidencial,
  reativarResidencial,
  atualizarImagemResidencial,
  excluirResidencialDefinitivo
};