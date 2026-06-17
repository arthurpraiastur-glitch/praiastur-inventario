import { useEffect, useState } from "react";
import api from "../../api/api";
import "./ItensOperacionais.css";

const CATEGORIAS_ITEM = [
  { valor: "MOVEIS_E_ESTRUTURA", nome: "Móveis e Estrutura" },
  { valor: "ELETRONICOS_E_ELETRODOMESTICOS", nome: "Eletrônicos e Eletrodomésticos" },
  { valor: "COZINHA_E_UTENSILIOS", nome: "Cozinha e Utensílios" },
  { valor: "QUARTOS_E_ENXOVAL", nome: "Quartos e Enxoval" },
  { valor: "BANHEIROS", nome: "Banheiros" },
  { valor: "AREA_DE_SERVICO_E_VARANDA", nome: "Área de Serviço e Varanda" },
  { valor: "DECORACAO", nome: "Decoração" },
  { valor: "MANUTENCAO_E_SEGURANCA", nome: "Manutenção e Segurança" },
  { valor: "OUTROS", nome: "Outros" }
];

function nomeCategoria(categoria) {
  const categoriaEncontrada = CATEGORIAS_ITEM.find(
    (item) => item.valor === categoria
  );

  return categoriaEncontrada?.nome || "Sem categoria";
}

function ItensOperacionais() {
  const [itens, setItens] = useState([]);
  const [apartamentos, setApartamentos] = useState([]);
  const [residenciais, setResidenciais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [itemDetalhado, setItemDetalhado] = useState(null);

  const [filtroResidencial, setFiltroResidencial] = useState("");
  const [filtroApartamento, setFiltroApartamento] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [busca, setBusca] = useState("");

  const [form, setForm] = useState({
    residencial_id: "",
    apartamento_id: "",
    nome: "",
    categoria: "",
    quantidade: "",
    status_item: "BOM",
    observacao: ""
  });

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  const ehAdministrador = usuario?.perfil === "ADMINISTRADOR";

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const params = new URLSearchParams();

      if (filtroApartamento) {
        params.append("apartamento_id", filtroApartamento);
      }

      if (filtroCategoria) {
        params.append("categoria", filtroCategoria);
      }

      if (filtroStatus) {
        params.append("status_item", filtroStatus);
      }

      const query = params.toString() ? `?${params.toString()}` : "";

      const [resItens, resApartamentos, resResidenciais] = await Promise.all([
        api.get(`/itens-operacionais${query}`),
        api.get("/apartamentos?status=true"),
        api.get("/residenciais?status=true")
      ]);

      setItens(resItens.data);
      setApartamentos(resApartamentos.data);
      setResidenciais(resResidenciais.data);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Erro ao carregar itens operacionais.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [filtroApartamento, filtroCategoria, filtroStatus]);

  function pegarResidencialIdDoApartamento(apartamento) {
    return apartamento.residencial_id || apartamento.residencial?.id || "";
  }

  const apartamentosDoFiltro = filtroResidencial
    ? apartamentos.filter(
        (apartamento) =>
          String(pegarResidencialIdDoApartamento(apartamento)) ===
          String(filtroResidencial)
      )
    : apartamentos;

  const apartamentosDoFormulario = form.residencial_id
    ? apartamentos.filter(
        (apartamento) =>
          String(pegarResidencialIdDoApartamento(apartamento)) ===
          String(form.residencial_id)
      )
    : [];

  function abrirModalNovo() {
    setItemEditando(null);

    const apartamentoSelecionado = apartamentos.find(
      (apartamento) => String(apartamento.id) === String(filtroApartamento)
    );

    setForm({
      residencial_id:
        filtroResidencial ||
        pegarResidencialIdDoApartamento(apartamentoSelecionado || {}) ||
        "",
      apartamento_id: filtroApartamento || "",
      nome: "",
      categoria: "",
      quantidade: "",
      status_item: "BOM",
      observacao: ""
    });

    setModalAberto(true);
  }

  function abrirModalEditar(item) {
    setItemEditando(item);

    setForm({
      residencial_id: item.apartamento?.residencial?.id || "",
      apartamento_id: item.apartamento_id || "",
      nome: item.nome || "",
      categoria: item.categoria || "",
      quantidade: item.quantidade || 0,
      status_item: item.status_item || "BOM",
      observacao: item.observacao || ""
    });

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setItemEditando(null);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setForm((dadosAtuais) => {
      const novosDados = {
        ...dadosAtuais,
        [name]: value
      };

      if (name === "residencial_id") {
        novosDados.apartamento_id = "";
      }

      return novosDados;
    });
  }

  async function salvarItem(event) {
    event.preventDefault();

    if (!form.residencial_id) {
      alert("Selecione um residencial.");
      return;
    }

    if (!form.apartamento_id) {
      alert("Selecione um apartamento/espaço.");
      return;
    }

    if (!form.nome.trim()) {
      alert("Informe o nome do item.");
      return;
    }

    if (form.quantidade === "") {
      alert("Informe a quantidade.");
      return;
    }

    if (Number(form.quantidade) < 0) {
      alert("A quantidade não pode ser negativa.");
      return;
    }

    if (!form.status_item) {
      alert("Selecione o status do item.");
      return;
    }

    try {
      const dados = {
        apartamento_id: Number(form.apartamento_id),
        nome: form.nome.trim(),
        categoria: form.categoria || null,
        quantidade: Number(form.quantidade),
        status_item: form.status_item,
        observacao: form.observacao
      };

      if (itemEditando) {
        await api.put(`/itens-operacionais/${itemEditando.id}`, dados);
      } else {
        await api.post("/itens-operacionais", dados);
      }

      fecharModal();
      carregarDados();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao salvar item operacional.");
    }
  }

  async function alterarStatusRapido(itemId, novoStatus) {
    try {
      await api.patch(`/itens-operacionais/${itemId}/status`, {
        status_item: novoStatus
      });

      carregarDados();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao alterar status do item.");
    }
  }

  async function excluirItemDefinitivo(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este item operacional definitivamente?\n\nEssa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    try {
      await api.delete(`/itens-operacionais/${id}`);

      alert("Item operacional excluído definitivamente com sucesso.");

      if (itemDetalhado?.id === id) {
        setItemDetalhado(null);
      }

      carregarDados();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao excluir item operacional.");
    }
  }

  async function enviarImagem(event, itemId) {
  const arquivo = event.target.files[0];

  if (!arquivo) return;

  const formData = new FormData();
  formData.append("imagem", arquivo);

  try {
    const resposta = await api.patch(`/itens-operacionais/${itemId}/imagem`, formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });

    const itemAtualizado = resposta.data;

    setItens((itensAtuais) =>
      itensAtuais.map((item) =>
        item.id === itemId
          ? {
              ...item,
              imagem: itemAtualizado.imagem || itemAtualizado.item?.imagem || item.imagem
            }
          : item
      )
    );

    if (itemDetalhado?.id === itemId) {
      setItemDetalhado((itemAtual) => ({
        ...itemAtual,
        imagem: itemAtualizado.imagem || itemAtualizado.item?.imagem || itemAtual.imagem
      }));
    }

    event.target.value = "";
  } catch (error) {
    alert(error.response?.data?.mensagem || "Erro ao enviar imagem.");
  }
}

  function montarUrlImagem(caminho) {
    if (!caminho) return null;

    const uploadsUrl = import.meta.env.VITE_UPLOADS_URL || "http://localhost:3000";

    return `${uploadsUrl}${caminho}`;
  }

  function nomeStatus(status) {
    const nomes = {
      BOM: "Bom",
      ATENCAO: "Atenção",
      PROBLEMA: "Problema",
      EM_FALTA: "Em falta"
    };

    return nomes[status] || status;
  }

  function classeStatus(status) {
    if (status === "BOM") return "success";
    if (status === "ATENCAO") return "warning";
    if (status === "PROBLEMA") return "danger";
    if (status === "EM_FALTA") return "muted";

    return "muted";
  }

  const itensFiltrados = itens.filter((item) => {
    const textoBusca = busca.toLowerCase();

    const pertenceAoResidencialSelecionado = filtroResidencial
      ? String(item.apartamento?.residencial?.id) === String(filtroResidencial)
      : true;

    return (
      pertenceAoResidencialSelecionado &&
      (
        item.nome?.toLowerCase().includes(textoBusca) ||
        item.observacao?.toLowerCase().includes(textoBusca) ||
        item.status_item?.toLowerCase().includes(textoBusca) ||
        nomeCategoria(item.categoria).toLowerCase().includes(textoBusca) ||
        item.apartamento?.nome_numero?.toLowerCase().includes(textoBusca) ||
        item.apartamento?.residencial?.nome?.toLowerCase().includes(textoBusca)
      )
    );
  });

  if (carregando) {
    return <div className="loading-box">Carregando itens operacionais...</div>;
  }

  if (erro) {
    return <div className="error-box">{erro}</div>;
  }

  return (
    <div>
      <div className="page-header itens-header">
        <div>
          <h1>Itens Operacionais</h1>
          <p>Controle os itens físicos dos apartamentos, casas, depósitos e residenciais.</p>
        </div>

        <button className="primary-button" onClick={abrirModalNovo}>
          Novo item
        </button>
      </div>

      <div className="filters-card itens-filters">
        <label>
          Filtrar por residencial
          <select
            value={filtroResidencial}
            onChange={(event) => {
              setFiltroResidencial(event.target.value);
              setFiltroApartamento("");
            }}
          >
            <option value="">Todos os residenciais</option>

            {residenciais.map((residencial) => (
              <option key={residencial.id} value={residencial.id}>
                {residencial.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Filtrar por apartamento/espaço
          <select
            value={filtroApartamento}
            onChange={(event) => setFiltroApartamento(event.target.value)}
          >
            <option value="">Todos os apartamentos/espaços</option>

            {apartamentosDoFiltro.map((apartamento) => (
              <option key={apartamento.id} value={apartamento.id}>
                {apartamento.nome_numero}
                {apartamento.residencial
                  ? ` — ${apartamento.residencial.nome}`
                  : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          Filtrar por categoria
          <select
            value={filtroCategoria}
            onChange={(event) => setFiltroCategoria(event.target.value)}
          >
            <option value="">Todas as categorias</option>

            {CATEGORIAS_ITEM.map((categoria) => (
              <option key={categoria.valor} value={categoria.valor}>
                {categoria.nome}
              </option>
            ))}
          </select>
        </label>

        <label>
          Filtrar por status
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="BOM">Bom</option>
            <option value="ATENCAO">Atenção</option>
            <option value="PROBLEMA">Problema</option>
            <option value="EM_FALTA">Em falta</option>
          </select>
        </label>

        <label>
          Buscar item
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite item, categoria, observação, apartamento ou residencial..."
          />
        </label>
      </div>

      <div className="table-card">
        {itensFiltrados.length === 0 ? (
          <div className="empty-box">Nenhum item operacional cadastrado.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Item</th>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Status</th>
                <th>Apartamento / Espaço</th>
                <th>Observação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {itensFiltrados.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="mini-image-box">
                      {item.imagem ? (
                        <img
                          src={montarUrlImagem(item.imagem)}
                          alt={item.nome}
                        />
                      ) : (
                        <span>Sem imagem</span>
                      )}
                    </div>

                    <label className="mini-upload">
                      Alterar
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(event) => enviarImagem(event, item.id)}
                      />
                    </label>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="item-name-button"
                      onClick={() => setItemDetalhado(item)}
                    >
                      {item.nome}
                    </button>
                  </td>

                  <td>{nomeCategoria(item.categoria)}</td>

                  <td>{item.quantidade}</td>

                  <td>
                    <span className={`badge ${classeStatus(item.status_item)}`}>
                      {nomeStatus(item.status_item)}
                    </span>
                  </td>

                  <td>
                    {item.apartamento ? (
                      <>
                        <strong>{item.apartamento.nome_numero}</strong>
                        <br />
                        <small>
                          {item.apartamento.residencial?.nome || "-"}
                        </small>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>{item.observacao || "-"}</td>

                  <td>
                    <div className="actions">
                      <button onClick={() => setItemDetalhado(item)}>
                        Ver
                      </button>

                      <button onClick={() => abrirModalEditar(item)}>
                        Editar
                      </button>

                      <select
                        className="status-select"
                        value={item.status_item}
                        onChange={(event) =>
                          alterarStatusRapido(item.id, event.target.value)
                        }
                      >
                        <option value="BOM">Bom</option>
                        <option value="ATENCAO">Atenção</option>
                        <option value="PROBLEMA">Problema</option>
                        <option value="EM_FALTA">Em falta</option>
                      </select>

                      {ehAdministrador && (
                        <button
                          className="delete-button"
                          onClick={() => excluirItemDefinitivo(item.id)}
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>{itemEditando ? "Editar item" : "Novo item operacional"}</h2>

              <button onClick={fecharModal}>X</button>
            </div>

            <form onSubmit={salvarItem} className="form-grid">
              <label>
                Residencial
                <select
                  name="residencial_id"
                  value={form.residencial_id}
                  onChange={atualizarCampo}
                >
                  <option value="">Selecione um residencial</option>

                  {residenciais.map((residencial) => (
                    <option key={residencial.id} value={residencial.id}>
                      {residencial.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Apartamento / Espaço
                <select
                  name="apartamento_id"
                  value={form.apartamento_id}
                  onChange={atualizarCampo}
                  disabled={!form.residencial_id}
                >
                  <option value="">
                    {form.residencial_id
                      ? "Selecione um apartamento/espaço"
                      : "Selecione primeiro um residencial"}
                  </option>

                  {apartamentosDoFormulario.map((apartamento) => (
                    <option key={apartamento.id} value={apartamento.id}>
                      {apartamento.nome_numero}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Nome do item
                <input
                  name="nome"
                  value={form.nome}
                  onChange={atualizarCampo}
                  placeholder="Ex: TV 42 polegadas"
                />
              </label>

              <label>
                Categoria
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={atualizarCampo}
                >
                  <option value="">Selecione uma categoria</option>

                  {CATEGORIAS_ITEM.map((categoria) => (
                    <option key={categoria.valor} value={categoria.valor}>
                      {categoria.nome}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Quantidade
                <input
                  name="quantidade"
                  type="number"
                  min="0"
                  value={form.quantidade}
                  onChange={atualizarCampo}
                  placeholder="Ex: 1"
                />
              </label>

              <label>
                Status
                <select
                  name="status_item"
                  value={form.status_item}
                  onChange={atualizarCampo}
                >
                  <option value="BOM">Bom</option>
                  <option value="ATENCAO">Atenção</option>
                  <option value="PROBLEMA">Problema</option>
                  <option value="EM_FALTA">Em falta</option>
                </select>
              </label>

              <label className="full">
                Observação
                <textarea
                  name="observacao"
                  value={form.observacao}
                  onChange={atualizarCampo}
                  placeholder="Ex: Controle com pilha fraca, toalhas manchadas..."
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

      {itemDetalhado && (
        <div className="modal-overlay">
          <div className="modal-card item-detail-modal">
            <div className="modal-header">
              <h2>{itemDetalhado.nome}</h2>
              <button onClick={() => setItemDetalhado(null)}>X</button>
            </div>

            <div className="item-detail-content">
              <div className="item-detail-image">
                {itemDetalhado.imagem ? (
                  <img
                    src={montarUrlImagem(itemDetalhado.imagem)}
                    alt={itemDetalhado.nome}
                  />
                ) : (
                  <span>Sem imagem</span>
                )}
              </div>

              <div className="item-detail-info">
                <p>
                  <strong>Categoria:</strong> {nomeCategoria(itemDetalhado.categoria)}
                </p>

                <p>
                  <strong>Quantidade:</strong> {itemDetalhado.quantidade}
                </p>

                <p>
                  <strong>Status:</strong> {nomeStatus(itemDetalhado.status_item)}
                </p>

                <p>
                  <strong>Residencial:</strong>{" "}
                  {itemDetalhado.apartamento?.residencial?.nome || "-"}
                </p>

                <p>
                  <strong>Apartamento / Espaço:</strong>{" "}
                  {itemDetalhado.apartamento?.nome_numero || "-"}
                </p>

                <p>
                  <strong>Observação:</strong>{" "}
                  {itemDetalhado.observacao || "-"}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  setItemDetalhado(null);
                  abrirModalEditar(itemDetalhado);
                }}
              >
                Editar
              </button>

              {ehAdministrador && (
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => excluirItemDefinitivo(itemDetalhado.id)}
                >
                  Excluir definitivamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItensOperacionais;