const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const pastas = [
  path.join(__dirname, "..", "uploads", "residenciais"),
  path.join(__dirname, "..", "uploads", "apartamentos"),
  path.join(__dirname, "..", "uploads", "itens")
];

const extensoesPermitidas = [".jpg", ".jpeg", ".png", ".webp"];

async function otimizarImagem(caminhoArquivo) {
  const pasta = path.dirname(caminhoArquivo);
  const nomeArquivo = path.basename(caminhoArquivo);
  const pastaBackup = path.join(pasta, "_backup_originais");

  if (!fs.existsSync(pastaBackup)) {
    fs.mkdirSync(pastaBackup, { recursive: true });
  }

  const caminhoBackup = path.join(pastaBackup, nomeArquivo);

  if (!fs.existsSync(caminhoBackup)) {
    fs.copyFileSync(caminhoArquivo, caminhoBackup);
  }

  const caminhoTemporario = `${caminhoArquivo}.tmp.jpg`;

  await sharp(caminhoArquivo)
    .rotate()
    .resize({
      width: 1200,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({
      quality: 78,
      mozjpeg: true
    })
    .toFile(caminhoTemporario);

  fs.copyFileSync(caminhoTemporario, caminhoArquivo);
  fs.unlinkSync(caminhoTemporario);
}

async function executar() {
  console.log("Iniciando otimização das imagens...");
  console.log("");

  let total = 0;
  let otimizadas = 0;

  for (const pasta of pastas) {
    if (!fs.existsSync(pasta)) {
      console.log(`Pasta não encontrada: ${pasta}`);
      continue;
    }

    const arquivos = fs.readdirSync(pasta);

    for (const arquivo of arquivos) {
      const caminhoArquivo = path.join(pasta, arquivo);
      const stat = fs.statSync(caminhoArquivo);

      if (!stat.isFile()) continue;

      const extensao = path.extname(arquivo).toLowerCase();

      if (!extensoesPermitidas.includes(extensao)) continue;

      total++;

      try {
        const tamanhoAntes = fs.statSync(caminhoArquivo).size;

        await otimizarImagem(caminhoArquivo);

        const tamanhoDepois = fs.statSync(caminhoArquivo).size;

        console.log(
          `${arquivo} | ${(tamanhoAntes / 1024).toFixed(0)} KB -> ${(tamanhoDepois / 1024).toFixed(0)} KB`
        );

        otimizadas++;
      } catch (error) {
        console.log(`Erro ao otimizar ${arquivo}: ${error.message}`);
      }
    }
  }

  console.log("");
  console.log(`Processo finalizado.`);
  console.log(`Imagens encontradas: ${total}`);
  console.log(`Imagens otimizadas: ${otimizadas}`);
  console.log("");
  console.log("Backups foram salvos dentro da pasta _backup_originais de cada upload.");
}

executar();