import { useState, useEffect } from 'react';
import { api } from '../api/client';

export function useCatalogos() {
  const [cursos, setCursos] = useState([]);
  const [motivos, setMotivos] = useState([]);
  const [vigencia, setVigencia] = useState('2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cursosRes, motivosRes, vigenciaRes] = await Promise.all([
          api.getCursos().catch(() => ({ cursos: [] })),
          api.getMotivos().catch(() => ({ motivos: [] })),
          api.getVigencia().catch(() => ({ vigencia: '2026' }))
        ]);

        if (cursosRes.cursos) setCursos(cursosRes.cursos);
        if (motivosRes.motivos) setMotivos(motivosRes.motivos);
        if (vigenciaRes.vigencia) setVigencia(vigenciaRes.vigencia);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  return { cursos, motivos, vigencia, loading };
}
