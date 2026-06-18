const {
  Apartamento,
  ItemOperacional,
  Residencial,
  HistoricoMovimentacao
} = require("../models");

const db = require("../db/connection");
const sequelize = db.sequelize || db;

async function listarApartamentos(filtros = {}) {
  const where = {};

  if (filtros.status !== undefined) {
    where.status = filtros.status;
  }

  if (filtros.residencial_id !== undefined) {
    where.residencial_id = filtros.residencial_id;
  }

  const apartamentos = await Apartamento.findAll({
    where,
    include: [
      {
        model: Residencial,
        as: "residencial",
        attributes: ["id", "nome", "cidade", "estado"]
      }
    ],
    order: [["nome_numero", "ASC"]]
  });

  return apartamentos;
}

async function buscarApartamentoPorId(id) {
  const apartamento = await Apartamento.findByPk(id, {
    include: [
      {
        model: Residencial,
        as: "residencial",
        attributes: ["id", "nome", "cidade", "estado"]
      }
    ]
  });

  if (!apartamento) {
    throw new Error("Apartamento não encontrado.");
  }

  return apartamento;
}

async function criarApartamento(dados, usuarioLogado) {
  const { residencial_id, nome_numero, tipo, observacao } = dados;

  if (!residencial_id) {
    throw new Error("O residencial é obrigatório.");
  }

  if (!nome_numero || nome_numero.trim() === "") {
    throw new Error("O número ou nome do apartamento é obrigatório.");
  }

  const residencial = await Residencial.findByPk(residencial_id);

  if (!residencial) {
    throw new Error("Residencial não encontrado.");
  }

  if (!residencial.status) {
    throw new Error("Não é possível cadastrar apartamento em residencial inativo.");
  }

  const apartamentoExistente = await Apartamento.findOne({
    where: {
      residencial_id,
      nome_numero: nome_numero.trim()
    }
  });

  if (apartamentoExistente) {
    throw new Error("Já existe um apartamento/espaço com esse nome ou número neste residencial.");
  }

  const apartamento = await Apartamento.create({
    residencial_id,
    nome_numero: nome_numero.trim(),
    tipo: tipo || null,
    observacao: observacao || null,
    status: true,
    created_by: usuarioLogado?.id || null
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "APARTAMENTOS",
    acao: "CRIAR",
    tabela_referenciada: "apartamentos",
    registro_id: apartamento.id,
    descricao: `Apartamento/espaço criado: ${apartamento.nome_numero}`
  });

  return apartamento;
}

async function atualizarApartamento(id, dados, usuarioLogado) {
  const apartamento = await buscarApartamentoPorId(id);

  const { residencial_id, nome_numero, tipo, observacao, status } = dados;

  if (residencial_id !== undefined) {
    const residencial = await Residencial.findByPk(residencial_id);

    if (!residencial) {
      throw new Error("Residencial não encontrado.");
    }

    if (!residencial.status) {
      throw new Error("Não é possível mover apartamento para um residencial inativo.");
    }
  }

  if (nome_numero !== undefined && nome_numero.trim() === "") {
    throw new Error("O número ou nome do apartamento não pode ficar vazio.");
  }

  const novoResidencialId =
    residencial_id !== undefined ? residencial_id : apartamento.residencial_id;

  const novoNomeNumero =
    nome_numero !== undefined ? nome_numero.trim() : apartamento.nome_numero;

  const apartamentoDuplicado = await Apartamento.findOne({
    where: {
      residencial_id: novoResidencialId,
      nome_numero: novoNomeNumero
    }
  });

  if (apartamentoDuplicado && apartamentoDuplicado.id !== Number(id)) {
    throw new Error("Já existe um apartamento/espaço com esse nome ou número neste residencial.");
  }

  await apartamento.update({
    residencial_id: novoResidencialId,
    nome_numero: novoNomeNumero,
    tipo: tipo !== undefined ? tipo : apartamento.tipo,
    observacao: observacao !== undefined ? observacao : apartamento.observacao,
    status: status !== undefined ? status : apartamento.status
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "APARTAMENTOS",
    acao: "EDITAR",
    tabela_referenciada: "apartamentos",
    registro_id: apartamento.id,
    descricao: `Apartamento/espaço atualizado: ${apartamento.nome_numero}`
  });

  return apartamento;
}

async function inativarApartamento(id, usuarioLogado) {
  const apartamento = await buscarApartamentoPorId(id);

  await apartamento.update({
    status: false
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "APARTAMENTOS",
    acao: "INATIVAR",
    tabela_referenciada: "apartamentos",
    registro_id: apartamento.id,
    descricao: `Apartamento/espaço inativado: ${apartamento.nome_numero}`
  });

  return apartamento;
}

async function reativarApartamento(id, usuarioLogado) {
  const apartamento = await buscarApartamentoPorId(id);

  const residencial = await Residencial.findByPk(apartamento.residencial_id);

  if (!residencial) {
    throw new Error("Residencial vinculado ao apartamento não encontrado.");
  }

  if (!residencial.status) {
    throw new Error("Não é possível reativar apartamento de um residencial inativo.");
  }

  await apartamento.update({
    status: true
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "APARTAMENTOS",
    acao: "REATIVAR",
    tabela_referenciada: "apartamentos",
    registro_id: apartamento.id,
    descricao: `Apartamento/espaço reativado: ${apartamento.nome_numero}`
  });

  return apartamento;
}

async function atualizarImagemApartamento(id, caminhoImagem, usuarioLogado) {
  const apartamento = await buscarApartamentoPorId(id);

  await apartamento.update({
    imagem: caminhoImagem,
    updated_by: usuarioLogado?.id || null
  });

  await HistoricoMovimentacao.create({
    usuario_id: usuarioLogado?.id || null,
    modulo: "APARTAMENTOS",
    acao: "UPLOAD_IMAGEM",
    tabela_referenciada: "apartamentos",
    registro_id: apartamento.id,
    descricao: `Imagem atualizada do apartamento/espaço: ${apartamento.nome_numero}`
  });

  return apartamento;
}

async function excluirApartamentoDefinitivo(id) {
  const transaction = await sequelize.transaction();

  try {
    const apartamento = await Apartamento.findByPk(id, { transaction });

    if (!apartamento) {
      throw new Error("Apartamento não encontrado.");
    }

    await ItemOperacional.destroy({
      where: { apartamento_id: id },
      transaction
    });

    await apartamento.destroy({ transaction });

    await transaction.commit();

    return {
      mensagem: "Apartamento e seus itens operacionais foram excluídos definitivamente."
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = {
  listarApartamentos,
  buscarApartamentoPorId,
  criarApartamento,
  atualizarApartamento,
  inativarApartamento,
  reativarApartamento,
  atualizarImagemApartamento,
  excluirApartamentoDefinitivo
};