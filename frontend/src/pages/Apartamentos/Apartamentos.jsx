import { useEffect, useState } from "react";
import api from "../../api/api";
import "./Apartamentos.css";

function Apartamentos() {
  const [apartamentos, setApartamentos] = useState([]);
  const [residenciais, setResidenciais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [apartamentoEditando, setApartamentoEditando] = useState(null);
  const [apartamentoDetalhado, setApartamentoDetalhado] = useState(null);
  const [itensDoApartamento, setItensDoApartamento] = useState([]);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

  const [filtroResidencial, setFiltroResidencial] = useState("");

  const [form, setForm] = useState({
    residencial_id: "",
    nome_numero: "",
    tipo: "",
    observacao: ""
  });

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  const ehAdministrador = usuario?.perfil === "ADMINISTRADOR";

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

      const paramsApartamentos = filtroResidencial
        ? `?residencial_id=${filtroResidencial}`
        : "";

      const [resApartamentos, resResidenciais] = await Promise.all([
        api.get(`/apartamentos${paramsApartamentos}`),
        api.get("/residenciais?status=true")
      ]);

      setApartamentos(resApartamentos.data);
      setResidenciais(resResidenciais.data);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Erro ao carregar apartamentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, [filtroResidencial]);

  function abrirModalNovo() {
    setApartamentoEditando(null);

    setForm({
      residencial_id: filtroResidencial || "",
      nome_numero: "",
      tipo: "",
      observacao: ""
    });

    setModalAberto(true);
  }

  function abrirModalEditar(apartamento) {
    setApartamentoEditando(apartamento);

    setForm({
      residencial_id: apartamento.residencial_id || apartamento.residencial?.id || "",
      nome_numero: apartamento.nome_numero || "",
      tipo: apartamento.tipo || "",
      observacao: apartamento.observacao || ""
    });

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setApartamentoEditando(null);
  }

  async function abrirDetalhesApartamento(apartamento) {
    setApartamentoDetalhado(apartamento);
    setItensDoApartamento([]);
    setCarregandoDetalhes(true);

    try {
      const resposta = await api.get(
        `/itens-operacionais?apartamento_id=${apartamento.id}`
      );

      setItensDoApartamento(resposta.data);
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao carregar itens do apartamento.");
    } finally {
      setCarregandoDetalhes(false);
    }
  }

  function fecharDetalhesApartamento() {
    setApartamentoDetalhado(null);
    setItensDoApartamento([]);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setForm((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value
    }));
  }

  async function salvarApartamento(event) {
    event.preventDefault();

    if (!form.residencial_id) {
      alert("Selecione um residencial.");
      return;
    }

    if (!form.nome_numero.trim()) {
      alert("Informe o nome ou número do apartamento/espaço.");
      return;
    }

    try {
      const dados = {
        residencial_id: Number(form.residencial_id),
        nome_numero: form.nome_numero.trim(),
        tipo: form.tipo,
        observacao: form.observacao
      };

      if (apartamentoEditando) {
        await api.put(`/apartamentos/${apartamentoEditando.id}`, dados);
      } else {
        await api.post("/apartamentos", dados);
      }

      fecharModal();
      carregarDados();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao salvar apartamento/espaço.");
    }
  }

  async function inativarApartamento(id) {
    const confirmar = window.confirm("Tem certeza que deseja inativar este apartamento/espaço?");

    if (!confirmar) return;

    try {
      await api.patch(`/apartamentos/${id}/inativar`);
      carregarDados();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao inativar apartamento/espaço.");
    }
  }

  async function excluirApartamentoDefinitivo(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este apartamento definitivamente?\n\nTodos os itens operacionais vinculados a ele também serão excluídos.\n\nEssa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    try {
      await api.delete(`/apartamentos/${id}`);

      alert("Apartamento excluído definitivamente com sucesso.");

      if (apartamentoDetalhado?.id === id) {
        fecharDetalhesApartamento();
      }

      carregarDados();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao excluir apartamento.");
    }
  }

  async function reativarApartamento(id) {
    try {
      await api.patch(`/apartamentos/${id}/reativar`);
      carregarDados();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao reativar apartamento/espaço.");
    }
  }

  async function enviarImagem(event, apartamentoId) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    const formData = new FormData();
    formData.append("imagem", arquivo);

    try {
      await api.patch(`/apartamentos/${apartamentoId}/imagem`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      carregarDados();
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

  function contarItensPorStatus(status) {
    return itensDoApartamento.filter((item) => item.status_item === status).length;
  }

  function abrirItensOperacionaisFiltrado(apartamentoId) {
    window.location.href = `/itens-operacionais?apartamento_id=${apartamentoId}`;
  }

  const apartamentosFiltrados = apartamentos.filter((apartamento) => {
    const textoBusca = busca.toLowerCase();

    return (
      apartamento.nome_numero?.toLowerCase().includes(textoBusca) ||
      apartamento.tipo?.toLowerCase().includes(textoBusca) ||
      apartamento.observacao?.toLowerCase().includes(textoBusca) ||
      apartamento.residencial?.nome?.toLowerCase().includes(textoBusca)
    );
  });

  if (carregando) {
    return <div className="loading-box">Carregando apartamentos...</div>;
  }

  if (erro) {
    return <div className="error-box">{erro}</div>;
  }

  return (
    <div>
      <div className="page-header apartamentos-header">
        <div>
          <h1>Apartamentos / Espaços</h1>
          <p>Cadastre apartamentos, casas, depósitos e espaços vinculados aos residenciais.</p>
        </div>

        <button className="primary-button" onClick={abrirModalNovo}>
          Novo apartamento/espaço
        </button>
      </div>

      <div className="filters-card apartamentos-filters">
        <label>
          Filtrar por residencial
          <select
            value={filtroResidencial}
            onChange={(event) => setFiltroResidencial(event.target.value)}
          >
            <option value="">Todos os residenciais</option>

            {residenciais.map((residencial) => (
              <option key={residencial.id} value={residencial.id}>
                {residencial.nome} — {residencial.cidade}/{residencial.estado}
              </option>
            ))}
          </select>
        </label>

        <label>
          Buscar apartamento/espaço
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite número, tipo ou residencial..."
          />
        </label>
      </div>

      <div className="table-card">
        {apartamentosFiltrados.length === 0 ? (
          <div className="empty-box">Nenhum apartamento/espaço cadastrado.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome / Número</th>
                <th>Tipo</th>
                <th>Residencial</th>
                <th>Status</th>
                <th>Observação</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {apartamentosFiltrados.map((apartamento) => (
                <tr key={apartamento.id}>
                  <td>
                    <div className="mini-image-box">
                      {apartamento.imagem ? (
                        <img
                          src={montarUrlImagem(apartamento.imagem)}
                          alt={apartamento.nome_numero}
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
                        onChange={(event) => enviarImagem(event, apartamento.id)}
                      />
                    </label>
                  </td>

                  <td>
                    <button
                      type="button"
                      className="apartamento-name-button"
                      onClick={() => abrirDetalhesApartamento(apartamento)}
                    >
                      {apartamento.nome_numero}
                    </button>
                  </td>

                  <td>{apartamento.tipo || "-"}</td>

                  <td>
                    {apartamento.residencial ? (
                      <>
                        <strong>{apartamento.residencial.nome}</strong>
                        <br />
                        <small>
                          {apartamento.residencial.cidade}/{apartamento.residencial.estado}
                        </small>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    {apartamento.status ? (
                      <span className="badge success">Ativo</span>
                    ) : (
                      <span className="badge muted">Inativo</span>
                    )}
                  </td>

                  <td>{apartamento.observacao || "-"}</td>

                  <td>
                    <div className="actions">
                      <button onClick={() => abrirDetalhesApartamento(apartamento)}>
                        Ver
                      </button>

                      <button onClick={() => abrirModalEditar(apartamento)}>
                        Editar
                      </button>

                      {apartamento.status ? (
                        <button
                          className="danger-button"
                          onClick={() => inativarApartamento(apartamento.id)}
                        >
                          Inativar
                        </button>
                      ) : (
                        <button
                          className="success-button"
                          onClick={() => reativarApartamento(apartamento.id)}
                        >
                          Reativar
                        </button>
                      )}

                      {ehAdministrador && (
                        <button
                          className="delete-button"
                          onClick={() => excluirApartamentoDefinitivo(apartamento.id)}
                        >
                          Excluir definitivo
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
              <h2>
                {apartamentoEditando
                  ? "Editar apartamento/espaço"
                  : "Novo apartamento/espaço"}
              </h2>

              <button onClick={fecharModal}>X</button>
            </div>

            <form onSubmit={salvarApartamento} className="form-grid">
              <label className="full">
                Residencial
                <select
                  name="residencial_id"
                  value={form.residencial_id}
                  onChange={atualizarCampo}
                >
                  <option value="">Selecione um residencial</option>

                  {residenciais.map((residencial) => (
                    <option key={residencial.id} value={residencial.id}>
                      {residencial.nome} — {residencial.cidade}/{residencial.estado}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Nome / Número
                <input
                  name="nome_numero"
                  value={form.nome_numero}
                  onChange={atualizarCampo}
                  placeholder="Ex: 101, Casa 02, Depósito"
                />
              </label>

              <label>
                Tipo
                <input
                  name="tipo"
                  value={form.tipo}
                  onChange={atualizarCampo}
                  placeholder="Ex: Apartamento, Casa, Estoque"
                />
              </label>

              <label className="full">
                Observação
                <textarea
                  name="observacao"
                  value={form.observacao}
                  onChange={atualizarCampo}
                  placeholder="Observações sobre o apartamento/espaço"
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

      {apartamentoDetalhado && (
        <div className="modal-overlay">
          <div className="modal-card apartamento-detail-modal">
            <div className="modal-header">
              <h2>{apartamentoDetalhado.nome_numero}</h2>
              <button onClick={fecharDetalhesApartamento}>X</button>
            </div>

            <div className="apartamento-detail-content">
              <div className="apartamento-detail-image">
                {apartamentoDetalhado.imagem ? (
                  <img
                    src={montarUrlImagem(apartamentoDetalhado.imagem)}
                    alt={apartamentoDetalhado.nome_numero}
                  />
                ) : (
                  <span>Sem imagem</span>
                )}
              </div>

              <div className="apartamento-detail-info">
                <p>
                  <strong>Tipo:</strong> {apartamentoDetalhado.tipo || "-"}
                </p>

                <p>
                  <strong>Residencial:</strong>{" "}
                  {apartamentoDetalhado.residencial?.nome || "-"}
                </p>

                <p>
                  <strong>Cidade/Estado:</strong>{" "}
                  {apartamentoDetalhado.residencial
                    ? `${apartamentoDetalhado.residencial.cidade}/${apartamentoDetalhado.residencial.estado}`
                    : "-"}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {apartamentoDetalhado.status ? "Ativo" : "Inativo"}
                </p>

                <p>
                  <strong>Observação:</strong>{" "}
                  {apartamentoDetalhado.observacao || "-"}
                </p>
              </div>
            </div>

            <div className="apartamento-summary-grid">
              <div className="apartamento-summary-card">
                <span>Total de itens</span>
                <strong>{itensDoApartamento.length}</strong>
              </div>

              <div className="apartamento-summary-card">
                <span>Bom</span>
                <strong>{contarItensPorStatus("BOM")}</strong>
              </div>

              <div className="apartamento-summary-card">
                <span>Atenção</span>
                <strong>{contarItensPorStatus("ATENCAO")}</strong>
              </div>

              <div className="apartamento-summary-card">
                <span>Problema</span>
                <strong>{contarItensPorStatus("PROBLEMA")}</strong>
              </div>

              <div className="apartamento-summary-card">
                <span>Em falta</span>
                <strong>{contarItensPorStatus("EM_FALTA")}</strong>
              </div>
            </div>

            <div className="apartamento-items-preview">
              <h3>Itens vinculados</h3>

              {carregandoDetalhes ? (
                <p>Carregando itens...</p>
              ) : itensDoApartamento.length === 0 ? (
                <p>Nenhum item cadastrado neste apartamento/espaço.</p>
              ) : (
                <div className="apartamento-items-list">
                  {itensDoApartamento.slice(0, 6).map((item) => (
                    <div key={item.id} className="apartamento-item-line">
                      <strong>{item.nome}</strong>
                      <span>
                        {item.quantidade} un. — {nomeStatus(item.status_item)}
                      </span>
                    </div>
                  ))}

                  {itensDoApartamento.length > 6 && (
                    <small>
                      + {itensDoApartamento.length - 6} itens não exibidos aqui.
                    </small>
                  )}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => abrirItensOperacionaisFiltrado(apartamentoDetalhado.id)}
              >
                Ver itens operacionais
              </button>

              <button
                type="button"
                onClick={() => {
                  fecharDetalhesApartamento();
                  abrirModalEditar(apartamentoDetalhado);
                }}
              >
                Editar
              </button>

              {ehAdministrador && (
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => excluirApartamentoDefinitivo(apartamentoDetalhado.id)}
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

export default Apartamentos;