// Gerador dos ícones do PWA.
//
// Em vez de baixar um PNG pronto, os ícones são desenhados por código: um
// quadrado arredondado verde com um anel branco interrompido e uma seta,
// remetendo ao símbolo de reciclagem.
//
// O PNG é montado na mão (assinatura + IHDR + IDAT + IEND) porque a única
// peça pesada de verdade, a compressão, já vem pronta no `node:zlib`. Assim o
// projeto não precisa de nenhuma biblioteca de imagem.
//
// Uso: node gerar-icones.mjs

import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

// --------------------------------------------------------------- PNG cru

const TABELA_CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = TABELA_CRC[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/** Um chunk PNG: tamanho, tipo, dados e o CRC de (tipo + dados). */
function chunk(tipo, dados) {
  const tamanho = Buffer.alloc(4);
  tamanho.writeUInt32BE(dados.length);

  const corpo = Buffer.concat([Buffer.from(tipo, 'ascii'), dados]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(corpo));

  return Buffer.concat([tamanho, corpo, crc]);
}

/** Monta um PNG RGBA a partir de um buffer de pixels. */
function montarPng(lado, pixels) {
  const cabecalho = Buffer.alloc(13);
  cabecalho.writeUInt32BE(lado, 0); // largura
  cabecalho.writeUInt32BE(lado, 4); // altura
  cabecalho[8] = 8; // bits por canal
  cabecalho[9] = 6; // tipo de cor 6 = RGBA
  // Os três zeros seguintes (compressão, filtro, entrelaçamento) já vêm do alloc.

  // Cada linha do PNG é precedida por um byte que indica o filtro aplicado.
  // Usamos 0 (nenhum) para manter o código simples.
  const comFiltro = Buffer.alloc(lado * (lado * 4 + 1));
  for (let y = 0; y < lado; y++) {
    comFiltro[y * (lado * 4 + 1)] = 0;
    pixels.copy(comFiltro, y * (lado * 4 + 1) + 1, y * lado * 4, (y + 1) * lado * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', cabecalho),
    chunk('IDAT', deflateSync(comFiltro, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------- o desenho

const VERDE = [21, 128, 61];
const BRANCO = [255, 255, 255];

/** O ponto está dentro de um retângulo de cantos arredondados? */
function dentroDoQuadradoArredondado(x, y, lado, raio) {
  const dx = Math.max(raio - x, 0, x - (lado - raio));
  const dy = Math.max(raio - y, 0, y - (lado - raio));
  return Math.hypot(dx, dy) <= raio;
}

/** O ponto está dentro do triângulo? Teste por sinal das três arestas. */
function dentroDoTriangulo(px, py, [ax, ay], [bx, by], [cx, cy]) {
  const sinal = (x1, y1, x2, y2, x3, y3) => (x1 - x3) * (y2 - y3) - (x2 - x3) * (y1 - y3);

  const d1 = sinal(px, py, ax, ay, bx, by);
  const d2 = sinal(px, py, bx, by, cx, cy);
  const d3 = sinal(px, py, cx, cy, ax, ay);

  const temNegativo = d1 < 0 || d2 < 0 || d3 < 0;
  const temPositivo = d1 > 0 || d2 > 0 || d3 > 0;

  return !(temNegativo && temPositivo);
}

/**
 * Desenha o ícone.
 *
 * `maskavel` gera a variante que o Android recorta em formatos diferentes
 * (círculo, gota, quadrado). Nela o fundo sangra até a borda e a marca fica
 * menor, dentro da "zona segura" central, para não ser cortada.
 */
function desenhar(lado, maskavel = false) {
  const pixels = Buffer.alloc(lado * lado * 4);

  const centro = lado / 2;
  const escala = maskavel ? 0.62 : 0.82;
  const raioExterno = lado * 0.3 * escala;
  const raioInterno = lado * 0.205 * escala;
  const raioMedio = (raioExterno + raioInterno) / 2;

  // A abertura do anel, em radianos. É o "corte" que transforma o círculo em
  // uma seta circular.
  const inicioAbertura = -1.15;
  const fimAbertura = 0.42;

  // Ponta da seta, construída sobre a tangente ao anel no fim da abertura.
  const cosF = Math.cos(fimAbertura);
  const senF = Math.sin(fimAbertura);
  const comprimento = raioMedio * 0.95;

  const vertices = [
    [centro + raioMedio * cosF - senF * comprimento, centro - raioMedio * senF - cosF * comprimento],
    [centro + raioExterno * 1.42 * cosF, centro - raioExterno * 1.42 * senF],
    [centro + raioInterno * 0.58 * cosF, centro - raioInterno * 0.58 * senF],
  ];

  for (let y = 0; y < lado; y++) {
    for (let x = 0; x < lado; x++) {
      const posicao = (y * lado + x) * 4;

      const px = x + 0.5;
      const py = y + 0.5;

      const fundoVisivel =
        maskavel || dentroDoQuadradoArredondado(px, py, lado, lado * 0.22);

      if (!fundoVisivel) continue; // fica transparente

      const distancia = Math.hypot(px - centro, py - centro);
      // Ângulo com o eixo Y invertido, já que em imagem o y cresce para baixo.
      const angulo = Math.atan2(centro - py, px - centro);

      const noAnel =
        distancia >= raioInterno &&
        distancia <= raioExterno &&
        !(angulo > inicioAbertura && angulo < fimAbertura);

      const naSeta = dentroDoTriangulo(px, py, vertices[0], vertices[1], vertices[2]);

      const [r, g, b] = noAnel || naSeta ? BRANCO : VERDE;

      pixels[posicao] = r;
      pixels[posicao + 1] = g;
      pixels[posicao + 2] = b;
      pixels[posicao + 3] = 255;
    }
  }

  return montarPng(lado, pixels);
}

const saidas = [
  ['public/icone-192.png', desenhar(192)],
  ['public/icone-512.png', desenhar(512)],
  ['public/icone-512-maskavel.png', desenhar(512, true)],
];

for (const [caminho, conteudo] of saidas) {
  writeFileSync(caminho, conteudo);
  console.log(`${caminho} — ${(conteudo.length / 1024).toFixed(1)} KB`);
}
