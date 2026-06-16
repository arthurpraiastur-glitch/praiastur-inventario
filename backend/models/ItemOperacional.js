const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connection");

const CATEGORIAS_PERMITIDAS = [
  "MOVEIS_E_ESTRUTURA",
  "ELETRONICOS_E_ELETRODOMESTICOS",
  "COZINHA_E_UTENSILIOS",
  "QUARTOS_E_ENXOVAL",
  "BANHEIROS",
  "AREA_DE_SERVICO_E_VARANDA",
  "OUTROS"
];

function validarCategoria(categoria) {
  if (categoria && !CATEGORIAS_PERMITIDAS.includes(categoria)) {
    throw new Error("Categoria do item inválida.");
  }
}

const ItemOperacional = sequelize.define("itens_operacionais", {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true
  },

  apartamento_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false
  },

  nome: {
    type: DataTypes.STRING(150),
    allowNull: false
  },

  categoria: {
    type: DataTypes.STRING(80),
    allowNull: true
  },

  quantidade: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1
  },

  status_item: {
    type: DataTypes.ENUM("BOM", "ATENCAO", "PROBLEMA", "EM_FALTA"),
    allowNull: false,
    defaultValue: "BOM"
  },

  observacao: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  imagem: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true
  }
});

module.exports = ItemOperacional;