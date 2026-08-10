// Identidade local do usuário.
//
// O edital pede que o usuário esteja "autenticado ou identificado". Optamos
// pela identificação: na primeira visita geramos um id aleatório e o
// guardamos no localStorage do navegador. Esse id acompanha cada anúncio
// criado e é o que separa "meus anúncios" dos anúncios dos outros.
//
// É deliberadamente simples: não há senha nem sessão. Um login de verdade
// (JWT) está listado como bônus no edital e seria o próximo passo natural.

const CHAVE = 'circula:usuarioId';

export function obterUsuarioId(): string {
  let id = localStorage.getItem(CHAVE);

  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CHAVE, id);
  }

  return id;
}
