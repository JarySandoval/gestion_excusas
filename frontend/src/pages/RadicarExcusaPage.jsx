import { useNavigate } from 'react-router-dom';
import FormularioRadicacion from '../components/excusas/FormularioRadicacion';
import { ArrowLeft, FilePlus2 } from 'lucide-react';

export default function RadicarExcusaPage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Botón de regreso y Encabezado */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/portal/mis-excusas')}
          className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-colors shadow-2xs"
          title="Volver a mis excusas"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-blue-900" />
            Radicación de Excusa Escolar (HU-02)
          </h2>
          <p className="text-xs text-slate-500">
            Diligencie la información para radicar formalmente la inasistencia a clases
          </p>
        </div>
      </div>

      {/* Formulario */}
      <FormularioRadicacion
        onExcusaRadicada={() => {
          // Callback si se desea
        }}
      />

    </div>
  );
}
