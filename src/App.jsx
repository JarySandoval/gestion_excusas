import "./App.css";

function App() {
  return (
    <div className="app">

      {/* Barra lateral */}
      <aside className="sidebar">

        <div className="logo">
          IED
        </div>

        <h2>La Victoria</h2>

        <p className="sidebar-subtitle">
          Sistema de Excusas
        </p>

        <nav className="menu">

          <button className="menu-item active">
            Mis excusas
          </button>

          <button className="menu-item">
            Nueva excusa
          </button>

        </nav>

      </aside>


      {/* Contenido principal */}
      <main className="main-content">

        {/* Encabezado */}
        <header className="header">

          <div>
            <h1>Mis excusas</h1>

            <p>
              Consulta el estado de tus excusas escolares
            </p>
          </div>

          <div className="user">

            <div className="user-info">
              <strong>Estudiante</strong>
              <span>Estudiante</span>
            </div>

            <div className="avatar">
              ES
            </div>

          </div>

        </header>


        {/* Botón */}
        <div className="top-actions">

          <button className="primary-button">
            + Nueva excusa
          </button>

        </div>


        {/* Resumen */}
        <section className="summary">

          <div className="summary-card">

            <span className="summary-title">
              Total de excusas
            </span>

            <strong>4</strong>

          </div>


          <div className="summary-card">

            <span className="summary-title">
              Pendientes
            </span>

            <strong>1</strong>

          </div>


          <div className="summary-card">

            <span className="summary-title">
              Aprobadas
            </span>

            <strong>3</strong>

          </div>

        </section> 


        {/* Lista de excusas */}
        <section className="excuses-section">

          <div className="section-header">

            <div>
              <h2>Excusas registradas</h2>

              <p>
                Historial de tus solicitudes hoyyyy
              </p>
            </div>

          </div>


          {/* Excusa 1 */}
          <div className="excuse-card">

            <div className="excuse-main">

              <div className="excuse-icon">
                E
              </div>

              <div>

                <h3>
                  Excusa por cita médica
                </h3>

                <p>
                  12 de septiembre de 2026
                </p>

              </div>

            </div>


            <div className="excuse-status pending">
              Pendiente
            </div>


            <button className="details-button">
              Ver detalle
            </button>

          </div>


          {/* Excusa 2 */}
          <div className="excuse-card">

            <div className="excuse-main">

              <div className="excuse-icon">
                E
              </div>

              <div>

                <h3>
                  Excusa por calamidad familiar
                </h3>

                <p>
                  5 de septiembre de 2026
                </p>

              </div>

            </div>


            <div className="excuse-status approved">
              Aprobada
            </div>


            <button className="details-button">
              Ver detalle
            </button>

          </div>


          {/* Excusa 3 */}
          <div className="excuse-card">

            <div className="excuse-main">

              <div className="excuse-icon">
                E
              </div>

              <div>

                <h3>
                  Excusa por enfermedad
                </h3>

                <p>
                  28 de agosto de 2026
                </p>

              </div>

            </div>


            <div className="excuse-status approved">
              Aprobada
            </div>


            <button className="details-button">
              Ver detalle
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default App;