> **Versão responsiva:** esta versão cobre cadastro e login, publicação de relatos e feed de postagens. A visualização em mapa, a moderação (administrador) e a edição dos dados do perfil foram retiradas; os requisitos correspondentes estão listados na seção 4 (Fora do escopo da versão responsiva).

# 1. Estados do Domínio

Esta seção define os estados possíveis das principais entidades do sistema. Esses estados são utilizados pelas regras de negócio, requisitos funcionais e mecanismos de autorização.

## Usuário

| Estado     | Descrição                                                                                    |
| ---------- |----------------------------------------------------------------------------------------------|
| `active`   | Usuário com acesso normal ao sistema e autorizado a autenticar-se.                           |
| `inactive` | Usuário que desativou a própria conta. Não pode utilizar o sistema até realizar a reativação.|
| `banned`   | Usuário bloqueado por um administrador. Não pode autenticar-se nem utilizar o sistema.       |

## Postagem

| Estado     | Descrição                                                          |
| ---------- |--------------------------------------------------------------------|
| `active`   | Caso publicado e ativo.                                            |
| `resolved` | Indica que o caso foi solucionado.                                 |
| `hidden`   | Restrita a proprietários e administradores.                        |
| `blocked`  | Bloqueada por moderação. Não pode ser editada por usuários comuns. |

## Observações

- **Postagens Públicas:** Possuem status `active` ou `resolved`. Elas são as únicas visíveis no feed, na página de detalhes e nos resultados de busca para qualquer tipo de ator (incluindo visitantes).
- **Informações do Pet:** nome do pet, tipo de pet (`cachorro` ou `gato`), categoria (`perdido` ou `encontrado`) e descrição.

# 2. Atores do Sistema

- **Visitante:** Usuário não autenticado.

- **Usuário:** Usuário autenticado (`role: user`).

- **Administrador:** Usuário autenticado com privilégios de moderação (`role: admin`). Na versão responsiva não há telas nem rotas de moderação; o papel continua existindo no banco de dados, mas só pode ser atribuído diretamente nele.

---

# 3. Requisitos Funcionais

## 3.1 Gestão de Usuários e Acesso

- **[RF01] Cadastro de Conta:** O sistema deve permitir que visitantes se cadastrem fornecendo nome, e-mail e senha, podendo informar informações de contato opcionalmente.

- **[RF02] Autenticação:** O sistema deve autenticar usuários mediante e-mail e senha válidos.

- **[RF03] Gerenciamento de Perfil:** O usuário deve poder visualizar seu perfil e alterar sua senha (mediante validação da senha atual). A edição dos dados do perfil (nome, e-mail e informações de contato) está fora do escopo da versão responsiva (seção 4).

- **[RF04] Desativação de Conta:** O usuário deve poder desativar sua própria conta, alterando seu status de `active` para `inactive`.

- **[RF05] Reativação de Conta:** O sistema deve permitir que usuários com status `inactive` solicitem a reativação de sua conta mediante nova validação de credenciais, alterando seu status para `active` e efetuando o login automaticamente. **Observação:** A exclusão definitiva de contas de usuário não faz parte do escopo deste projeto.

---

## 3.2 Funcionalidades de Postagem

- **[RF06] Criação de Postagem:** O usuário deve poder criar postagens enviando obrigatoriamente as informações do pet, uma localização geográfica (`latitude` e `longitude`) e o endereço do local (rua, número, bairro e cidade), que é o que fica visível para os demais usuários.

- **[RF07] Upload de Mídia:** O usuário deve poder adicionar imagens às suas postagens, respeitando os formatos e limites definidos pelo sistema.

- **[RF08] Gerenciamento de Postagens:** O usuário deve poder editar os dados de suas próprias postagens (informações do pet e localização) e também adicionar e remover imagens associadas, exceto para postagens com status `blocked`.

- **[RF09] Controle de Status de Postagem:** O usuário deve poder alternar o status de suas postagens entre `active`, `resolved` e `hidden`. O usuário não possui permissão para alterar o status para `blocked`.

- **[RF10] Visualização Pessoal:** O usuário deve poder visualizar em seu painel todas as suas postagens e seus detalhes, incluindo aquelas com status `hidden` e `blocked`.

---

## 3.3 Visualização e Busca

- **[RF11] Feed:** O sistema deve exibir uma lista paginada de postagens públicas.

- **[RF13] Busca Geográfica e Filtros:** O sistema deve permitir a busca de postagens públicas utilizando filtros por tipo de pet, categoria, status e distância máxima em relação a um ponto geográfico de referência informado pelo usuário. Caso nenhum ponto de referência seja informado, o feed lista todas as postagens públicas, da mais recente para a mais antiga. Caso um ponto seja informado sem raio, deverá ser utilizado um valor padrão de 10 km. Na versão responsiva, os filtros existem na API, mas ainda não são oferecidos na interface.

- **[RF14] Detalhes da Postagem:** O sistema deve permitir a visualização detalhada de uma postagem selecionada, com o endereço do local e os meios de contato do autor, respeitando as regras de visibilidade e autorização definidas pelo sistema.

---

# 4. Fora do Escopo da Versão Responsiva

Os requisitos abaixo fazem parte do projeto original, mas foram retirados desta versão (telas, rotas da API e código correspondente).

- **[RF03, parcial] Edição dos Dados do Perfil:** editar nome, e-mail e informações de contato.

- **[RF12] Visualização em Mapa:** O sistema deve exibir pins geolocalizados de postagens públicas.

- **[RF15] Gerenciamento de Usuários:** O administrador deve poder listar todos os usuários, editar informações permitidas de usuários (nome, e-mail e informações de contato) e alterar o status para `active` ou `banned`.

- **[RF16] Moderação de Conteúdos:** O administrador deve poder listar todas as postagens do sistema, editar seus conteúdos (informações do pet e localização) e alterar o status para `hidden` ou `blocked`.

- **[RF17] Remoção de Mídia:** O administrador deve poder deletar permanentemente imagens de qualquer postagem.