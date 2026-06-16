require("dotenv").config();

const { sequelize, createDatabaseIfNotExists } = require("./connection");
const seedAdmin = require("./seedAdmin");

require("../models");

async function syncDatabase() {
  try {
    console.log("Iniciando configuração do banco de dados...");
    console.log("");

    await createDatabaseIfNotExists();

    console.log("Banco de dados verificado/criado com sucesso.");

    await sequelize.authenticate();

    console.log("Conexão com o MySQL realizada com sucesso.");

    await sequelize.sync({
      force: true,
      alter: false
    });

    console.log("Tabelas verificadas/criadas com sucesso.");

    await seedAdmin();

    console.log("");
    console.log("Banco de dados inicializado com sucesso.");
    console.log("Processo finalizado.");
  } catch (error) {
    console.error("");
    console.error("Erro ao sincronizar banco de dados:");
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();