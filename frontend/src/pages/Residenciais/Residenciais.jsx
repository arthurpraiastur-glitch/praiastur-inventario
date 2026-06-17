import { useEffect, useState } from "react";
import api from "../../api/api";
import "./Residenciais.css";
import ImageCropModal from "../../components/ImageCropModal/ImageCropModal";

function Residenciais() {
  const [residenciais, setResidenciais] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [residencialEditando, setResidencialEditando] = useState(null);

  const [residencialDetalhado, setResidencialDetalhado] = useState(null);
  const [apartamentosDoResidencial, setApartamentosDoResidencial] = useState([]);
  const [itensDoResidencial, setItensDoResidencial] = useState([]);
  const [carregandoDetalhes, setCarregandoDetalhes] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cidade: "",
    estado: "",
    endereco: "",
    observacao: ""
  });

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  const ehAdministrador = usuario?.perfil === "ADMINISTRADOR";


  const [cropAberto, setCropAberto] = useState(false);
  const [imagemParaCortar, setImagemParaCortar] = useState(null);
  const [residencialImagemId, setResidencialImagemId] = useState(null);

  async function carregarResidenciais() {
    try {
      setCarregando(true);
      setErro("");

      const resposta = await api.get("/residenciais");

      setResidenciais(resposta.data);
    } catch (error) {
      setErro(error.response?.data?.mensagem || "Erro ao carregar residenciais.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarResidenciais();
  }, []);

  function abrirModalNovo() {
    setResidencialEditando(null);

    setForm({
      nome: "",
      cidade: "",
      estado: "",
      endereco: "",
      observacao: ""
    });

    setModalAberto(true);
  }

  function abrirModalEditar(residencial) {
    setResidencialEditando(residencial);

    setForm({
      nome: residencial.nome || "",
      cidade: residencial.cidade || "",
      estado: residencial.estado || "",
      endereco: residencial.endereco || "",
      observacao: residencial.observacao || ""
    });

    setModalAberto(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setResidencialEditando(null);
  }

  async function abrirDetalhesResidencial(residencial) {
    setResidencialDetalhado(residencial);
    setApartamentosDoResidencial([]);
    setItensDoResidencial([]);
    setCarregandoDetalhes(true);

    try {
      const respostaApartamentos = await api.get(
        `/apartamentos?residencial_id=${residencial.id}`
      );

      const apartamentos = respostaApartamentos.data;
      setApartamentosDoResidencial(apartamentos);

      if (apartamentos.length === 0) {
        setItensDoResidencial([]);
        return;
      }

      const respostasItens = await Promise.all(
        apartamentos.map((apartamento) =>
          api.get(`/itens-operacionais?apartamento_id=${apartamento.id}`)
        )
      );

      const todosItens = respostasItens.flatMap((resposta) => resposta.data);

      setItensDoResidencial(todosItens);
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao carregar detalhes do residencial.");
    } finally {
      setCarregandoDetalhes(false);
    }
  }

  function fecharDetalhesResidencial() {
    setResidencialDetalhado(null);
    setApartamentosDoResidencial([]);
    setItensDoResidencial([]);
  }

  function atualizarCampo(event) {
    const { name, value } = event.target;

    setForm((dadosAtuais) => ({
      ...dadosAtuais,
      [name]: value
    }));
  }

  async function salvarResidencial(event) {
    event.preventDefault();

    if (!form.nome.trim()) {
      alert("Informe o nome do residencial.");
      return;
    }

    if (!form.cidade.trim()) {
      alert("Informe a cidade.");
      return;
    }

    if (!form.estado.trim()) {
      alert("Informe o estado.");
      return;
    }

    if (form.estado.trim().length !== 2) {
      alert("Informe o estado com 2 letras. Ex: SC");
      return;
    }

    try {
      const dados = {
        nome: form.nome.trim(),
        cidade: form.cidade.trim(),
        estado: form.estado.trim().toUpperCase(),
        endereco: form.endereco,
        observacao: form.observacao
      };

      if (residencialEditando) {
        await api.put(`/residenciais/${residencialEditando.id}`, dados);
      } else {
        await api.post("/residenciais", dados);
      }

      fecharModal();
      carregarResidenciais();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao salvar residencial.");
    }
  }

  async function inativarResidencial(id) {
    const confirmar = window.confirm("Tem certeza que deseja inativar este residencial?");

    if (!confirmar) return;

    try {
      await api.patch(`/residenciais/${id}/inativar`);
      carregarResidenciais();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao inativar residencial.");
    }
  }

  async function excluirResidencialDefinitivo(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este residencial definitivamente?\n\nTodos os apartamentos e itens operacionais vinculados a ele também serão excluídos.\n\nEssa ação não poderá ser desfeita."
    );

    if (!confirmar) return;

    try {
      await api.delete(`/residenciais/${id}`);

      alert("Residencial excluído definitivamente com sucesso.");

      if (residencialDetalhado?.id === id) {
        fecharDetalhesResidencial();
      }

      carregarResidenciais();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao excluir residencial.");
    }
  }

  async function reativarResidencial(id) {
    try {
      await api.patch(`/residenciais/${id}/reativar`);
      carregarResidenciais();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao reativar residencial.");
    }
  }

  function enviarImagem(event, residencialId) {
    const arquivo = event.target.files[0];

    if (!arquivo) return;

    const urlTemporaria = URL.createObjectURL(arquivo);

    setImagemParaCortar(urlTemporaria);
    setResidencialImagemId(residencialId);
    setCropAberto(true);

    event.target.value = "";
  }

  async function confirmarImagemCortada(arquivoCortado) {
    if (!arquivoCortado || !residencialImagemId) return;

    const formData = new FormData();
    formData.append("imagem", arquivoCortado);

    try {
      await api.patch(`/residenciais/${residencialImagemId}/imagem`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      fecharCropImagem();
      carregarResidenciais();
    } catch (error) {
      alert(error.response?.data?.mensagem || "Erro ao enviar imagem.");
    }
  }

  function fecharCropImagem() {
    if (imagemParaCortar) {
      URL.revokeObjectURL(imagemParaCortar);
    }

    setCropAberto(false);
    setImagemParaCortar(null);
    setResidencialImagemId(null);
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
    return itensDoResidencial.filter((item) => item.status_item === status).length;
  }

  function contarApartamentosAtivos() {
    return apartamentosDoResidencial.filter((apartamento) => apartamento.status).length;
  }

  function abrirApartamentos() {
    window.location.href = "/apartamentos";
  }

  function abrirItensOperacionais() {
    window.location.href = "/itens-operacionais";
  }

  const residenciaisFiltrados = residenciais.filter((residencial) => {
    const textoBusca = busca.toLowerCase();

    return (
      residencial.nome?.toLowerCase().includes(textoBusca) ||
      residencial.cidade?.toLowerCase().includes(textoBusca) ||
      residencial.estado?.toLowerCase().includes(textoBusca)
    );
  });

  if (carregando) {
    return <div className="loading-box">Carregando residenciais...</div>;
  }

  if (erro) {
    return <div className="error-box">{erro}</div>;
  }

  return (
    <div>
      <div className="page-header residenciais-header">
        <div>
          <h1>Residenciais</h1>
          <p>Cadastro dos residenciais, casas e estruturas da Praiastur.</p>
        </div>

        <button className="primary-button" onClick={abrirModalNovo}>
          Novo residencial
        </button>
      </div>

      <div className="filters-card residenciais-filters">
        <label>
          Buscar residencial
          <input
            type="text"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Digite nome, cidade ou estado..."
          />
        </label>
      </div>

      {residenciaisFiltrados.length === 0 ? (
        <div className="empty-box">Nenhum residencial cadastrado.</div>
      ) : (
        <div className="residenciais-grid">
          {residenciaisFiltrados.map((residencial) => (
            <div className="residencial-card" key={residencial.id}>
              <div className="residencial-image">
                {residencial.imagem ? (
                  <img
                    src={montarUrlImagem(residencial.imagem)}
                    alt={residencial.nome}
                  />
                ) : (
                  <span>Sem imagem</span>
                )}
              </div>

              <div className="residencial-body">
                <div className="residencial-title-row">
                  <button
                    type="button"
                    className="residencial-name-button"
                    onClick={() => abrirDetalhesResidencial(residencial)}
                  >
                    {residencial.nome}
                  </button>

                  {residencial.status ? (
                    <span className="badge success">Ativo</span>
                  ) : (
                    <span className="badge muted">Inativo</span>
                  )}
                </div>

                <p>
                  {residencial.cidade} / {residencial.estado}
                </p>

                <p>{residencial.endereco || "Endereço não informado"}</p>

                {residencial.observacao && (
                  <small>{residencial.observacao}</small>
                )}

                <div className="upload-area">
                  <label>
                    Alterar imagem
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => enviarImagem(event, residencial.id)}
                    />
                  </label>
                </div>

                <div className="actions residencial-actions">
                  <button onClick={() => abrirDetalhesResidencial(residencial)}>
                    Ver
                  </button>

                  <button onClick={() => abrirModalEditar(residencial)}>
                    Editar
                  </button>

                  {residencial.status ? (
                    <button
                      className="danger-button"
                      onClick={() => inativarResidencial(residencial.id)}
                    >
                      Inativar
                    </button>
                  ) : (
                    <button
                      className="success-button"
                      onClick={() => reativarResidencial(residencial.id)}
                    >
                      Reativar
                    </button>
                  )}

                  {ehAdministrador && (
                    <button
                      className="delete-button"
                      onClick={() => excluirResidencialDefinitivo(residencial.id)}
                    >
                      Excluir definitivo
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAberto && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2>
                {residencialEditando ? "Editar residencial" : "Novo residencial"}
              </h2>
              <button onClick={fecharModal}>X</button>
            </div>

            <form onSubmit={salvarResidencial} className="form-grid">
              <label>
                Nome
                <input
                  name="nome"
                  value={form.nome}
                  onChange={atualizarCampo}
                  placeholder="Ex: Residencial Bella Flor"
                />
              </label>

              <label>
                Cidade
                <input
                  name="cidade"
                  value={form.cidade}
                  onChange={atualizarCampo}
                  placeholder="Ex: Bombinhas"
                />
              </label>

              <label>
                Estado
                <input
                  name="estado"
                  value={form.estado}
                  onChange={atualizarCampo}
                  placeholder="Ex: SC"
                  maxLength="2"
                />
              </label>

              <label>
                Endereço
                <input
                  name="endereco"
                  value={form.endereco}
                  onChange={atualizarCampo}
                  placeholder="Rua, número..."
                />
              </label>

              <label className="full">
                Observação
                <textarea
                  name="observacao"
                  value={form.observacao}
                  onChange={atualizarCampo}
                  placeholder="Observações sobre o residencial"
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

      {residencialDetalhado && (
        <div className="modal-overlay">
          <div className="modal-card residencial-detail-modal">
            <div className="modal-header">
              <h2>{residencialDetalhado.nome}</h2>
              <button onClick={fecharDetalhesResidencial}>X</button>
            </div>

            <div className="residencial-detail-content">
              <div className="residencial-detail-image">
                {residencialDetalhado.imagem ? (
                  <img
                    src={montarUrlImagem(residencialDetalhado.imagem)}
                    alt={residencialDetalhado.nome}
                  />
                ) : (
                  <span>Sem imagem</span>
                )}
              </div>

              <div className="residencial-detail-info">
                <p>
                  <strong>Cidade/Estado:</strong>{" "}
                  {residencialDetalhado.cidade}/{residencialDetalhado.estado}
                </p>

                <p>
                  <strong>Endereço:</strong>{" "}
                  {residencialDetalhado.endereco || "-"}
                </p>

                <p>
                  <strong>Status:</strong>{" "}
                  {residencialDetalhado.status ? "Ativo" : "Inativo"}
                </p>

                <p>
                  <strong>Observação:</strong>{" "}
                  {residencialDetalhado.observacao || "-"}
                </p>
              </div>
            </div>

            <div className="residencial-summary-grid">
              <div className="residencial-summary-card">
                <span>Apartamentos</span>
                <strong>{apartamentosDoResidencial.length}</strong>
              </div>

              <div className="residencial-summary-card">
                <span>Apartamentos ativos</span>
                <strong>{contarApartamentosAtivos()}</strong>
              </div>

              <div className="residencial-summary-card">
                <span>Total de itens</span>
                <strong>{itensDoResidencial.length}</strong>
              </div>

              <div className="residencial-summary-card">
                <span>Bom</span>
                <strong>{contarItensPorStatus("BOM")}</strong>
              </div>

              <div className="residencial-summary-card">
                <span>Atenção</span>
                <strong>{contarItensPorStatus("ATENCAO")}</strong>
              </div>

              <div className="residencial-summary-card">
                <span>Problema</span>
                <strong>{contarItensPorStatus("PROBLEMA")}</strong>
              </div>

              <div className="residencial-summary-card">
                <span>Em falta</span>
                <strong>{contarItensPorStatus("EM_FALTA")}</strong>
              </div>
            </div>

            <div className="residencial-items-preview">
              <h3>Apartamentos vinculados</h3>

              {carregandoDetalhes ? (
                <p>Carregando informações...</p>
              ) : apartamentosDoResidencial.length === 0 ? (
                <p>Nenhum apartamento/espaço cadastrado neste residencial.</p>
              ) : (
                <div className="residencial-items-list">
                  {apartamentosDoResidencial.slice(0, 8).map((apartamento) => (
                    <div key={apartamento.id} className="residencial-item-line">
                      <strong>{apartamento.nome_numero}</strong>
                      <span>
                        {apartamento.tipo || "Sem tipo"} —{" "}
                        {apartamento.status ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  ))}

                  {apartamentosDoResidencial.length > 8 && (
                    <small>
                      + {apartamentosDoResidencial.length - 8} apartamentos não exibidos aqui.
                    </small>
                  )}
                </div>
              )}
            </div>

            <div className="residencial-items-preview">
              <h3>Itens com atenção, problema ou em falta</h3>

              {carregandoDetalhes ? (
                <p>Carregando itens...</p>
              ) : itensDoResidencial.filter((item) => item.status_item !== "BOM").length === 0 ? (
                <p>Nenhum item crítico encontrado neste residencial.</p>
              ) : (
                <div className="residencial-items-list">
                  {itensDoResidencial
                    .filter((item) => item.status_item !== "BOM")
                    .slice(0, 8)
                    .map((item) => (
                      <div key={item.id} className="residencial-item-line">
                        <strong>{item.nome}</strong>
                        <span>
                          {item.apartamento?.nome_numero || "-"} —{" "}
                          {nomeStatus(item.status_item)}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button type="button" onClick={abrirApartamentos}>
                Ver apartamentos
              </button>

              <button type="button" onClick={abrirItensOperacionais}>
                Ver itens operacionais
              </button>

              <button
                type="button"
                onClick={() => {
                  fecharDetalhesResidencial();
                  abrirModalEditar(residencialDetalhado);
                }}
              >
                Editar
              </button>

              {ehAdministrador && (
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => excluirResidencialDefinitivo(residencialDetalhado.id)}
                >
                  Excluir definitivamente
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {cropAberto && imagemParaCortar && (
        <ImageCropModal
          imagem={imagemParaCortar}
          aspect={4 / 3}
          onCancel={fecharCropImagem}
          onConfirm={confirmarImagemCortada}
        />
      )}
    </div>
  );
}

export default Residenciais;