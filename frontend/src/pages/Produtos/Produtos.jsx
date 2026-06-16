import { useEffect, useState } from "react";
import api from "../../api/api";
import "./Produtos.css";


function Produtos() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    quantidade_atual: "",
    estoque_minimo: "",
    observacao: ""
  });

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  const ehAdministrador = usuario?.perfil === "ADMINISTRADOR";

  async function carregarProdutos() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/produtos");

      setProdutos(resposta.data);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Erro ao carregar produtos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  function abrirModalNovo() {
    setProdutoEditando(null);
    setForm({
      nome: "",
      quantidade_atual: "",
      estoque_minimo: "",
      observacao: ""
    });
    setModalAberto(true);
  }

  function abrirModalEditar(produto) {
    setProdutoEditando(produto);
    setForm({
      nome: produto.nome || "",
      quantidade_atual: produto.quantidade_atual || 0,
      estoque_minimo: produto.estoque_minimo || 0,
      observacao: produto.observacao || ""
    });
    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setProdutoEditando(null);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setForm((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value
    }));
  }
  async function salvarProduto(event) {
    event.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do produto.");
      return;
    }

    if (!produtoEditando && form.quantidade_atual === "") {
      alert("Informe a quantidade inicial.");
      return;
    }

    if (!produtoEditando && Number(form.quantidade_atual) < 0) {
      alert("A quantidade inicial não pode ser negativa.");
      return;
    }

    if (form.estoque_minimo === "") {
      alert("Informe o estoque mínimo.");
      return;
    }

    if (Number(form.estoque_minimo) < 0) {
      alert("O estoque mínimo não pode ser negativo.");
      return;
    }

    try {
      const dados = {
        nome: form.nome.trim(),
        estoque_minimo: Number(form.estoque_minimo),
        observacao: form.observacao
      };

      if (!produtoEditando) {
        dados.quantidade_atual = Number(form.quantidade_atual);
      }

      if (produtoEditando) {
        await api.put(`/produtos/${produtoEditando.id}`, dados);
      } else {
        await api.post("/produtos", dados);
      }

      fecharModal();
      carregarProdutos();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao salvar produto.");
    }
  }

  async function excluirProdutoDefinitivo(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este produto definitivamente?\n\nEssa ação não poderá ser desfeita.\n\nAtenção: produtos com entradas ou saídas registradas não poderão ser excluídos."
    );

    if (!confirmar) return;

    try {
      await api.delete(`/produtos/${id}`);

      alert("Produto excluído definitivamente com sucesso.");

      carregarProdutos();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao excluir produto.");
    }
  }

  async function inativarProduto(id) {
    const confirmar = window.confirm("Tem certeza que deseja inativar este produto?");

    if (!confirmar) return;

    try {
      await api.patch(`/produtos/${id}/inativar`);
      carregarProdutos();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao inativar produto.");
    }
  }

  async function reativarProduto(id) {
    try {
      await api.patch(`/produtos/${id}/reativar`);
      carregarProdutos();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao reativar produto.");
    }
  }
  const produtosFiltrados = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (carregando) {
    return <div className="loading-box">Carregando produtos...</div>;
  }

  if (erro) {
    return <div className="error-box">{erro}</div>;
  }

  return (
    <div>
      <div className="page-header produtos-header">
        <div>
          <h1>Produtos Administrativos</h1>
          <p>Controle de materiais administrativos, estoque e status.</p>
        </div>

        <button className="primary-button" onClick={abrirModalNovo}>
          Novo produto
        </button>
      </div>
      <div className="filters-card">
        <label>
          Buscar produto
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite o nome do produto..."
          />
        </label>
      </div>
      <div className="table-card">
        {produtosFiltrados.length === 0 ? (
          <div className="empty-box">Nenhum produto cadastrado.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Estoque atual</th>
                <th>Estoque mínimo</th>
                <th>Status</th>
                <th>Observação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtosFiltrados.map((produto) => {
                const estoqueBaixo =
                  Number(produto.quantidade_atual) <= Number(produto.estoque_minimo);

                return (
                  <tr key={produto.id}>
                    <td>
                      <strong>{produto.nome}</strong>
                    </td>

                    <td>
                      <span className={estoqueBaixo ? "badge danger" : "badge success"}>
                        {produto.quantidade_atual}
                      </span>
                    </td>

                    <td>{produto.estoque_minimo}</td>

                    <td>
                      {produto.status ? (
                        <span className="badge success">Ativo</span>
                      ) : (
                        <span className="badge muted">Inativo</span>
                      )}
                    </td>

                    <td>{produto.observacao || "-"}</td>

                    <td>
                      <div className="actions">
                        <button onClick={() => abrirModalEditar(produto)}>
                          Editar
                        </button>

                        {ehAdministrador && (
                          <button
                            className="delete-button"
                            onClick={() => excluirProdutoDefinitivo(produto.id)}
                          >
                            Excluir definitivo
                          </button>
                        )}


                        {produto.status ? (
                          <button
                            className="danger-button"
                            onClick={() => inativarProduto(produto.id)}
                          >
                            Inativar
                          </button>
                        ) : (
                          <button
                            className="success-button"
                            onClick={() => reativarProduto(produto.id)}
                          >
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{produtoEditando ? "Editar produto" : "Novo produto"}</h2>
              <button onClick={fecharModal}>X</button>
            </div>

            <form onSubmit={salvarProduto} className="form-grid">
              <label>
                Nome do produto
                <input
                  name="nome"
                  value={form.nome}
                  onChange={atualizarCampo}
                  placeholder="Ex: Cupons"
                />
              </label>

              <label>
                Quantidade inicial
                <input
                  name="quantidade_atual"
                  type="number"
                  value={form.quantidade_atual}
                  onChange={atualizarCampo}
                  disabled={!!produtoEditando}
                />
              </label>

              <label>
                Estoque mínimo
                <input
                  name="estoque_minimo"
                  type="number"
                  value={form.estoque_minimo}
                  onChange={atualizarCampo}
                />
              </label>

              <label className="full">
                Observação
                <textarea
                  name="observacao"
                  value={form.observacao}
                  onChange={atualizarCampo}
                  placeholder="Observações sobre o produto"
                />
              </label>

              <div className="modal-actions">
                <button type="button" onClick={fecharModal}>
                  Cancelar
                </button>

                <button type="submit" className="primary-button">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Produtos;